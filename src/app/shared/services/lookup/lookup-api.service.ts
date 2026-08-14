import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import {
  LookupEntitiesResponse,
  LookupEntityQuery,
  LookupOptionSetQuery,
  LookupOptionsResponse,
} from './lookup.types';

/**
 * `/api/v1/lookup/optionsets` endpoint surface.
 *
 * Reusable reactive read of CRM/Dataverse option-set values — used by any
 * dropdown whose options come from `entityLogicalName` + `fieldName`.
 *
 * Pass a factory returning `{ entityLogicalName, fieldName }` (or `null` to
 * stay idle). Any signals the factory reads are tracked, so the resource
 * refetches automatically when they change.
 *
 * The auth interceptor attaches `X-Api-Subscription-Key` and credentials;
 * the error interceptor toasts 5xx / 0 / 503 — consumers only branch on
 * `isLoading()` / `error()` / `value()?.result`.
 */
@Injectable({ providedIn: 'root' })
export class LookupApi {
  /** Reactive read of an option-set list. Stays idle while the factory returns `null`. */
  optionSet(query: () => LookupOptionSetQuery | null) {
    return httpResource<LookupOptionsResponse>(() => {
      const q = query();
      if (!q) return undefined;
      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getLookupOptionSetsUrl,
        params: {
          entityLogicalName: q.entityLogicalName,
          fieldName: q.fieldName,
        },
      };
    });
  }

  /**
   * Reactive read of generic lookup rows via `/lookup/lookups`.
   *
   * Used for dropdowns backed by arbitrary entity/column projections
   * (for example, the registration wilaya list).
   */
  entityLookup(query: () => LookupEntityQuery | null) {
    return httpResource<LookupEntitiesResponse>(() => {
      const q = query();
      if (!q) return undefined;
      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getLookupLookupsUrl,
        method: 'POST',
        body: {
          entityName: q.entityName,
          columns: q.columns,
          ...(q.filters ? { filters: q.filters } : {}),
        },
      };
    });
  }
}
