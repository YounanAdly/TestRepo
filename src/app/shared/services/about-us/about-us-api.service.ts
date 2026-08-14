import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Constants } from '../../../constants';
import { AboutUsResponse } from './about-us.types';

/**
 * `/api/v1/about-us` endpoint surface.
 *
 * Uses `httpResource` so consumers can render loading/error/value branches
 * with signal ergonomics and SSR transfer cache support.
 */
@Injectable({ providedIn: 'root' })
export class AboutUsApi {
  detail() {
    return httpResource<AboutUsResponse>(() => ({
      url: environment.AppConfig.apiBaseUrl + Constants.getAboutUsUrl,
    }));
  }
}
