# Marafiq

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.12.

## Overview

This Angular application provides a starter with:

- Authentication service with token storage and cached user contact info.
- HTTP interceptors for Authorization, Accept-Language, Source headers, and a global loader.
- Internationalization setup with language routing and direction (LTR/RTL) handling.
- Shared utilities for local storage, theme switching, font size control, and form helpers.
- Formly custom components and configuration.

### Key folders

- `src/app/shared/services/`
  - `auth.service.ts`: login/logout, token handling, contact info caching
  - `language.service.ts`: current language, URL sync, cookies, dir/lang attributes
  - `loader.service.ts`: reactive loading state with Angular signals
  - `theme.service.ts`: light/dark theme toggling
  - `font-size.service.ts`: root font-size persistence and application
  - `common.service.ts`: browser-safe localStorage and cookie helpers
  - `base-crud.service.ts`: typed CRUD helpers against `environment.AppConfig.apiBaseUrl`
- `src/app/shared/interceptors/`
  - `auth.interceptor.ts`: adds Authorization, Accept-Language, Source headers
  - `loader.interceptor.ts`: shows/hides loader during HTTP calls
- `src/app/shared/formly/`: Formly config, validators, and custom field types
- `src/assets/i18n/`: translation files (`en.json`, `ar.json`)

### Configuration

- `src/environments/*.ts`: sets `AppConfig.apiBaseUrl` per environment.
- `src/app/app.config.ts`: registers routes, interceptors, translations, and UI providers.

### Usage notes

- Auth header is attached automatically when a token exists; set via `AuthService.setToken()`.
- Language header is derived from `LanguageService.getCurrentLanguage()`.
- Contact info is fetched once and cached via `AuthService.fetchContactInfo()`.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# Marafiq-Website
