import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseCrudService } from './base-crud.service';
import { NetworkService } from './network.service';

/**
 * `BaseCrudService` extension that applies the project's cross-cutting SLAs:
 *
 * - Reads: adaptive `timeout()` + 2 retries with exponential backoff (capped),
 *   honoring `Retry-After` on 429 / 503.
 * - Writes (POST / PUT / DELETE): `timeout()` only, never retried (not
 *   idempotent at the API layer).
 *
 * Feature services should extend this class instead of `BaseCrudService` so
 * every endpoint inherits the same behavior. Per-call ad-hoc `timeout()` /
 * `retry()` operators are forbidden by `api-calls.instructions.md` §13.
 */
@Injectable({ providedIn: 'root' })
export class ResilientCrudService<T> extends BaseCrudService<T> {
  private readonly net = inject(NetworkService);

  override get(apiUrl: string): Observable<T[]> {
    return super.get(apiUrl).pipe(
      timeout(this.net.readTimeoutMs()),
      retry({
        count: 2,
        delay: (err, retryIndex) => this.computeRetryDelay(err, retryIndex),
        resetOnSuccess: true,
      }),
    );
  }

  override getById(apiUrl: string, id: string | number): Observable<T> {
    return super.getById(apiUrl, id).pipe(
      timeout(this.net.readTimeoutMs()),
      retry({
        count: 2,
        delay: (err, retryIndex) => this.computeRetryDelay(err, retryIndex),
        resetOnSuccess: true,
      }),
    );
  }

  override create(apiUrl: string, item: T): Observable<T> {
    return super.create(apiUrl, item).pipe(timeout(this.net.writeTimeoutMs()));
  }

  override update(apiUrl: string, id: string | number, item: T): Observable<T> {
    return super.update(apiUrl, id, item).pipe(timeout(this.net.writeTimeoutMs()));
  }

  override delete(apiUrl: string, id: string | number): Observable<void> {
    return super.delete(apiUrl, id).pipe(timeout(this.net.writeTimeoutMs()));
  }

  /**
   * Typed `POST` with the project's write-side SLA applied (adaptive
   * `timeout`, never retried). Use this whenever the request body and
   * response body have different shapes — `create()` can't be reused
   * because it constrains both sides to the same `T`.
   *
   * `apiUrl` is the relative path; the environment base URL is prefixed
   * here so callers stay consistent with the rest of `BaseCrudService`.
   *
   * Pass an `HttpContext` from `http-context.tokens.ts` (e.g.
   * `skipErrorToast()` or `skipLoader()`) to opt out of cross-cutting
   * interceptors per the rules in `api-calls.instructions.md` §13.
   */
  protected post<TReq, TRes>(
    apiUrl: string,
    body: TReq,
    context?: HttpContext,
  ): Observable<TRes> {
    return this.http
      .post<TRes>(environment.AppConfig.apiBaseUrl + apiUrl, body, { context })
      .pipe(timeout(this.net.writeTimeoutMs()));
  }

  /**
   * Typed `GET` with the project's read-side SLA applied (adaptive
   * `timeout` + 2 retries with exponential backoff, honoring `Retry-After`
   * on `429` / `503`). Use this when the response shape isn't an array —
   * `get()` constrains the result to `T[]` because it's the generic CRUD
   * list verb.
   *
   * Reactive reads should still prefer `httpResource()`; this helper is
   * for the one-shot imperative-read case (e.g. fetching profile data
   * before navigating after the user picks an account).
   *
   * Pass an `HttpContext` from `http-context.tokens.ts` to opt out of
   * cross-cutting interceptors per the rules in `api-calls.instructions.md` §13.
   */
  protected getOne<TRes>(
    apiUrl: string,
    context?: HttpContext,
  ): Observable<TRes> {
    return this.http
      .get<TRes>(environment.AppConfig.apiBaseUrl + apiUrl, { context })
      .pipe(
        timeout(this.net.readTimeoutMs()),
        retry({
          count: 2,
          delay: (err, retryIndex) => this.computeRetryDelay(err, retryIndex),
          resetOnSuccess: true,
        }),
      );
  }

  /**
   * Retry delay strategy:
   * - 429 / 503 → honor `Retry-After` (seconds) when present, otherwise exponential backoff.
   * - 5xx (other) → exponential backoff.
   * - Anything else → don't retry (rethrow).
   */
  private computeRetryDelay(err: unknown, retryIndex: number): Observable<number> {
    if (!(err instanceof HttpErrorResponse)) {
      return throwError(() => err);
    }
    if (err.status === 429 || err.status === 503) {
      const retryAfterSeconds = Number(err.headers.get('Retry-After'));
      const retryAfterMs = retryAfterSeconds * 1000;
      const delayMs = Number.isFinite(retryAfterMs) && retryAfterMs > 0
        ? retryAfterMs
        : 1000 * 2 ** retryIndex;
      return timer(delayMs);
    }
    if (err.status >= 500) {
      return timer(500 * 2 ** retryIndex);
    }
    return throwError(() => err);
  }
}
