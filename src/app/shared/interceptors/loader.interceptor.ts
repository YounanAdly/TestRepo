import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { SKIP_LOADER } from './http-context.tokens';

/**
 * HTTP interceptor that toggles a global loading indicator while requests are in-flight.
 * - Per-call opt-out via `context: skipLoader()` for long-running uploads,
 *   typeahead suggestions, or any call that owns its own progress UI.
 * - Increments loader on request, decrements when the request completes.
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADER)) {
    return next(req);
  }
  const loader = inject(LoaderService);
  loader.show();
  return next(req).pipe(
    finalize(() => loader.hide())
  );
};
