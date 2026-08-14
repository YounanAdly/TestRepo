import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/services/tanker-filling-license` request / response shapes.
 *
 * The backend wraps every response in the project-wide `ApiEnvelope<T>`.
 * Request is sent as `multipart/form-data` because it includes binary
 * file uploads (`VehicleRegistrationFile`, `CommercialRegistrationFile`,
 * `NationalIdFile`).
 */

export interface TankerSubmitResult {
  requestId: string;
  applicationNumber: string;
}

export type TankerSubmitResponse = ApiEnvelope<TankerSubmitResult>;
