// src/app/translate.config.ts
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader();
}

export const provideTranslations = () => [
    provideTranslateService({
        loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader,
            deps: [HttpClient],
        }
    }),
    {
        provide: TRANSLATE_HTTP_LOADER_CONFIG,
        useValue: {
            prefix: '/assets/i18n/',
            suffix: '.json'
        }
    }
];