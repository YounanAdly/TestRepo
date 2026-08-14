import { ApiEnvelope } from '../auth/auth.types';

/** `/api/v1/cases/inquiries` (POST) request body. */
export interface CreateInquiryPayload {
  inquiry: string;
}

/** Shape of the `result` field returned by the inquiries POST endpoint. */
export interface CreateInquiryResult {
  /** Inquiry reference number, e.g. "INQ-000008". */
  name: string;
}

/** `/api/v1/cases/inquiries` (POST) response envelope. */
export type CreateInquiryResponse = ApiEnvelope<CreateInquiryResult>;

// ── List inquiries ──────────────────────────────────────────────────────────

export interface InquiryStatusDto {
  id: number;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface InquiryListItem {
  inquiryId: string;
  /** Reference number, e.g. "INQ-000008". */
  name: string;
  /** The inquiry question text entered by the user. */
  inquiry: string;
  /** Response text from customer service. */
  response: string;
  /** ISO 8601 UTC timestamp. */
  createdOn: string;
  status: InquiryStatusDto;
}

export interface InquiryListResult {
  inquiries: InquiryListItem[];
}

export type InquiryListResponse = ApiEnvelope<InquiryListResult>;
