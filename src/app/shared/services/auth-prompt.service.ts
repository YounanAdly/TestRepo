import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LanguageService } from './language.service';

/**
 * Coordinates the "login required" prompt for guests trying to reach
 * authenticated-only routes or actions. Components and route guards call
 * `requireAuth(targetUrl)`; the service either lets them through (when the
 * user is already authenticated) or opens the modal and remembers the
 * target URL so the user can resume after login.
 */
@Injectable({ providedIn: 'root' })
export class AuthPromptService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);

  readonly isOpen = signal(false);
  private pendingReturnUrl: string | null = null;

  /**
   * Returns `true` when the user is authenticated. Otherwise opens the
   * modal, stores the requested URL, and returns `false` so the caller
   * (router guard or click handler) can abort the navigation.
   */
  requireAuth(returnUrl: string): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.pendingReturnUrl = returnUrl ?? null;
    this.isOpen.set(true);
    return false;
  }

  /**
   * User chose "Log in" in the modal — navigate to the language-prefixed
   * login route, passing the original target as router state so the login
   * page can resume there after a successful sign-in.
   */
  confirm(): void {
    const returnUrl = this.pendingReturnUrl;
    this.close();
    const lang = this.languageService.getCurrentLanguage() || 'en';
    void this.router.navigate(['/', lang, 'login'], {
      state: returnUrl ? { returnUrl } : undefined,
    });
  }

  /**
   * User dismissed the modal — close it and, when the prompt was triggered
   * by a direct URL access (no prior in-app navigation), fall back to the
   * home page so the URL bar stays consistent.
   */
  cancel(): void {
    const wasDirectAccess = this.router.lastSuccessfulNavigation === null;
    this.close();
    if (wasDirectAccess) {
      const lang = this.languageService.getCurrentLanguage() || 'en';
      void this.router.navigate(['/', lang, 'home']);
    }
  }

  private close(): void {
    this.isOpen.set(false);
    this.pendingReturnUrl = null;
  }
}
