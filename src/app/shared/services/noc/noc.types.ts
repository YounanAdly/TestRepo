import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/services/noc` request / response shapes.
 *
 * The backend wraps every response in the project-wide `ApiEnvelope<T>`.
 * Request is sent as `multipart/form-data` because it includes binary
 * file uploads (`NocLetterToMarafiq`, `DrawingKrooki`).
 */

export interface NocSubmitResult {
  requestId: string;
  nocNumber: string;
}

export type NocSubmitResponse = ApiEnvelope<NocSubmitResult>;
