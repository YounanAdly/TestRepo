import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Constants } from '../../../constants';
import { ResilientCrudService } from '../resilient-crud.service';
import { TankerSubmitResponse } from './tanker.types';

/**
 * `/api/v1/services/tanker-filling-license` endpoint surface.
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
export class TankerApi extends ResilientCrudService<never> {
  /**
   * Submits a new Tanker Filling License service request.
   *
   * @param formData - `multipart/form-data` body containing:
   *   `TankerType` (int32), `TankCapacity` (double), `PlateNumber`,
   *   `VehicleBrand`, `VehicleModel`, `ModelYear`,
   *   `VehicleRegistrationFile` (binary), `CommercialRegistrationFile` (binary),
   *   `NationalIdFile` (binary).
   * @param context - optional `HttpContext` to opt out of interceptors.
   */
  submit(formData: FormData, context?: HttpContext): Observable<TankerSubmitResponse> {
    return this.post<FormData, TankerSubmitResponse>(
      Constants.createTankerRequestUrl,
      formData,
      context,
    );
  }
}
