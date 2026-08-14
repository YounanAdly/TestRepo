import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Per-call interceptor opt-out tokens.
 *
 * Use these instead of URL allow-lists or custom headers when a single call
 * needs to bypass a cross-cutting concern (global spinner, error toast,
 * SSR transfer cache).
 *
 * Example:
 *   this.http.post(url, body, { context: skipLoader() });
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_TRANSFER_CACHE = new HttpContextToken<boolean>(() => false);

/** Disable the global loader spinner for this call (long-running uploads, polling, etc.). */
export const skipLoader = (ctx = new HttpContext()): HttpContext => ctx.set(SKIP_LOADER, true);

/** Suppress the auto-toast on transport / 5xx errors so the caller can render its own UI. */
export const skipErrorToast = (ctx = new HttpContext()): HttpContext => ctx.set(SKIP_ERROR_TOAST, true);

/** Exclude this GET from `withHttpTransferCache()` (sensitive endpoints, user-specific data). */
export const skipTransferCache = (ctx = new HttpContext()): HttpContext => ctx.set(SKIP_TRANSFER_CACHE, true);
