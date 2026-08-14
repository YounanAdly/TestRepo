import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthPromptService } from '../services/auth-prompt.service';

/**
 * Route guard for protected pages that should prompt guest users to log in
 * (instead of redirecting silently). Authenticated users pass through; guests
 * see the shared `LoginPromptDialogComponent` and can either continue to the
 * login page (with the original URL preserved as `returnUrl`) or cancel.
 */
export const loginPromptGuard: CanActivateFn = (_route, state) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  return inject(AuthPromptService).requireAuth(state.url);
};
