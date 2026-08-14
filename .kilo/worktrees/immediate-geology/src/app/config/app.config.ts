export const AppConfig = {
  appName: 'CustomTemplate',
  source: 'Web',

  // Language configuration
  enableLanguage: true,
  defaultLanguage: 'ar',
  supportedLanguages: ['en', 'ar'],
 
  // Theming configuration
  enableTheme: false,
  defaultTheme: 'light',
  supportedThemes: ['light', 'black', 'green'] as const,

  // Font size configuration
  fontSize: {
    enable: true,
    default: 10,
    min: 8,
    max: 12,
    step: 2
  }
};