import { ApiEnvelope } from '../auth/auth.types';

/**
 * `/api/v1/about-us` response shapes.
 */

interface AboutUsLocalizedSection {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface AboutUsValueItem extends AboutUsLocalizedSection {}

export interface AboutUsResult {
  aboutUs: AboutUsLocalizedSection;
  overview: AboutUsLocalizedSection;
  mission: AboutUsLocalizedSection;
  vision: AboutUsLocalizedSection;
  values: AboutUsValueItem[];
}

export type AboutUsResponse = ApiEnvelope<AboutUsResult>;
