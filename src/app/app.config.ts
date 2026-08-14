import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions, withNoIncrementalHydration } from '@angular/platform-browser';
import { HttpRequest } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
  withRouterConfig,
} from '@angular/router';
import { FORMLY_CONFIG } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import material from '@primeng/themes/material';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { FormlyConfigModule } from './shared/formly/formly-config.module';
import { formlyTranslateExtension } from './shared/formly/formly.validation';
import { SKIP_TRANSFER_CACHE } from './shared/interceptors/http-context.tokens';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';
import { AuthService } from './shared/services/auth.service';
import { ThemeService } from './shared/services/theme.service';
import { provideTranslations } from './translate.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
      withPreloading(PreloadAllModules),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideClientHydration(
      withEventReplay(),
      withNoIncrementalHydration(),
      withHttpTransferCacheOptions({
        includePostRequests: false,
        filter: (req: HttpRequest<unknown>) => !req.context.get(SKIP_TRANSFER_CACHE),
      }),
    ),
    provideHttpClient(withFetch(),
      withInterceptorsFromDi(),
      // Forward-compatible CSRF: when the backend sets a non-HttpOnly XSRF-TOKEN
      // cookie, Angular auto-echoes it as X-XSRF-TOKEN on mutating requests.
      // Harmless if the backend doesn't issue the cookie; auto-protective if it does.
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([loaderInterceptor, authInterceptor, errorInterceptor]),
    ),
    importProvidersFrom(FormlyConfigModule),
    MessageService,
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      if (themeService.isConfiguredThemeEnabled()) {
        const saved = themeService.getTheme();
        const supported = themeService.getSupportedThemes();
        const theme = supported.includes(saved) ? saved: themeService.isConfiguredThemeEnabled(saved) ? saved : (supported[0] || 'light');
        themeService.setTheme(theme);
      }
    }),
    // Repopulate the in-memory access JWT from the HttpOnly refresh_token cookie
    // BEFORE any protected component renders. Eliminates the otherwise-visible
    // 401-then-retry round-trip on every page reload. Returning the Observable
    // makes Angular await it during startup; on failure AuthService clears the
    // local session and the user lands on /login normally.
    provideAppInitializer(() => inject(AuthService).bootstrap()),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: material,
      },
    }),
    {
      provide: FORMLY_CONFIG,
      multi: true,
      useFactory: formlyTranslateExtension,
      deps: [TranslateService],
    },
    ...provideTranslations()
  ]
};


