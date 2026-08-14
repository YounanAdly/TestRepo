import { AppConfig as BaseConfig } from '../app/config/app.config';

export const environment = {
    production: false,
    AppConfig: {
        ...BaseConfig,
        // Empty in dev so HTTP calls use relative URLs and the Angular dev-server
        // proxy (proxy.conf.json) forwards `/api/*` to the Azure backend.
        // This sidesteps CORS during development.
        apiBaseUrl: '',
        subscriptionKey: 'cda930e1-3058-4636-82ea-b5865dba219c',
    },
};