import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/home-page/*` response shapes.
 *
 * Every endpoint is wrapped in the project-wide `ApiEnvelope<T>` (see
 * `auth/auth.types.ts`). All localizable text comes back as an
 * `*En` / `*Ar` pair — components pick the matching one based on the
 * current language.
 */

/** A single "Who We Are" value card. */
export interface HomePageAboutValue {
  valueId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  /** 1-based display order, returned as a string by the backend. */
  order: string;
}

/** Payload of `GET /api/v1/home-page/about-us`. */
export interface HomePageAboutResult {
  titleEn: string;
  titleAr: string;
  values: HomePageAboutValue[];
}

export type HomePageAboutResponse = ApiEnvelope<HomePageAboutResult>;

/** A single hero banner returned by `GET /api/v1/home-page/banner`. */
export interface HomePageBannerItem {
  bannerId: string;
  titleEn: string;
  titleAr: string;
}

export type HomePageBannerResponse = ApiEnvelope<HomePageBannerItem[]>;

/** A single FAQ item returned by `GET /api/v1/home-page/homepage-faqs`. */
export interface HomePageFaqItem {
  questionEnglish: string;
  questionArabic: string;
  answerEnglish: string;
  answerArabic: string;
}

/** Payload of `GET /api/v1/home-page/homepage-faqs`. */
export interface HomePageFaqsResult {
  faqTitleEnglish: string;
  faqTitleArabic: string;
  faqs: HomePageFaqItem[];
}

export type HomePageFaqsResponse = ApiEnvelope<HomePageFaqsResult>;

/** A single service card returned by `GET /api/v1/home-page/services`. */
export interface HomePageServiceItem {
  serviceId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  /** Raw base64-encoded PNG icon (no data-URL prefix). */
  icon: string;
}

/** Payload of `GET /api/v1/home-page/services`. */
export interface HomePageServicesResult {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  services: HomePageServiceItem[];
}

export type HomePageServicesResponse = ApiEnvelope<HomePageServicesResult>;

/** Payload of `GET /api/v1/home-page/faqs`. */
export interface FaqPageResult {
  faqPageTitleEng: string;
  faqPageTitleArabic: string;
  faqPageDescriptionEng: string;
  faqPageDescriptionArabic: string;
  faqs: HomePageFaqItem[];
}

export type FaqPageResponse = ApiEnvelope<FaqPageResult>;

// ── Service Card Detail (`GET /api/v1/home-page/services-card/{id}`) ─────────

export interface ServiceCardProcess {
  name: string;
  serviceProcessNameEnglish: string;
  order: string;
}

export interface ServiceCardCategory {
  feesArabic: string;
  fees: string;
  estimatedTimeEng: string;
  estimatedTimeArabic: string;
  eligibilityEng: string;
  eligibility: string;
}

export interface ServiceCardDocument {
  requiredDocumentNameEnglish: string;
  requiredDocumentNameArabic: string;
}

export interface ServiceCardResult {
  serviceCardTitleEnglish: string;
  /** Arabic title */
  name: string;
  /** Backend category number used to choose the request form (1..15). */
  serviceName: number;
  relatedToMarafiqService: string;
  processDescriptionArabic: string;
  processDescriptionEng: string;
  serviceProcesses: ServiceCardProcess[];
  category: ServiceCardCategory[];
  requiredDocument: ServiceCardDocument[];
}

export type ServiceCardResponse = ApiEnvelope<ServiceCardResult>;
