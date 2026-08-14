import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { FORMLY_CONFIG } from '@ngx-formly/core';
import { TranslateService } from '@ngx-translate/core';
import material from '@primeng/themes/material';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { FormlyConfigModule } from './shared/formly/formly-config.module';
import { formlyTranslateExtension } from './shared/formly/formly.validation';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { loaderInterceptor } from './shared/interceptors/loader.interceptor';
import { ThemeService } from './shared/services/theme.service';
import { provideTranslations } from './translate.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([loaderInterceptor, authInterceptor])),
    importProvidersFrom(FormlyConfigModule),
    provideAppInitializer(() => {
      const themeService = inject(ThemeService);
      if (themeService.isConfiguredThemeEnabled()) {
        const saved = themeService.getTheme();
        const supported = themeService.getSupportedThemes();
        const theme = supported.includes(saved) ? saved: themeService.isConfiguredThemeEnabled(saved) ? saved : (supported[0] || 'light');
        themeService.setTheme(theme);
      }
    }),
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


