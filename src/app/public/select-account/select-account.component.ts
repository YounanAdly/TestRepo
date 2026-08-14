import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, finalize, timer } from 'rxjs';
import { PostAuthSplashComponent } from '../../shared/components/post-auth-splash/post-auth-splash.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { AuthService } from '../../shared/services/auth.service';
import { ProfileApi } from '../../shared/services/profile/profile-api.service';
import { ProfileAccount } from '../../shared/services/profile/profile.types';
import { ToastService } from '../../shared/services/toast.service';

type AccountVariant = 'personal' | 'company';

interface SelectableAccount {
  readonly id: string;
  readonly name: string;
  readonly typeKey: string;
  readonly variant: AccountVariant;
  readonly initials: string;
  readonly isPrimary: boolean;
}

/** Minimum splash visibility so the brand transition doesn't flash on fast networks. */
const MIN_SPLASH_MS = 1500;

@Component({
  selector: 'app-select-account',
  standalone: true,
  imports: [TranslateModule, NgOptimizedImage, PostAuthSplashComponent, SkeletonLoaderComponent],
  templateUrl: './select-account.component.html',
  styleUrl: './select-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAccountComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly bgImage = 'assets/images/bgImage.png';
  readonly logoCard = 'assets/images/logoCard.svg';
  readonly logoNav = 'assets/images/logoNav.svg';

  /** Reactive read of the accounts the signed-in contact can switch between. */
  protected readonly accountsResource = this.profileApi.accounts();

  /** API rows mapped to the view model the template binds against. */
  protected readonly accounts = computed<SelectableAccount[]>(() => {
    const rows = this.accountsResource.value()?.result ?? [];
    return rows.map((row) => this.toSelectable(row));
  });

  /** True when the envelope came back with `isSuccess: false` (domain failure). */
  protected readonly accountsEnvelopeError = computed(() => {
    const envelope = this.accountsResource.value();
    return envelope ? envelope.isSuccess === false : false;
  });

  /**
   * Currently-highlighted card. Defaults to the previously stored account
   * (when still valid), otherwise the primary account, otherwise the first
   * row. Falls back to `null` while the list is empty / loading.
   */
  protected readonly selectedId = linkedSignal<SelectableAccount[], string | null>({
    source: () => this.accounts(),
    computation: (rows, prev) => {
      if (!rows.length) {
        return null;
      }
      if (prev?.value && rows.some((row) => row.id === prev.value)) {
        return prev.value;
      }
      const stored = this.authService.getSelectedAccountId();
      if (stored && rows.some((row) => row.id === stored)) {
        return stored;
      }
      const primary = rows.find((row) => row.isPrimary);
      return (primary ?? rows[0]).id;
    },
  });

  readonly isNavigating = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.authService.isAuthenticated()) {
      const lang = this.route.snapshot.paramMap.get('lang') || 'en';
      this.router.navigateByUrl(`/${lang}/login`);
    }
  }

  selectAccount(account: SelectableAccount): void {
    if (this.isNavigating()) {
      return;
    }
    this.selectedId.set(account.id);
    // Persist BEFORE the request so `authInterceptor` reads the chosen id
    // from `AuthService.getSelectedAccountId()` and attaches `X-Account-Id`.
    this.authService.setSelectedAccountId(account.id);
    this.isNavigating.set(true);

    const lang = this.route.snapshot.paramMap.get('lang') || 'en';
    const target = this.readReturnUrl() ?? `/${lang}/dashboard`;

    // Run the profile fetch in parallel with a minimum splash window so the
    // brand transition doesn't flicker on fast networks.
    combineLatest([
      this.profileApi.getProfileDetails(),
      timer(MIN_SPLASH_MS),
    ])
      .pipe(
        finalize(() => {
          if (this.isNavigating() && this.router.url.includes('/select-account')) {
            this.isNavigating.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ([envelope]) => {
          if (envelope.isSuccess && envelope.result) {
            this.authService.setProfile(envelope.result);
            void this.router.navigateByUrl(target);
            return;
          }
          this.authService.setProfile(null);
          this.toast.error(
            'selectAccount.errors.profileFailedTitle',
            'selectAccount.errors.profileFailedDetail',
            envelope,
          );
          this.isNavigating.set(false);
        },
        error: () => {
          // Transport errors (5xx / 0 / 503 / timeout) are toasted by
          // `errorInterceptor`; just release the splash so the user can retry.
          this.authService.setProfile(null);
          this.isNavigating.set(false);
        },
      });
  }

  trackAccount = (_index: number, account: SelectableAccount): string => account.id;

  /**
   * Maps an API row to the view model. The avatar always renders the
   * 2-letter initials computed from `name` — `accountType === 2` keeps
   * the dark teal disc + cream glyph (matches the Figma Company variant);
   * anything else renders the lighter Personal variant (white disc with a
   * teal border + teal glyph). Backend enum: `'1'` = personal, `'2'` =
   * organization.
   */
  private toSelectable(row: ProfileAccount): SelectableAccount {
    const variant: AccountVariant = row.accountType === 2 || row.accountType === '2' ? 'company' : 'personal';
    return {
      id: row.accountId,
      name: row.name,
      typeKey: variant === 'company' ? 'selectAccount.types.company' : 'selectAccount.types.personal',
      variant,
      initials: computeInitials(row.name),
      isPrimary: row.isPrimary,
    };
  }

  private readReturnUrl(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const state = window.history.state as { returnUrl?: string } | null;
    const candidate = state?.returnUrl;
    return candidate && candidate.startsWith('/') ? candidate : null;
  }
}

/**
 * 2-letter avatar initials from `name`. Multi-word names use the first
 * letter of the first two words (e.g. `Ahmed Ali` → `AA`); single-word
 * names use the first two letters (e.g. `Younan` → `YO`). Falls back to
 * `?` when the name is blank.
 */
function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

