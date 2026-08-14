// src/app/utils/theme.utils.ts
export function applyInitialThemeFromCookie(): void {
  const match = document.cookie.match(/theme=(dark|light)/);
  const theme: 'light' | 'dark' = match ? match[1] as 'light' | 'dark' : 'light';
  const root = document.documentElement;
  root.classList.remove('light-theme', 'dark-theme');
  root.classList.add(`${theme}-theme`);
}
applyInitialThemeFromCookie();
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
