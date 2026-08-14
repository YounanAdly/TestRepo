import { TranslateService } from '@ngx-translate/core';
import { TranslateExtension } from './formly.translate-extension';

export function formlyTranslateExtension(translate: TranslateService) {
    return {
        validationMessages: [
            {
                name: 'required',
                message() {
                    return translate.stream('validation.required');
                },
            },
            {
                name: 'numbersOnly',
                message() {
                    return translate.stream('validation.numbersOnly');
                }
            },
            {
                name: 'emailPattern',
                message() {
                    return translate.stream('validation.emailPattern');
                }
            },
            {
                name: 'fullNamePattern',
                message() {
                    return translate.stream('validation.fullNamePattern');
                }
            },
            {
                name: 'mobileNumberLength',
                message() {
                    return translate.stream('validation.mobileNumberLength');
                }
            }
        ],

        extensions: [{
            name: 'translate',
            extension: new TranslateExtension(translate),
        }],
    };
}

