import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/profile/*` response shapes.
 *
 * The backend wraps every payload in the project-wide `ApiEnvelope<T>` (see
 * `auth/auth.types.ts`). `GET /profile/accounts` returns the list of
 * accounts the signed-in contact can switch between (rendered on the
 * post-OTP `select-account` screen); `GET /profile` returns the details
 * of the currently active account — the caller must pass the chosen
 * `accountId` via the `X-Account-Id` header (auto-attached by
 * `authInterceptor` whenever `AuthService.getSelectedAccountId()` is set).
 */

/** Backend enum — `1` = personal, `2` = organization (arrives as number or string). */
export type ProfileAccountTypeCode = 1 | 2 | '1' | '2';

/** A single account row returned by `GET /api/v1/profile/accounts`. */
export interface ProfileAccount {
  accountId: string;
  name: string;
  accountType: ProfileAccountTypeCode;
  isPrimary: boolean;
}

export type ProfileAccountsResponse = ApiEnvelope<ProfileAccount[]>;

/** Payload of `GET /api/v1/profile` for the currently selected account. */
export interface ProfileDetails {
  contactId: string;
  firstName: string;
  lastName: string;
  civilId: string;
  crNo: string;
  email: string;
  mobilePhone: string;
  address: string;
  governorateId: string | null;
  governorateName: string | null;
  alwilayaId: string | null;
  alwilayaName: string | null;
  accountId: string | null;
  accountName: string | null;
  accountType: number | null;
  accountEmail: string | null;
  accountGovernorateId: string | null;
  accountGovernorateName: string | null;
  accountAlwilayaId: string | null;
  accountAlwilayaName: string | null;
}

export type ProfileDetailsResponse = ApiEnvelope<ProfileDetails>;

/** Numeric enum sent to the backend on account creation — `1` = personal, `2` = organization. */
export type CreateProfileAccountType = 1 | 2;

/**
 * `POST /api/v1/profile/accounts` — create a new account under the current contact.
 *
 * `middleName` is always sent (empty string when unused) so the backend
 * projection stays consistent. `alWilayaId` is the GUID returned by
 * `LookupApi.entityLookup({ entityName: 'ntw_alwilaya' })`. `name`,
 * `telephone1`, `crNo` are populated ONLY when `accountType === 2`.
 */
export interface CreateProfileAccountPayload {
  accountType: CreateProfileAccountType;
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress1: string;
  mobilePhone: string;
  civilId: string;
  governorateId?: string;
  alWilayaId: string;
  /** Company display name — sent only for `accountType === 2`. */
  name?: string;
  /** Company phone — sent only for `accountType === 2`. */
  telephone1?: string;
  /** Commercial registration number — sent only for `accountType === 2`. */
  crNo?: string;
}

// ── Billing accounts ────────────────────────────────────────────────────────

/** A single row returned by `GET /api/v1/billing-accounts`. */
export interface BillingAccount {
  accountId: string;
  name: string;
  totalOutstanding: number | null;
  /** 1 = Active */
  statusCode: number;
}

export type BillingAccountsResponse = ApiEnvelope<BillingAccount[]>;

/** Success payload for `POST /api/v1/profile/accounts`. */
export interface CreateProfileAccountResult {
  accountId?: string;
}

export type CreateProfileAccountResponse = ApiEnvelope<CreateProfileAccountResult>;

// ── Invoices ────────────────────────────────────────────────────────────────

/**
 * CRM status codes for an invoice. Values are the Dataverse option-set ids
 * used by the backend — do NOT change them without coordinating with the API.
 */
export enum InvoiceStatusCode {
  Pending = 961110000,
  Paid = 961110001,
  Overdue = 961110002,
}

/** A single invoice row returned by `GET /api/v1/billing-accounts/{id}/invoices`. */
export interface Invoice {
  invoiceId: string;
  /** Invoice reference number, e.g. "001". */
  name: string;
  totalAmount: number;
  billDate: string;
  /** Optional due date — falls back to `billDate` when the backend omits it. */
  dueDate?: string | null;
  /** CRM option-set id — see `InvoiceStatusCode`. */
  statusCode: InvoiceStatusCode | number;
}

export interface InvoicePagedResult {
  items: Invoice[];
  totalCount: number;
  pageSize: number;
  pageIndex: number;
}

export type InvoicesResponse = ApiEnvelope<InvoicePagedResult>;
