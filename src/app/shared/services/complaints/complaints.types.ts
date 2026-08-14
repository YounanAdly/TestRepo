import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/cases/complaints` response shapes.
 *
 * The backend wraps every payload in the project-wide `ApiEnvelope<T>` (see
 * `auth/auth.types.ts`), so a list call resolves to `ApiEnvelope<ComplaintListItem[]>`.
 */

export interface ComplaintStatusDto {
  id: string;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ComplaintListItem {
  incidentId: string;
  ticketNumber: string;
  title: string;
  description: string;
  /** ISO 8601 UTC timestamp. */
  createdOn: string;
  status: ComplaintStatusDto;
}

export type ComplaintListResponse = ApiEnvelope<ComplaintListItem[]>;

// ── Create complaint ─────────────────────────────────────────────────────────

/**
 * `/api/v1/cases/complaints` (POST) request body.
 *
 * The backend wants the **option-set id** for the matching primary category
 * only — never send a sub-category field that doesn't belong to the active
 * primary. `caseTypeCode: '2'` is the "Complaint" case-type and
 * `caseOriginCode: '3'` is the "Portal" origin (vs phone/email/mobile);
 * both are static for the public web flow.
 */
interface CreateComplaintBase {
  /** 1 = Water Leakage, 2 = Water Quality, 3 = General. */
  opsComplaintCategory: 1 | 2 | 3;
  /** Sent for **both** detail and description — the form has a single textarea. */
  strComplaintDetails: string;
  strComplaintDescription: string;
  /** Free-text reason, only present when the user picked "Other Reasons". */
  strAnotherReason?: string;
  /** `'2'` = Complaint (case-type). */
  caseTypeCode: '2';
  /** `'3'` = Portal (case-origin). */
  caseOriginCode: '3';
}

export interface CreateWaterLeakageComplaintPayload extends CreateComplaintBase {
  opsComplaintCategory: 1;
  /** Option-set id from `ntw_opscomplainttypeforwaterleakagecomplaints`. */
  opsComplaintTypeForWaterLeakageComplaints: number;
}

export interface CreateWaterQualityComplaintPayload extends CreateComplaintBase {
  opsComplaintCategory: 2;
  /** Option-set id from `ntw_opscomplainttypequatlity`. */
  opsComplaintTypeQuality: number;
}

export interface CreateGeneralComplaintPayload extends CreateComplaintBase {
  opsComplaintCategory: 3;
  /** Option-set id from `ntw_opscomplainttypegeneral`. */
  opsComplaintTypeGeneral: number;
  /** Option-set id from `ntw_opssubcomplaintmeterissues` — only when sub-category = Meter Issues. */
  opsSubComplaintMeterIssues?: number;
  /** Option-set id from `ntw_opssubcomplaintwaterbillingpayments` — only when sub-category = Water Service Bills. */
  opsSubComplaintWaterBillingPayments?: number;
}

export type CreateComplaintPayload =
  | CreateWaterLeakageComplaintPayload
  | CreateWaterQualityComplaintPayload
  | CreateGeneralComplaintPayload;

/**
 * `result` shape for a successful POST. Fields are optional because the
 * backend hasn't fully stabilized the response yet — read defensively.
 */
export interface CreateComplaintResult {
  incidentId?: string;
  ticketNumber?: string;
}

export type CreateComplaintResponse = ApiEnvelope<CreateComplaintResult>;

// ── Complaint details ────────────────────────────────────────────────────────

/**
 * `/api/v1/cases/complaints/{ticketNumber}` response payload.
 *
 * Fields mirror the CRM `incident` record used to build the create request —
 * the sub-category and secondary option-set values come back as numeric
 * ids and must be resolved to labels through `LookupApi.optionSet(...)`
 * (same field names as the form). Fields not applicable to the active
 * primary category arrive as `null`.
 */
export interface ComplaintDetailResult {
  caseNumber: string;
  description: string | null;
  status: ComplaintStatusDto;
  customerAccountId: string | null;
  customerAccountName: string | null;
  billingAccountId: string | null;
  billingAccountName: string | null;
  primaryContactId: string | null;
  primaryContactName: string | null;
  /** 1 = Water Leakage, 2 = Water Quality, 3 = General. */
  opsComplaintCategory: number | null;
  opsComplaintTypeForWaterLeakageComplaints: number | null;
  opsComplaintTypeQuality: number | null;
  opsComplaintTypeGeneral: number | null;
  opsSubComplaintMeterIssues: number | null;
  opsSubComplaintWaterBillingPayments: number | null;
  anotherReason: string | null;
  caseTypeCode: number | null;
}

export type ComplaintDetailResponse = ApiEnvelope<ComplaintDetailResult>;
