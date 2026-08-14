import { isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Constants } from '../../constants';
import { AuthApiService } from './auth/auth-api.service';
import { JwtClaims, VerifyOtpResult } from './auth/auth.types';
import { BaseCrudService } from './base-crud.service';
import { LanguageService } from './language.service';
import { ProfileApi } from './profile/profile-api.service';
import { ProfileDetails } from './profile/profile.types';
import { ToastService } from './toast.service';

/** Persisted session metadata keys — non-secret bits only (expiry, contactId,
 *  accountType). Namespaced under `auth_*`. Stored in `sessionStorage`.
 *
 *  The access JWT itself is NOT persisted — it lives only in the in-memory
 *  `accessToken` signal so XSS can't read it from storage. On page reload the
 *  signal is empty; the first protected call 401s and the `errorInterceptor`
 *  single-flight `refresh()` repopulates it via the HttpOnly `refresh_token`
 *  cookie that the browser still has. */
const TOKEN_EXPIRY_KEY = 'auth_token_exp';
const CONTACT_ID_KEY = 'auth_contact_id';
const ACCOUNT_TYPE_KEY = 'auth_account_type';
/** Account chosen on the post-OTP `select-account` screen. Non-secret. */
const SELECTED_ACCOUNT_ID_KEY = 'auth_selected_account_id';
/** Legacy keys (pre-cookie auth) — cleared on startup so stale secrets can't linger. */
const LEGACY_TOKEN_KEY = 'auth_token';
const LEGACY_CONTACT_INFO_KEY = 'auth_contact';
const LEGACY_ACCESS_TOKEN_KEY = 'auth_access_token';

/** Auto-logout after this many ms of user inactivity. */
const IDLE_LIMIT_MS = 15 * 60 * 1000;
/** Activity events refresh the idle timer at most once per this many ms. */
const IDLE_REFRESH_THROTTLE_MS = 5_000;
/** DOM events that count as user activity for the idle watchdog. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/** Shape consumed by `setSession` after a successful OTP verification. The
 *  envelope's body now carries only `accessToken` + `accessTokenExpiresAtUtc`;
 *  identity (`contactId`, `accountType`) is decoded from the JWT claims. */
