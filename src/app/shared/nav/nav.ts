// Import the Angular building blocks.
import { NgIf } from '@angular/common';
import { Component, computed, signal, ElementRef, OnDestroy, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { AppTheme, ThemeService } from '../../services/theme';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './nav.html',
  styleUrl: './nav.css'
})
export class Nav implements OnDestroy {
  readonly menuOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly themePopupOpen = signal(false);
  readonly themeOptions: AppTheme[] = ['light', 'midnight', 'forest', 'ocean', 'sunset', 'lavender'];
  readonly currentTheme = computed(() => this.themeService.theme());
  
  // Compute a human-friendly title from the current router URL.
  currentTitle = () => {
    const path = (this.router.url || '').split('?')[0] || '';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/transactions')) return 'Transactions';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/budgets')) return 'Budgets';
    if (path.startsWith('/reports')) return 'Reports';
    if (path === '' || path === '/') return 'Home';
    // Fallback: show the last path segment capitalized.
    const seg = path.split('/').filter(Boolean).pop() ?? '';
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  };

  // keep a bound handler so we can add/remove it as an event listener
  private readonly _docClick = (e: Event) => {
    const tgt = e.target as Node | null;
    if (this.profileOpen() && tgt && !this.host.nativeElement.contains(tgt)) {
      this.profileOpen.set(false);
      this.themePopupOpen.set(false);
    }
  };

  constructor(
    public auth: Auth,
    private router: Router,
    public themeService: ThemeService,
    private host: ElementRef,
    public toast: ToastService
  ) {
    effect(() => {
      if (this.profileOpen()) {
        document.addEventListener('click', this._docClick, true);
      } else {
        document.removeEventListener('click', this._docClick, true);
      }
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this._docClick, true);
  }

  toggleMenu(): void {
    this.menuOpen.set(!this.menuOpen());
    if (!this.menuOpen()) {
      this.themePopupOpen.set(false);
    }
  }

  toggleProfile(): void {
    this.profileOpen.set(!this.profileOpen());
  }

  toggleThemePopup(): void {
    this.themePopupOpen.set(!this.themePopupOpen());
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.themePopupOpen.set(false);
  }

  getThemeLabel(theme: AppTheme): string {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  }

  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
    this.themePopupOpen.set(false);
    this.closeMenu();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['']);
  }
}
