import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { PlotsResponse } from './plot.types';

/**
 * `/api/v1/services/plots` endpoint surface.
 *
 * Reactive read of all plots available to the logged-in user. Returns a
 * resource that stays idle until first usage and automatically refetches
 * when signals tracked inside the factory change.
 *
 * Auth interceptor attaches `X-Api-Subscription-Key` + bearer.
 * Error interceptor toasts 5xx / 0 / 503 — callers only branch on `value()?.result`.
 */
@Injectable({ providedIn: 'root' })
export class PlotApi {
  /** Fetches the full plot list. Pass a factory returning `true` to activate, `false`/`null` to stay idle. */
  list(active: () => boolean | null) {
    return httpResource<PlotsResponse>(() => {
      if (!active()) return undefined;
      return { url: environment.AppConfig.apiBaseUrl + Constants.getPlotsUrl };
    });
  }
}
