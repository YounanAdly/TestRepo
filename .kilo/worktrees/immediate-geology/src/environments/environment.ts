import { AppConfig as BaseConfig } from '../app/config/app.config';

export const environment = {
    production: false,
    AppConfig: {
        ...BaseConfig,
        apiBaseUrl: 'https://api-crm.iacad.gov.ae',
    },
};