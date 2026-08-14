import { AppConfig as BaseConfig } from '../app/config/app.config';

export const environment = {
    production: true,
    AppConfig: {
        ...BaseConfig,
        apiBaseUrl: 'https://api.example.com',
    },
};
