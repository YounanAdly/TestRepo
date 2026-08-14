import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppConfig } from '../../config/app.config';
import { AuthService } from '../services/auth.service';
import { CommonService } from '../services/common.service';

/**
 * HTTP interceptor that attaches gateway / context / auth headers and enables
 * credentialed requests for our API.
 *
 * Auth model (verified against `/api/v1/auth/otp/verify` and
 * `/api/v1/auth/token/refresh`):
 * - The backend sets an HttpOnly `refresh_token` cookie on verify-otp. The
 *   browser auto-attaches that cookie on `/token/refresh` and `/logout` calls
 *   because `withCredentials: true` is set below. JS never touches the cookie.
 * - The access JWT itself is still delivered in the verify-otp / refresh
 *   response body (`result.accessToken`) — protected endpoints REQUIRE
 *   `Authorization: Bearer <jwt>` and a cookie-only call returns 401.
 *   `AuthService` holds the JWT in an in-memory signal (never persisted) and
 *   `getAccessToken()` returns it; this interceptor attaches the header.
 *
 * The interceptor never overrides a pre-existing `Authorization` header on
 * the request so callers can opt into a one-shot custom bearer if needed.
 *
 * Headers added (API calls only):
 * - `X-Api-Subscription-Key`: gateway routing identifier.
 * - `Authorization: Bearer <token>`: when an in-memory JWT is present.
 * Headers added (all calls):
 * - `Accept-Language`: current UI language (fallback to default).
 * - `x-source`: application source identifier (`portal`).
 *
 * "Targeting our API" is detected by full URL prefix when `apiBaseUrl` is set
 * (production), or by the `/api/` path prefix when `apiBaseUrl` is empty
 * (development — the dev-server proxy forwards `/api/*` to the backend).
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const commonService = inject(CommonService);
  const authService = inject(AuthService);
  const lang = commonService.getCookie('lang') || AppConfig.defaultLanguage;
  const apiBaseUrl = environment.AppConfig.apiBaseUrl ?? '';
  const isApiCall = apiBaseUrl
    ? req.url.startsWith(apiBaseUrl)
    : req.url.startsWith('/api/');

  const setHeaders: Record<string, string> = {
    'Accept-Language': lang || AppConfig.defaultLanguage,
    'x-source': AppConfig.source || 'portal',
  };
  if (isApiCall && environment.AppConfig.subscriptionKey) {
    setHeaders['X-Api-Subscription-Key'] = environment.AppConfig.subscriptionKey;
  }
  if (isApiCall && !req.headers.has('Authorization')) {
    const token = authService.getAccessToken();
    if (token) {
      setHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  if (isApiCall && !req.headers.has('X-Account-Id')) {
    const accountId = authService.getSelectedAccountId();
    if (accountId) {
      setHeaders['X-Account-Id'] = accountId;
    }
  }

  // `withCredentials: true` on our API only — lets the HttpOnly `refresh_token`
  // cookie ride along on `/token/refresh` and `/logout`, and keeps Azure's
  // `ARRAffinity*` sticky cookies flowing. Scoped to our API so we never leak
  // any browser-set cookies to third-party origins (translation files, CDNs).
  const withCredentials = isApiCall ? true : req.withCredentials;
  const withHeaders = req.clone({ setHeaders, withCredentials });

  return next(withHeaders);
}


