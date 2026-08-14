import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { ResilientCrudService } from '../resilient-crud.service';
import {
  CreateInquiryPayload,
  CreateInquiryResponse,
  InquiryListResponse,
} from './inquiry.types';

/**
 * `/api/v1/cases/inquiries` endpoint surface.
 *
 * - Reads (`list`) use `httpResource` — consumers get signal-shaped
 *   `isLoading()` / `error()` / `value()` for free.
 * - Writes (`submit`) go through `ResilientCrudService.post()` so they
 *   inherit the project's adaptive write `timeout()` (never retried).
 */
@Injectable({ providedIn: 'root' })
export class InquiryApi extends ResilientCrudService<never> {
  /**
   * Reactive list of inquiries for the current authenticated user.
   *
   * Accepts a signal-tracked params factory so the resource automatically
   * re-fires whenever the month or year filter changes.
   *
   * @param params - factory that returns `{ month, year }` (1-based month).
   *   Reading signals inside this factory makes the resource reactive to them.
   */
  list(params: () => { month: number; year: number }) {
    return httpResource<InquiryListResponse>(() => {
      const { month, year } = params();
      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getInquiriesListUrl,
        params: {
          month: String(month).padStart(2, '0'),
          year: String(year),
        },
      };
    });
  }

  /** Submits a new inquiry. Returns the full envelope so callers can branch on `isSuccess`. */
  submit(payload: CreateInquiryPayload): Observable<CreateInquiryResponse> {
    return this.post<CreateInquiryPayload, CreateInquiryResponse>(
      Constants.createInquiryUrl,
      payload,
    );
  }
}
