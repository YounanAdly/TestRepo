export class Constants {
  // static API_URL = '/api/optionsets/all/nw_workshop';
  static getContactInfoUrl = '';
  static uploadAttachmentUrl = '';
  static deleteAttachmentUrl = '';

  // ── Auth ──────────────────────────────────────────────────────────────────
  static loginRequestOtpUrl = '/api/v1/auth/login/request-otp';
  static verifyOtpUrl = '/api/v1/auth/otp/verify';
  static resendOtpUrl = '/api/v1/auth/otp/resend';
  static registerStartUrl = '/api/v1/auth/register';
  static registerVerifyUrl = '/api/v1/auth/register/verify';
  static refreshTokenUrl = '/api/v1/auth/token/refresh';
  static logoutUrl = '/api/v1/auth/logout';

  // ── Cases ─────────────────────────────────────────────────────────────────
  static getComplaintsListUrl = '/api/v1/cases/complaints';
  static createComplaintUrl = '/api/v1/cases/complaints';
  // Append `{ticketNumber}` to fetch a single complaint's details.
  static getComplaintDetailsUrl = '/api/v1/cases/complaints/';
  static getInquiriesListUrl = '/api/v1/cases/inquiries';
  static createInquiryUrl = '/api/v1/cases/inquiries';
  // ── Home page (CMS) ───────────────────────────────────────────────────────
  static getHomeAboutUsUrl = '/api/v1/home-page/about-us';
  static getHomeBannerUrl = '/api/v1/home-page/banner';
  static getHomeFaqsUrl = '/api/v1/home-page/homepage-faqs';
  static getHomeServicesUrl = '/api/v1/home-page/services';
  static getFaqPageFaqsUrl = '/api/v1/home-page/faqs';
  static getServiceCardUrl = '/api/v1/home-page/services-card/';
  static getAboutUsUrl = '/api/v1/about-us';

  // ── Lookup (Dataverse option-sets) ───────────────────────────────────────
  static getLookupOptionSetsUrl = '/api/v1/lookup/optionsets';
  static getLookupLookupsUrl = '/api/v1/lookup/lookups';

  // ── Profile ──────────────────────────────────────────────────────────────
  static getProfileAccountsUrl = '/api/v1/profile/accounts';
  static createProfileAccountUrl = '/api/v1/profile/accounts';
  static getProfileUrl = '/api/v1/profile';

  // ── Services ──────────────────────────────────────────────────────────────
  static getPlotsUrl            = '/api/v1/services/plots';
  static createNocRequestUrl    = '/api/v1/services/noc';
  static createTankerRequestUrl = '/api/v1/services/tanker-filling-license';

  // ── Billing ───────────────────────────────────────────────────────────────
  static getBillingAccountsUrl = '/api/v1/billing-accounts';
  static getInvoicesUrl(accountId: string): string {
    return `/api/v1/billing-accounts/${encodeURIComponent(accountId)}/invoices`;
  }
}