import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../../../constants';
import { ResilientCrudService } from '../resilient-crud.service';
import { NocSubmitResponse } from './noc.types';

/**
 * `/api/v1/services/noc` endpoint surface.
 *
 * Submission uses `multipart/form-data` (a raw `FormData` body) because the
 * request carries binary file uploads. `ResilientCrudService.post()` applies
 * the project's adaptive write timeout; retries are intentionally omitted —
 * POST is not idempotent here.
 *
 * The auth interceptor attaches `X-Api-Subscription-Key` + bearer. The error
 * interceptor toasts 5xx / 0 / 503 / timeout — the component only needs to
 * handle the `isSuccess: false` envelope branch.
 */
@Injectable({ providedIn: 'root' })
export class NocApi extends ResilientCrudService<never> {
  /**
   * Submits a new NOC service request.
   *
   * @param formData - `multipart/form-data` body containing:
   *   `ProjectLocationId`, `ProjectName`, `ProjectType`, `SiteCondition`,
   *   `FunctionalLocationId`, `NocLetterToMarafiq` (binary), `DrawingKrooki` (binary).
   * @param context - optional `HttpContext` to opt out of interceptors
   *   (e.g. `skipErrorToast()` from `http-context.tokens.ts`).
   */
  submit(formData: FormData, context?: HttpContext): Observable<NocSubmitResponse> {
    return this.post<FormData, NocSubmitResponse>(
      Constants.createNocRequestUrl,
      formData,
      context,
    );
  }
}
