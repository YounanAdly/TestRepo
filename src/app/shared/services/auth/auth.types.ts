/**
 * Auth API request / response shapes.
 *
 * Every endpoint under `/api/v1/auth` returns the same outer envelope; only
 * the `result` payload changes per route. Keep these types as the single
 * source of truth — components and services should NEVER import inline
 * `any` shapes from elsewhere.
 */

/** Standard backend response envelope. */
export interface ApiEnvelope<T> {
  result: T | null;
  isSuccess: boolean;
  isSystemError: boolean;
  errorMessageEn: string | null;
  errorMessageAr: string | null;
  code: string;
}

// ── OTP ─────────────────────────────────────────────────────────────────────

/** `/login/request-otp` and `/otp/resend` and `/register` all return this shape. */
export interface OtpSessionResult {
  /**
   * Legacy OTP correlation token.
   *
   * Login cycle no longer depends on this value and verifies/resends by phone.
   * Registration flows may still return it, so keep it optional for compatibility.
   */
  correlationId?: string;
  /** ISO 8601 UTC timestamp when this OTP expires. */
  expiresAtUtc: string;
  /** Phone number masked for display (e.g. `+968 xxxx8226`). */
  maskedPhone: string;
  /** DEV ONLY — actual OTP code returned until SMS integration is enabled. */
  devCode?: string;
}

// ── Login ───────────────────────────────────────────────────────────────────

export interface RequestLoginOtpPayload {
  /** 8-digit Omani mobile number, no country code (server normalizes to `+9685XXXXXXX`). */
  phone: string;
}

export interface VerifyOtpPayload {
  /** 8-digit Omani mobile number, no country code. */
  phone: string;
  /** 4-digit OTP code. */
  code: string;
}

export type ResendOtpPayload = { phone: string };

/** `/otp/verify` success result.
 *
 *  Dual-delivery, verified end-to-end:
 *   - `accessToken` JWT lives in the response body (mobile reads it from here;
 *     web also reads it, but holds it ONLY in `AuthService`'s in-memory signal
 *     — never persisted to JS-readable storage).
 *   - The backend additionally sets an HttpOnly `refresh_token` cookie used
 *     by `/api/v1/auth/token/refresh` to rotate access tokens. The browser
 *     attaches and rotates this cookie automatically; JS never sees it.
 *
 *  Identity fields (`contactId`, `accountType`) are NOT in the body — they
 *  live as `contact_id` / `account_type` claims inside the JWT. `AuthService`
 *  decodes the JWT on `setSession` to populate non-secret session metadata. */
export interface VerifyOtpResult {
  /** Bearer JWT (~1h). Held in-memory by `AuthService` and attached as
   *  `Authorization: Bearer <token>` by `authInterceptor`. Never persisted. */
  accessToken: string;
  /** ISO 8601 UTC timestamp when the access token expires. Persisted (non-secret). */
  accessTokenExpiresAtUtc: string;
}

/** `/auth/token/refresh` success result — returns the rotated JWT + new expiry.
 *  Same shape as `VerifyOtpResult`. The `refresh_token` cookie is rotated
 *  server-side via `Set-Cookie` (single-use; the previous cookie is invalidated). */
export interface RefreshTokenResult {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
}

/** Decoded JWT payload (the standard claims plus our backend's custom ones).
 *  Source-of-truth for `contactId` / `accountType` post-cookie-auth migration:
 *  the verify-otp / refresh response bodies no longer carry these fields. */
export interface JwtClaims {
  /** Subject — identical to `contact_id` for this backend. */
  sub: string;
  /** Stable contact (account holder) identifier. */
  contact_id: string;
  /** Backend enum, delivered as a STRING (`"Personal"` | `"Organization"`)
   *  even though `/register/verify` returns the numeric form. */
  account_type: 'Personal' | 'Organization' | string;
  /** Phone number with country code, e.g. `+96850000000`. */
  phone: string;
  /** Unique JWT id (rotation token). */
  jti: string;
  /** Not-before (seconds since epoch). */
  nbf: number;
  /** Expiry (seconds since epoch) — mirrors `accessTokenExpiresAtUtc`. */
  exp: number;
  iss: string;
  aud: string;
}

// ── Registration ────────────────────────────────────────────────────────────

/** 0 = personal, 1 = organization (server enum). */
export type RegisterAccountType = 0 | 1;

/** `/register` step 1 — start the OTP cycle. */
export interface RegisterStartPayload {
  phone: string;
  civilId: string;
}

/** `/register/verify` step 2 — common fields. */
interface RegisterVerifyBase {
  code: string;
  firstName: string;
  lastName: string;
  civilId: string;
  email: string;
  address?: string;
  governorateId?: string;
  alWilayaId?: string;
  phone: string;
}

/** Personal registration variant. */
export interface RegisterVerifyPersonalPayload extends RegisterVerifyBase {
  accountType: 0;
}

/** Organization registration variant — adds the company subset. */
export interface RegisterVerifyOrganizationPayload extends RegisterVerifyBase {
  accountType: 1;
  companyName: string;
  crNumber: string;
  companyPhone: string;
  companyAddress?: string;
}

export type RegisterVerifyPayload =
  | RegisterVerifyPersonalPayload
  | RegisterVerifyOrganizationPayload;

/** `/register/verify` success result — registration does NOT issue a token. */
export interface RegisterVerifyResult {
  contactId: string;
  /** 0 = personal, 1 = organization (server enum). */
  accountType: RegisterAccountType;
  maskedPhone: string;
}
