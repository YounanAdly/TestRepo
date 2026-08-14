import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { Constants } from '../../constants';
import { AuthService } from '../services/auth.service';
import { LanguageService } from '../services/language.service';
import { ToastService } from '../services/toast.service';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

/** URL fragments for auth bootstrap endpoints we must never auto-refresh on (would loop). */
const AUTH_BOOTSTRAP_PATHS = [
  Constants.refreshTokenUrl,
  Constants.logoutUrl,
  Constants.loginRequestOtpUrl,
  Constants.verifyOtpUrl,
  Constants.resendOtpUrl,
  Constants.registerStartUrl,
  Constants.registerVerifyUrl,
];

/**
 * Centralized HTTP error interceptor.
 *
 * Strategy:
 *   - 401 (on a normal API call)  → attempt single-flight token refresh
 *                                    via `AuthService.refresh()`. On success,
 *                                    retry the original request once. On
 *                                    failure, clear local session and send
 *                                    to /:lang/login.
 *   - 401 (on an auth-bootstrap call) → skip refresh (would loop), clear
 *                                       local session, send to /:lang/login.
 *   - 403  → send to /:lang/not-found.
 *   - 422  → swallow here; components/resources surface field-level messages.
 *   - 0 / 503        → toast "network" message.
 *   - 5xx (other)    → toast "server" message.
 *
 * Per-call opt-out via `context: skipErrorToast()` lets a caller render
 * domain-specific UI for transport / 5xx errors without a duplicate toast.
 * 401 / 403 are still handled (session security must not be overridable).
 */
export function errorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);
  const toast = inject(ToastService);
  const lang = inject(LanguageService);
  const authService = inject(AuthService);
  const skipToast = req.context.get(SKIP_ERROR_TOAST);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const currentLang = lang.getCurrentLanguage() || 'en';

      if (err.status === 401) {
        const isBootstrap = AUTH_BOOTSTRAP_PATHS.some((path) => req.url.includes(path));
        if (isBootstrap) {
          authService.clearLocalSession();
          void router.navigate([`/${currentLang}/login`]);
          return throwError(() => err);
        }
        return authService.refresh().pipe(
          switchMap((ok) => {
            if (!ok) {
              void router.navigate([`/${currentLang}/login`]);
              return throwError(() => err);
            }
            // Re-clone with the freshly-minted JWT — interceptors don't re-run
            // on `next(req)`, so the original request still carries the expired
            // Authorization header that just 401'd.
            const token = authService.getAccessToken();
            const retried = token
              ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
              : req;
            return next(retried);
          }),
        );
      }

      switch (err.status) {
        case 403:
          void router.navigate([`/${currentLang}/not-found`]);
          break;

        case 422:
          break;

        case 0:
        case 503:
          if (!skipToast) {
            toast.error('errors.networkTitle', 'errors.networkDetail');
          }
          break;

        default:
          if (err.status >= 500 && !skipToast) {
            toast.error('errors.serverTitle', 'errors.serverDetail');
          }
      }

      return throwError(() => err);
    }),
  );
}
