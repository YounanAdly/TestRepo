import { isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { AppConfig } from "../../config/app.config";

// theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  /**
   * Applies the selected theme by toggling root CSS classes and persists the choice in a cookie.
   * @param theme The theme to apply (light | black)
   */
  setTheme(theme: string) {
    if (isPlatformBrowser(this.platformId)) {
      const previous = this.getTheme();
      if (previous) {
        const html = document.documentElement;
        const themeClasses = Array.from(html.classList).filter(c => c.includes('theme'));
        themeClasses.forEach(c => html.classList.remove(c));
      }
      document.documentElement.classList.add(`${theme}-theme`);
      document.cookie = `theme=${theme}; path=/; SameSite=Lax;`;
    }
  }

  /**
   * Reads the current theme from cookies. Defaults to 'light' if none found.
   * @returns The active theme (light | black)
   */
  getTheme(): string {
    if (isPlatformBrowser(this.platformId)) {
      const match = document.cookie.match(/theme=([^;]+)/);
      return match ? match[1] : 'light';
    }
    return 'light';
  }

  /**
   * Checks if theming is enabled and the configured default theme is supported.
   * @returns true if AppConfig.enableTheme is true and defaultTheme is in supportedThemes
   */
  isConfiguredThemeEnabled(theme?: string): boolean {
    const supported = AppConfig.supportedThemes as ReadonlyArray<string>;
    const selectedTheme = theme ?? AppConfig.defaultTheme;
    return !!AppConfig.enableTheme && supported.includes(selectedTheme);
  }

  /**
   * Returns the configured supported themes list.
   */
  getSupportedThemes(): string[] {
    const supported = (AppConfig.supportedThemes as ReadonlyArray<string>) || [];
    return [...supported];
  }
}
