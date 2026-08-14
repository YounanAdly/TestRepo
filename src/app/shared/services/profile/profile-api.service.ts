import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { skipErrorToast } from '../../interceptors/http-context.tokens';
import { ResilientCrudService } from '../resilient-crud.service';
import {
  BillingAccountsResponse,
  CreateProfileAccountPayload,
  CreateProfileAccountResponse,
  InvoicesResponse,
  ProfileAccountsResponse,
  ProfileDetailsResponse,
} from './profile.types';

/**
 * `/api/v1/profile/*` endpoint surface.
 *
 * - `accounts()` is a reactive read for the post-OTP `select-account`
 *   screen and the authenticated header dropdown — uses `httpResource` so
 *   the component branches on the resource's `isLoading()` / `error()` /
 *   `value()?.result`. Pass `enabled` when the caller exists on public
 *   pages and should skip the request until the user is authenticated.
 * - `getProfileDetails()` is a one-shot imperative read invoked the moment
 *   the user picks an account; the chosen `accountId` rides on the
 *   `X-Account-Id` header (auto-attached by `authInterceptor` once
 *   `AuthService.setSelectedAccountId(...)` has been called). It opts out
 *   of the global error toast via `skipErrorToast()` so the select-account
 *   screen can surface the failure inline (server-localized message via
 *   `ToastService(..., envelope)`) and reset its `isNavigating` flag —
 *   without the interceptor's generic toast firing on top.
 *
 * The auth interceptor attaches `X-Api-Subscription-Key` + bearer; the
 * error interceptor toasts 5xx / 0 / 503 / timeout — components only
 * handle the envelope's `isSuccess: false` branch.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApi extends ResilientCrudService<never> {
  /** Reactive read of the accounts the signed-in contact can switch between. */
  accounts(enabled: () => boolean = () => true) {
    return httpResource<ProfileAccountsResponse>(() => enabled()
      ? { url: environment.AppConfig.apiBaseUrl + Constants.getProfileAccountsUrl }
      : undefined);
  }

  /**
   * One-shot imperative fetch of the profile details for the currently
   * selected account. The `X-Account-Id` header is attached by
   * `authInterceptor` from `AuthService.getSelectedAccountId()` — set it
   * BEFORE subscribing.
   */
  getProfileDetails(): Observable<ProfileDetailsResponse> {
    return this.getOne<ProfileDetailsResponse>(
      Constants.getProfileUrl,
      skipErrorToast(),
    );
  }

  /**
   * Create a new account under the current contact via
   * `POST /api/v1/profile/accounts`.
   *
   * Callers handle the envelope's `isSuccess: false` branch to surface the
   * server's localized `errorMessageEn` / `errorMessageAr` via
   * `ToastService(..., envelope)`. Transport errors (5xx / 0 / 503 /
   * timeout) are toasted centrally by `errorInterceptor`, matching the
   * pattern used by `ComplaintsApi.submit()`.
   */
  createAccount(payload: CreateProfileAccountPayload): Observable<CreateProfileAccountResponse> {
    return this.post<CreateProfileAccountPayload, CreateProfileAccountResponse>(
      Constants.createProfileAccountUrl,
      payload,
    );
  }

  /** Reactive read of billing accounts for the currently selected account. */
  billingAccounts(enabled: () => boolean = () => true) {
    return httpResource<BillingAccountsResponse>(() => enabled()
      ? { url: environment.AppConfig.apiBaseUrl + Constants.getBillingAccountsUrl }
      : undefined);
  }

  /**
   * Reactive paged read of invoices for a specific billing account.
   *
   * Stays idle while `accountId` is null/empty — safe to create unconditionally.
   * All filters (`statusCode`, `month`, `year`, `search`) are pushed to the
   * server so the client never re-filters locally. Only defined / non-empty
   * filters are appended to the query string.
   */
  invoices(params: () => {
    accountId: string | null;
    page: number;
    pageSize: number;
    statusCode?: string | null;
    month?: number | null;
    year?: number | null;
    search?: string | null;
  }) {
    return httpResource<InvoicesResponse>(() => {
      const p = params();
      if (!p.accountId?.trim()) return undefined;

      const query: Record<string, string> = {
        page: String(p.page),
        pageSize: String(p.pageSize),
      };
      if (p.statusCode != null && String(p.statusCode).trim() !== '') {
        query['statusCode'] = String(p.statusCode);
      }
      if (p.month != null && p.month > 0) {
        query['month'] = String(p.month);
      }
      if (p.year != null && p.year > 0) {
        query['year'] = String(p.year);
      }
      const term = p.search?.trim();
      if (term) {
        query['search'] = term;
      }

      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getInvoicesUrl(p.accountId.trim()),
        params: query,
      };
    });
  }
}
