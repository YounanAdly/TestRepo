import { AppConfig as BaseConfig } from '../app/config/app.config';

export const environment = {
    production: false,
    AppConfig: {
        ...BaseConfig,
        apiBaseUrl: 'https://dev-api.example.com',
    },
};