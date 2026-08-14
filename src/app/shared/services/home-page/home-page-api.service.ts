import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { FaqPageResponse, HomePageAboutResponse, HomePageBannerResponse, HomePageFaqsResponse, HomePageServicesResponse, ServiceCardResponse } from './home-page.types';

/**
 * `/api/v1/home-page/*` endpoint surface.
 *
 * Reactive read API — returns an `httpResource` so consumers get
 * signal-shaped `isLoading()` / `error()` / `value()` for free, with
 * automatic SSR prefetch + client rehydration via
 * `withHttpTransferCacheOptions()`.
 *
 * The auth interceptor attaches `X-Api-Subscription-Key` and credentials;
 * the error interceptor toasts 5xx / 0 / 503 — components only handle the
 * resource's loading / error / data branches.
 */
@Injectable({ providedIn: 'root' })
export class HomePageApi {
  /** Reactive read of the "Who We Are" CMS section. */
  aboutUs() {
    return httpResource<HomePageAboutResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getHomeAboutUsUrl,
    }));
  }

  /** Reactive read of the hero banner CMS list. */
  banner() {
    return httpResource<HomePageBannerResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getHomeBannerUrl,
    }));
  }

  /** Reactive read of the homepage FAQs. */
  faqs() {
    return httpResource<HomePageFaqsResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getHomeFaqsUrl,
    }));
  }

  /** Reactive read of the services cards (`/api/v1/home-page/services`). */
  services() {
    return httpResource<HomePageServicesResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getHomeServicesUrl,
    }));
  }

  /** Reactive read of the FAQ page (`/api/v1/home-page/faqs`). */
  faqsPage() {
    return httpResource<FaqPageResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getFaqPageFaqsUrl,
    }));
  }

  /**
   * Reactive read of a single service card detail.
   * Pass a signal-factory returning the serviceId (or null/undefined to skip).
   */
  serviceCard(serviceId: () => string | null | undefined) {
    return httpResource<ServiceCardResponse>(() => {
      const id = serviceId();
      if (!id) return undefined;
      return {
        url: environment.AppConfig.apiBaseUrl + Constants.getServiceCardUrl + id,
      };
    });
  }
}
