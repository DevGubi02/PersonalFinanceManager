// Import the Angular building blocks and our services/models.
import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core'; // Component + signals + OnPush.
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';      // Gives us *ngFor, *ngIf, and the currency pipe.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { DashboardSummary, CategorySummary } from '../models/models'; // Data shapes.

@Component({
  selector: 'app-dashboard',                         // The HTML tag <app-dashboard>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, Nav],                      // Common directives + the nav bar.
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',                   // The HTML layout.
  styleUrl: './dashboard.css'                        // The styles.
})
export class Dashboard implements OnInit, OnDestroy {           // The dashboard page component.
  private summarySignal = signal<DashboardSummary | null>(null); // Signal holding the summary data.
  private loadingSignal = signal<boolean>(true);               // Signal for loading state.

  // Typed getters so Angular templates can access the unwrapped values.
  get summary(): DashboardSummary | null { return this.summarySignal(); }
  get loading(): boolean { return this.loadingSignal(); }

  // Explicit accessor methods for templates to avoid signal typing issues.
  summaryValue(): DashboardSummary | null { return this.summarySignal(); }
  loadingValue(): boolean { return this.loadingSignal(); }

  private navSub: Subscription | null = null;

  constructor(private api: Api, private router: Router) {}    // Receive the API service + Router.

  ngOnInit(): void {                                          // Runs automatically once when the page appears.
    this.loadSummary();                                       // Load the dashboard data immediately.

    // Also reload when navigation finishes — handles race after login.
    this.navSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      console.log('[Dashboard] navigation end - reloading summary');
      this.loadSummary();
    });
  }

  ngOnDestroy(): void { this.navSub?.unsubscribe(); }

  // Fetch the summary from the API.
  loadSummary(): void {                              // The load method.
    console.log('[Dashboard] loadSummary called');
    this.loadingSignal.set(true);                             // Show the loading state.
    this.api.getDashboardSummary().subscribe({       // Ask the API for the summary.
      next: (data) => {                               // Runs when the data arrives.
        console.log('[Dashboard] summary received', data);
        this.summarySignal.set(data);                          // Save the data to display.
        this.loadingSignal.set(false);                         // Done loading.
      },
      error: (err) => {                               // Runs if the request fails.
        console.error('[Dashboard] summary error', err);
        this.loadingSignal.set(false);                         // Stop loading even on error.
      }
    });
  }

  // Work out a bar's width as a percentage of the largest category total.
  barWidth(item: CategorySummary): number {          // Returns 0-100 for the given item.
    const s = this.summarySignal();                         // Read the signal value.
    if (!s || s.byCategory.length === 0) return 0; // No data -> 0 width.
    const max = Math.max(...s.byCategory.map(c => c.total));  // Find the largest total.
    if (max === 0) return 0;                         // Avoid dividing by zero.
    return (item.total / max) * 100;                 // This bar's size relative to the biggest.
  }
}
