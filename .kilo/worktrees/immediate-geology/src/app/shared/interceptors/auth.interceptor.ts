import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';
import { AppConfig } from '../../config/app.config';

/**
 * HTTP interceptor that attaches authentication and context headers.
 * - Authorization: Bearer <token> when a token exists
 * - Accept-Language: current UI language (fallback to default)
 * - Source: application source identifier
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const commonService = inject(CommonService);
  const token = commonService.getLocalStorage('auth_token');
  const lang = commonService.getCookie('lang') || AppConfig.defaultLanguage;

  const setHeaders: Record<string, string> = {
    'Accept-Language': lang || AppConfig.defaultLanguage,
    'Source': AppConfig.source || 'Web',
  };
  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  const withHeaders = req.clone({ setHeaders });

  return next(withHeaders);
}


