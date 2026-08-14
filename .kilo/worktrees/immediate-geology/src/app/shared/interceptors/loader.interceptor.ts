import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { Constants } from '../../constants';

/**
 * HTTP interceptor that toggles a global loading indicator while requests are in-flight.
 * - Skips upload/delete endpoints to avoid noisy spinners for long transfers.
 * - Increments loader on request, decrements when the request completes.
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  if (req.url.includes(Constants.uploadAttachmentUrl) || req.url.includes(Constants.deleteAttachmentUrl)) {
    return next(req);
  }
  loader.show();
  return next(req).pipe(
    finalize(() => loader.hide())
  );
};
