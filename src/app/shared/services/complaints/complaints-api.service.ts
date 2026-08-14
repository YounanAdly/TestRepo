import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { ResilientCrudService } from '../resilient-crud.service';
import {
  ComplaintDetailResponse,
  ComplaintListResponse,
  CreateComplaintPayload,
  CreateComplaintResponse,
} from './complaints.types';

/**
 * `/api/v1/cases/complaints` endpoint surface.
 *
 * - Reads (`list`, `detail`) use `httpResource` so consumers get signal-shaped
 *   `isLoading()` / `error()` / `value()` for free.
 * - Writes (`submit`) go through `ResilientCrudService.post()` so they
 *   inherit the project's adaptive write `timeout()` (never retried —
 *   POSTs are not idempotent at the API).
 *
 * The auth interceptor attaches `X-Api-Subscription-Key` + bearer; the error
 * interceptor toasts 5xx / 0 / 503 / timeout — components only handle the
 * envelope's `isSuccess: false` branch.
 */
@Injectable({ providedIn: 'root' })
export class ComplaintsApi extends ResilientCrudService<never> {
  /**
   * Reactive list of complaints for the current authenticated user.
   *
   * Accepts a signal-tracked params factory so the resource automatically
   * re-fires whenever the month or year filter changes.
   *
   * @param params - factory that returns `{ month, year }` (1-based month).
   *   Reading signals inside this factory makes the resource reactive to them.
   */
  list(params: () => { month: number; year: number }) {
    return httpResource<ComplaintListResponse>(() => {
      const { month, year } = params();
      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getComplaintsListUrl,
        params: {
          month: String(month).padStart(2, '0'),
          year: String(year),
        },
      };
    });
  }

  /**
   * Reactive fetch of a single complaint by `ticketNumber` (e.g.
   * `CAS-01180-C2W0J8`). Stays idle while the factory returns `null` /
   * empty — used by the "My Requests" details screen so the request only
   * fires once a valid ticket number is on the route.
   */
  detail(ticketNumber: () => string | null | undefined) {
    return httpResource<ComplaintDetailResponse>(() => {
      const ticket = ticketNumber()?.trim();
      if (!ticket) return undefined;
      return {
        url:
          environment.AppConfig.apiBaseUrl +
          Constants.getComplaintDetailsUrl +
          encodeURIComponent(ticket),
      };
    });
  }

  /** Submits a new complaint. Returns the full envelope so callers can branch on `isSuccess`. */
  submit(payload: CreateComplaintPayload): Observable<CreateComplaintResponse> {
    return this.post<CreateComplaintPayload, CreateComplaintResponse>(
      Constants.createComplaintUrl,
      payload,
    );
  }
}

