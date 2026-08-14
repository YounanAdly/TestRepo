import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../../../constants';
import { skipErrorToast } from '../../interceptors/http-context.tokens';
import { ResilientCrudService } from '../resilient-crud.service';
import {
  ApiEnvelope,
  OtpSessionResult,
  RefreshTokenResult,
  RegisterStartPayload,
  RegisterVerifyPayload,
  RegisterVerifyResult,
  RequestLoginOtpPayload,
  ResendOtpPayload,
  VerifyOtpPayload,
  VerifyOtpResult,
} from './auth.types';

/**
 * `/api/v1/auth` endpoint surface.
 *
 * Every method:
 * - Targets a `Constants.*` URL (no inline strings).
 * - Returns the full `ApiEnvelope<T>` so callers can branch on `isSuccess`.
 * - Passes `skipErrorToast()` so the OTP modal / login screen own the
 *   domain 4xx UI (wrong code, expired, locked, rate-limited, …) without
 *   a duplicate global toast firing.
 * - Goes through `ResilientCrudService.post()` so the project's adaptive
 *   write `timeout()` is applied uniformly (writes are never retried —
 *   we never replay a call that may have side-effects).
 *
 * Components must NOT import `HttpClient` directly to call these endpoints —
 * always go through this service.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService extends ResilientCrudService<never> {
  /** Step 1 of login — sends the OTP to the user's phone. */
  requestLoginOtp(payload: RequestLoginOtpPayload): Observable<ApiEnvelope<OtpSessionResult>> {
    return this.post<RequestLoginOtpPayload, ApiEnvelope<OtpSessionResult>>(
      Constants.loginRequestOtpUrl,
      payload,
      skipErrorToast(),
    );
  }

  /** Step 2 of login — verifies the OTP and returns the access token. */
  verifyOtp(payload: VerifyOtpPayload): Observable<ApiEnvelope<VerifyOtpResult>> {
    return this.post<VerifyOtpPayload, ApiEnvelope<VerifyOtpResult>>(
      Constants.verifyOtpUrl,
      payload,
      skipErrorToast(),
    );
  }

  /** Re-issue an OTP for an existing login/registration OTP session. */
  resendOtp(payload: ResendOtpPayload): Observable<ApiEnvelope<OtpSessionResult>> {
    return this.post<ResendOtpPayload, ApiEnvelope<OtpSessionResult>>(
      Constants.resendOtpUrl,
      payload,
      skipErrorToast(),
    );
  }

  /** Step 1 of registration — starts the OTP cycle for a new account. */
  startRegistration(payload: RegisterStartPayload): Observable<ApiEnvelope<OtpSessionResult>> {
    return this.post<RegisterStartPayload, ApiEnvelope<OtpSessionResult>>(
      Constants.registerStartUrl,
      payload,
      skipErrorToast(),
    );
  }

  /** Step 2 of registration — verifies the OTP and creates the account. No token returned. */
  verifyRegistration(payload: RegisterVerifyPayload): Observable<ApiEnvelope<RegisterVerifyResult>> {
    return this.post<RegisterVerifyPayload, ApiEnvelope<RegisterVerifyResult>>(
      Constants.registerVerifyUrl,
      payload,
      skipErrorToast(),
    );
  }

  /**
   * Rotates the access token cookie. The browser sends the existing refresh
   * cookie automatically; the server responds with `Set-Cookie` for both the
   * new access token and a new refresh token (rotation). Body carries only
   * the new expiry timestamp — the token itself is never exposed to JS.
   * Errors are NOT toasted because the `errorInterceptor` calls this internally
   * during 401-recovery and renders its own UX on failure.
   */
  refresh(): Observable<ApiEnvelope<RefreshTokenResult>> {
    return this.post<null, ApiEnvelope<RefreshTokenResult>>(
      Constants.refreshTokenUrl,
      null,
      skipErrorToast(),
    );
  }

  /**
   * Server-side session revocation. The server responds with `Set-Cookie`
   * headers that clear (Max-Age=0) the access + refresh cookies. Without
   * this call the cookie persists in the browser — "logout" from JS alone
   * is impossible because the cookies are HttpOnly.
   */
  logout(): Observable<ApiEnvelope<unknown>> {
    return this.post<null, ApiEnvelope<unknown>>(
      Constants.logoutUrl,
      null,
      skipErrorToast(),
    );
  }
}
