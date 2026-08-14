import { AppConfig as BaseConfig } from '../app/config/app.config';

export const environment = {
    production: false,
    AppConfig: {
        ...BaseConfig,
        apiBaseUrl: 'https://app-api-marafiq-we-dev-001.azurewebsites.net',
        subscriptionKey: 'cda930e1-3058-4636-82ea-b5865dba219c',
    },
};