import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/lookup/optionsets` response shapes.
 *
 * Generic CRM/Dataverse option-set lookup. The backend wraps every payload
 * in the project-wide `ApiEnvelope<T>` (see `auth/auth.types.ts`). The
 * caller picks the language-matched `descriptionEn` / `descriptionAr` for
 * display and keeps `id` for submission.
 */

/** A single option returned from `/lookup/optionsets`. */
export interface LookupOption {
  id: number;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
}

export type LookupOptionsResponse = ApiEnvelope<LookupOption[]>;

/** Query identifying which option-set to fetch. */
export interface LookupOptionSetQuery {
  /** Logical name of the entity, e.g. `incident`. */
  entityLogicalName: string;
  /** Logical name of the option-set field, e.g. `ntw_opscomplainttypequatlity`. */
  fieldName: string;
}

/** Query payload for `/lookup/lookups` entity reads. */
export interface LookupEntityQuery {
  entityName: string;
  columns: string;
  filters?: string;
}

/** A single lookup row returned from `/lookup/lookups`. */
export interface LookupEntityOption {
  id: string;
  name: string;
}

export type LookupEntitiesResponse = ApiEnvelope<LookupEntityOption[]>;
