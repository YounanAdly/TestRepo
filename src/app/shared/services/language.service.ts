import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CommonService } from './common.service';
import { AppConfig } from '../../config/app.config';

const DIRECTION_MAP: Record<string, 'ltr' | 'rtl'> = {
    en: 'ltr',
    ar: 'rtl'
    // Add other languages as needed
};

@Injectable({
    providedIn: 'root'  // singleton service available app-wide
})
export class LanguageService {
    public platformId = inject(PLATFORM_ID)
    private router = inject(Router);
    private commonService = inject(CommonService);
    private translateService = inject(TranslateService);
    defaultLang: string = AppConfig.defaultLanguage || 'en';

    isReady = signal(false);

    /**
     * Indicates whether language change feature is enabled via configuration.
     */
    isLanguageEnabled(): boolean {
        return AppConfig.enableLanguage !== false;
    }

    /**
     * Change the current language: switches TranslateService, persists cookie, and updates HTML dir/lang.
     * @param lang Target language code
     */
    changeLanguage(lang: string): void {
        const selectedLang = this.isLanguageEnabled() ? lang : this.defaultLang;
        if (!this.isSupportedLang(selectedLang)) {
            return;
        }

        this.translateService.use(selectedLang);
        document.cookie = `lang=${selectedLang}; path=/; SameSite=Lax;`;
        this.applyDocumentLanguage(selectedLang);
        this.ChangeLanguageInUrl(selectedLang);
    }

    /**
     * Updates the first URL segment to reflect the new language and navigates.
     * Reads the actual browser path so it works during initial bootstrap, before
     * the router's first navigation has resolved (avoids dropping the requested URL).
     * @param newLang Target language code
     */
    ChangeLanguageInUrl(newLang: string) {
        const urlSegments = this.getCurrentPathSegments();
        if (urlSegments.length > 0 && urlSegments[0] === newLang) {
            return;
        }
        if (urlSegments.length > 0) {
            if (this.isSupportedLang(urlSegments[0])) {
                urlSegments[0] = newLang;
            } else {
                urlSegments.unshift(newLang);
            }

            this.router.navigate(['/', ...urlSegments], {
                queryParamsHandling: 'preserve',
            });

        } else {
            this.router.navigate(['/', newLang]);
        }
    }


    /**
     * Get the current language from TranslateService or fallback to default.
     */
    getCurrentLanguage(): string {
        return this.translateService.getCurrentLang() || AppConfig.defaultLanguage || 'en';
    }

    /**
     * Initialize the language from cookie or provided default and set document attributes.
     * @param defaultLang Fallback language when cookie is absent
     */
    initLanguage(defaultLang = 'en'): void {
        if (isPlatformBrowser(this.platformId)) {
            const match = document.cookie.match(/lang=(\w+)/);
            const lang = match ? match[1] : defaultLang;
            this.translateService.use(lang);
            this.translateService.use(lang);
            // Set direction
            const dir = DIRECTION_MAP[lang] || 'ltr';
            document.documentElement.setAttribute('dir', dir);
            document.documentElement.setAttribute('lang', lang);
            this.RouteListener();
        }
    }

    /**
     * Ensures translations are loaded before marking the service ready.
     */
    waitLanguageLoad() {
        const lang = this.getBootstrapLanguage();
        this.translateService.use(lang).subscribe(() => {
            this.isReady.set(true);
            this.applyDocumentLanguage(lang);
            this.RouteListener();
            this.syncLanguageWithRoute();
        });
    }

    /**
     * Watches route changes to synchronize URL language segment with app language.
     */
    RouteListener() {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => this.syncLanguageWithRoute());
    }

    /**
     * Checks if provided language is supported.
     */
    private isSupportedLang(lang: string): boolean {
        return AppConfig.supportedLanguages.includes(lang); // list your supported langs
    }

    private getBootstrapLanguage(): string {
        if (!this.isLanguageEnabled()) {
            return this.defaultLang;
        }
        const match = document.cookie.match(/(?:^|;\s*)lang=(\w+)/);
        const cookieLang = match ? match[1] : '';
        return this.isSupportedLang(cookieLang) ? cookieLang : this.defaultLang;
    }

    private applyDocumentLanguage(lang: string): void {
        const dir = DIRECTION_MAP[lang] || 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', lang);
    }

    private syncLanguageWithRoute(): void {
        // Prefer router state (in-app navigations) but fall back to the actual
        // browser path when the router has not yet resolved its initial nav.
        const routerLang = this.router.routerState.snapshot.root.firstChild?.params['lang'];
        const pathSegments = this.getCurrentPathSegments();
        const routeLang = routerLang || pathSegments[0];

        if (routeLang && this.isSupportedLang(routeLang)) {
            if (!this.isLanguageEnabled() && routeLang !== this.defaultLang) {
                this.ChangeLanguageInUrl(this.defaultLang);
                return;
            }
            this.changeLanguage(routeLang);
            return;
        }

        const cookieLang = this.commonService.getCookie('lang');
        const targetLang = (cookieLang && this.isSupportedLang(cookieLang) && this.isLanguageEnabled())
            ? cookieLang
            : this.defaultLang;

        // No lang prefix in URL — prepend the chosen lang while preserving any
        // existing path so deep links survive.
        if (pathSegments.length === 0) {
            this.router.navigate(['/', targetLang]);
        } else {
            this.router.navigate(['/', targetLang, ...pathSegments]);
        }
    }

    private getCurrentPathSegments(): string[] {
        if (!isPlatformBrowser(this.platformId)) {
            return [];
        }
        return window.location.pathname.split('/').filter(s => s.length > 0);
    }
}