export type AuthSession = VerifyOtpResult;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseCrudService = inject(BaseCrudService);
  private readonly authApi = inject(AuthApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileApi = inject(ProfileApi);

  /** Reactive expiry signal — `null` when no session is active. */
  private readonly tokenExpiry = signal<Date | null>(this.readStoredExpiry());
  /** In-memory access JWT. Never persisted — XSS can't read it from storage. */
  private readonly accessToken = signal<string | null>(null);
  /** In-memory only — never persisted (was previously cached in localStorage, which is XSS-readable). */
  readonly contactInfo = signal<unknown | null>(null);
  /** Id of the account chosen on the post-OTP `select-account` screen. */
  private readonly selectedAccountId = signal<string | null>(this.readStoredSelectedAccountId());
  /**
   * Reactive profile resource — auto-fetches once when `selectedAccountId` is
   * set (after login or page reload). The existing 401-then-refresh interceptor
   * cycle handles JWT availability on first load. `set()` lets `select-account`
   * prime the cache immediately after its own fetch so no duplicate request
   * fires when the user navigates to the next page.
   */
  private readonly profileResource = rxResource<ProfileDetails | null, string | null>({
    params: () => this.selectedAccountId(),
    stream: ({ params }) => {
      if (!params || !this.isAuthenticated()) {
        return of(null);
      }
      return this.profileApi.getProfileDetails().pipe(
        map(envelope => envelope.isSuccess && envelope.result ? envelope.result : null),
        catchError(() => of(null)),
      );
    },
    defaultValue: null,
  });

  /** Reactive profile signal — null while loading or when no account is selected. */
  readonly profile = computed<ProfileDetails | null>(() => this.profileResource.value());

  /** True while the profile is being fetched for the active account. */
  readonly isProfileLoading = computed(() => this.profileResource.isLoading());

  private idleTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastIdleRefresh = 0;
  private readonly onActivity = (): void => this.refreshIdleTimer();
  private idleListenersAttached = false;

  /** Single-flight refresh — concurrent 401s share one in-flight refresh call. */
  private pendingRefresh: Observable<boolean> | null = null;

  /**
   * True only when an unexpired session is known to exist on the client.
   * Derived from the persisted expiry timestamp (not from the in-memory JWT)
   * so it stays true across page reloads — the HttpOnly `refresh_token` cookie
   * lets us mint a new access JWT on demand. If the server invalidates the
   * cookie out-of-band, the next API call's 401 triggers a refresh attempt
   * and clears local state on failure.
   */
  readonly isAuthenticated = computed(() => {
    const expiry = this.tokenExpiry();
    if (!expiry) {
      return false;
    }
    return expiry.getTime() > Date.now();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // One-time purge of pre-cookie-auth artifacts so stale secrets/PII don't linger on existing devices.
      sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(LEGACY_CONTACT_INFO_KEY);
      }
    }
    effect(() => {
      if (this.isAuthenticated()) {
        this.armIdleTimer();
      } else {
        this.disarmIdleTimer();
      }
    });
  }

  /**
   * Persist session metadata after `AuthApiService.verifyOtp` succeeds.
   * The JWT goes to an in-memory signal only; `contactId` and `accountType`
   * are decoded from the JWT claims (the response body no longer carries
   * them post-cookie-auth migration) and persisted as non-secret metadata.
   * Rejects sessions without a valid future expiry or a parseable JWT.
   */
  setSession(session: AuthSession): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const expiry = this.parseExpiry(session.accessTokenExpiresAtUtc);
    if (!expiry || expiry.getTime() <= Date.now()) {
      this.clearLocalSession();
      return;
    }
    const claims = decodeJwtClaims(session.accessToken);
    if (!claims) {
      this.clearLocalSession();
      return;
    }
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, session.accessTokenExpiresAtUtc);
    sessionStorage.setItem(CONTACT_ID_KEY, claims.contact_id);
    sessionStorage.setItem(ACCOUNT_TYPE_KEY, String(mapAccountType(claims.account_type)));
    this.accessToken.set(session.accessToken);
    this.tokenExpiry.set(expiry);
  }

  /** Returns the stored session metadata or `null` if signed out. */
  getSession(): { contactId: string; accountType: number } | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const contactId = sessionStorage.getItem(CONTACT_ID_KEY);
    const accountTypeRaw = sessionStorage.getItem(ACCOUNT_TYPE_KEY);
    if (!contactId || accountTypeRaw == null) {
      return null;
    }
    return { contactId, accountType: Number(accountTypeRaw) };
  }

  /**
   * Signs the user out everywhere. Calls the backend so the HttpOnly
   * `refresh_token` cookie is cleared server-side (the only way — JS cannot
   * delete HttpOnly cookies), then clears local session state regardless of
   * the API result so the UI never shows a half-logged-in state. The returned
   * observable completes once both have happened; callers can subscribe to
   * await it or fire-and-forget.
   */
  logout(): Observable<void> {
    const finish = (): void => this.clearLocalSession();
    return this.authApi.logout().pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(finish),
    );
  }

  /**
   * App-bootstrap refresh. If a session is still alive (`isAuthenticated()`
   * reads the persisted expiry from `sessionStorage`), mint a fresh access
   * JWT via the HttpOnly `refresh_token` cookie BEFORE the first protected
   * call fires. Wired into `provideAppInitializer` so the app waits for it
   * to complete during startup — eliminates the otherwise-visible
   * 401-then-retry round-trip on every page reload (the in-memory JWT
   * signal is empty after reload, but the refresh cookie still exists).
   * No-op on the server and when no session is active. Errors are swallowed
   * (`refresh()` already handles cleanup via `clearLocalSession()`).
   */
  bootstrap(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId) || !this.isAuthenticated()) {
      return of(false);
    }
    return this.refresh();
  }

  /**
   * Single-flight refresh of the access JWT. The browser auto-sends the
   * HttpOnly `refresh_token` cookie; the server rotates it via `Set-Cookie`
   * (single-use) and returns a fresh JWT in the body. Concurrent callers
   * share one in-flight request so we never fire two refreshes for the
   * same expired session. Emits `true` on success, `false` on failure.
   */
  refresh(): Observable<boolean> {
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }
    this.pendingRefresh = this.authApi.refresh().pipe(
      map((envelope) => {
        if (!envelope.isSuccess || !envelope.result) {
          this.clearLocalSession();
          return false;
        }
        const expiry = this.parseExpiry(envelope.result.accessTokenExpiresAtUtc);
        if (!expiry || expiry.getTime() <= Date.now()) {
          this.clearLocalSession();
          return false;
        }
        sessionStorage.setItem(TOKEN_EXPIRY_KEY, envelope.result.accessTokenExpiresAtUtc);
        this.accessToken.set(envelope.result.accessToken);
        this.tokenExpiry.set(expiry);
        return true;
      }),
      catchError(() => {
        this.clearLocalSession();
        return of(false);
      }),
      finalize(() => { this.pendingRefresh = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.pendingRefresh;
  }

  /**
   * Clears every persisted session-metadata key and resets reactive state.
   * Does NOT call the backend — use `logout()` when the server should also
   * be notified. Used internally by `refresh()` failure paths and the
   * `errorInterceptor` 401 fallback (cookie is already invalid server-side).
   */
  clearLocalSession(): void {
    this.contactInfo.set(null);
    this.accessToken.set(null);
    // Setting selectedAccountId to null causes profileResource.params() to return
    // null → the stream returns of(null) → profile() clears reactively.
    this.selectedAccountId.set(null);
    if (!isPlatformBrowser(this.platformId)) {
      this.tokenExpiry.set(null);
      return;
    }
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(CONTACT_ID_KEY);
    sessionStorage.removeItem(ACCOUNT_TYPE_KEY);
    sessionStorage.removeItem(SELECTED_ACCOUNT_ID_KEY);
    this.tokenExpiry.set(null);
  }

  /**
   * Returns the bearer access token to attach as `Authorization: Bearer <token>`,
   * or `null` when no JWT is currently held in memory.
   *
   * The JWT is held ONLY in the in-memory `accessToken` signal — never in
   * `sessionStorage` / `localStorage` — so XSS cannot exfiltrate it. After a
   * page reload the signal is empty; the first protected call will 401 and
   * the `errorInterceptor` single-flight `refresh()` repopulates it via the
   * HttpOnly `refresh_token` cookie that the browser still has.
   */
  getAccessToken(): string | null {
    return this.accessToken();
  }

  /**
   * Returns cached contact info synchronously if available, otherwise null.
   */
  getContactInfo<T = unknown>(): T | null {
    return (this.contactInfo() as T | null);
  }

  /**
   * Loads contact info once from the API and caches it. Subsequent calls
   * return the cached value without hitting the API again.
   * @returns Observable that emits the contact info (cached on subsequent calls)
   */
  fetchContactInfo<T = unknown>(): Observable<T[]> {
    const cached = this.contactInfo();
    if (cached != null) {
      return of(cached as T[]);
    }
    return this.baseCrudService.get(Constants.getContactInfoUrl).pipe(
      tap((info) => this.setContact(info))
    );
  }

  /**
   * DEV ONLY: prints the OTP `devCode` returned by the auth API while SMS
   * integration is not yet enabled. No-ops in production builds so the code
   * never leaks to a real user's console.
   */
  logDevCode(devCode: string | undefined | null): void {
    if (environment.production || !devCode) {
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      // eslint-disable-next-line no-console
      console.info('[Marafiq][DEV OTP]', devCode);
    }
  }

  /** Updates the in-memory contact signal. Never persisted to storage. */
  private setContact(info: unknown): void {
    this.contactInfo.set(info);
  }

  /** Clears the in-memory contact signal. */
  private clearContact(): void {
    this.contactInfo.set(null);
  }

  private readStoredExpiry(): Date | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const raw = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    return this.parseExpiry(raw);
  }

  private readStoredSelectedAccountId(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return sessionStorage.getItem(SELECTED_ACCOUNT_ID_KEY);
  }

  /** Returns the account id picked on the post-OTP `select-account` screen. */
  getSelectedAccountId(): string | null {
    return this.selectedAccountId();
  }

  /** Reactive accessor for the selected account id signal. */
  readonly selectedAccountId$ = this.selectedAccountId.asReadonly();

  /** Persists the chosen account id so the dashboard can read it after the
   *  user picks an account on the post-OTP `select-account` screen. */
  setSelectedAccountId(id: string): void {
    this.selectedAccountId.set(id);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(SELECTED_ACCOUNT_ID_KEY, id);
    }
  }

  /** Returns the profile details for the active account, or `null` while
   *  loading / before the resource has resolved. Prefer reading the reactive
   *  `profile` signal directly in templates and `computed()`/`effect()`. */
  getProfile(): ProfileDetails | null {
    return this.profile();
  }

  /** Primes the profile cache with an already-fetched value (e.g. from
   *  `select-account` which fetches profile as part of its splash flow).
   *  `profileResource` reacts to `selectedAccountId` changes and will NOT
   *  fire a duplicate fetch as long as the resource already has a value. */
  setProfile(profile: ProfileDetails | null): void {
    this.profileResource.set(profile);
  }

  private parseExpiry(raw: string | null | undefined): Date | null {
    if (!raw) {
      return null;
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // ── Idle watchdog ────────────────────────────────────────────────────────

  private armIdleTimer(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.idleListenersAttached) {
      for (const evt of ACTIVITY_EVENTS) {
        document.addEventListener(evt, this.onActivity, { passive: true, capture: true });
      }
      this.idleListenersAttached = true;
    }
    this.lastIdleRefresh = Date.now();
    this.scheduleIdleLogout();
  }

  private disarmIdleTimer(): void {
    if (this.idleTimeoutId !== null) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
    if (!isPlatformBrowser(this.platformId) || !this.idleListenersAttached) {
      return;
    }
    for (const evt of ACTIVITY_EVENTS) {
      document.removeEventListener(evt, this.onActivity, { capture: true } as EventListenerOptions);
    }
    this.idleListenersAttached = false;
  }

  private refreshIdleTimer(): void {
    const now = Date.now();
    if (now - this.lastIdleRefresh < IDLE_REFRESH_THROTTLE_MS) {
      return;
    }
    this.lastIdleRefresh = now;
    this.scheduleIdleLogout();
  }

  private scheduleIdleLogout(): void {
    if (this.idleTimeoutId !== null) {
      clearTimeout(this.idleTimeoutId);
    }
    this.idleTimeoutId = setTimeout(() => this.onIdleExpired(), IDLE_LIMIT_MS);
  }

  private onIdleExpired(): void {
    if (!this.isAuthenticated()) {
      return;
    }
    // Fire-and-forget the server-side logout so the cookie is cleared even though
    // the user is, by definition, no longer interacting with the page.
    this.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.toast.warn('errors.unauthorizedTitle', 'errors.unauthorizedDetail');
    const lang = this.languageService.getCurrentLanguage() || 'en';
    void this.router.navigate(['/', lang, 'login']);
  }
}

// ── JWT helpers ────────────────────────────────────────────────────────────

/** Decode a JWT's payload claims without verifying the signature (server-trust
 *  model — the server-issued JWT is the source of truth; we just read its
 *  identity claims for UI use). Returns `null` for any malformed input. */
function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    // base64url → base64 + padding
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** The backend's JWT claim `account_type` is a STRING (`"Personal"` / `"Organization"`)
 *  while `/register/verify` returns the numeric form (`0` / `1`). Normalize to
 *  the numeric enum everywhere downstream. */
function mapAccountType(claim: JwtClaims['account_type'] | number | undefined): number {
  if (typeof claim === 'number') {
    return claim;
  }
  if (claim === 'Personal') {
    return 0;
  }
  if (claim === 'Organization') {
    return 1;
  }
  return 0;
}


