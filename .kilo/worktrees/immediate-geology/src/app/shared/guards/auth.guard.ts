import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // ✅ don't block on server
  if (!isPlatformBrowser(platformId)) return true;

  if (authService.isAuthenticated()) return true;

  if (state.url.includes('/sign-in')) return true;

  const lang = state.url.split('/')[1] || 'en';

  router.navigate(['/', lang, 'sign-in'], {
    state: { returnUrl: state.url } // ✅ NOT query params
  });

  return false;
};
