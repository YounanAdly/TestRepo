export const AppConfig = {
  appName: 'Marafiq',
  source: 'portal',

  // Language configuration
  enableLanguage: true,
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],

  // Theming configuration
  enableTheme: false,
  defaultTheme: 'light',
  supportedThemes: ['light', 'black', 'green'] as const,

  // Font size configuration
  fontSize: {
    enable: false,
    default: 10,
    min: 8,
    max: 12,
    step: 2
  }
};