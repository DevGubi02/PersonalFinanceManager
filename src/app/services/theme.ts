import { Injectable, effect, signal } from '@angular/core';

export type AppTheme = 'light' | 'midnight' | 'forest' | 'ocean' | 'sunset' | 'lavender';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<AppTheme>(this.getStoredTheme());

  constructor() {
    effect(() => {
      const selectedTheme = this.theme();
      document.body.setAttribute('data-theme', selectedTheme);
      document.documentElement.setAttribute('data-theme', selectedTheme);
      localStorage.setItem('pfm_theme', selectedTheme);
    });
  }

  setTheme(theme: AppTheme): void {
    this.theme.set(theme);
  }

  private getStoredTheme(): AppTheme {
    const stored = localStorage.getItem('pfm_theme');
    const validThemes: AppTheme[] = ['light', 'midnight', 'forest', 'ocean', 'sunset', 'lavender'];

    return stored && validThemes.includes(stored as AppTheme) ? (stored as AppTheme) : 'light';
  }
}
