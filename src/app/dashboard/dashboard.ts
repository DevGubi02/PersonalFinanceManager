import { Component, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core'; // Component + signals + OnPush.
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';      // Gives us *ngFor, *ngIf, and the currency pipe.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { DashboardSummary, CategorySummary, Budget } from '../models/models'; // Data shapes.
import { AppCurrencyPipe } from '../shared/currency.pipe';

@Component({
  selector: 'app-dashboard',                         // The HTML tag <app-dashboard>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, Nav, AppCurrencyPipe],    // Common directives + nav + shared currency.
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',                   // The HTML layout.
  styleUrl: './dashboard.css'                        // The styles.
})
export class Dashboard implements OnInit, OnDestroy {           // The dashboard page component.
  private summarySignal = signal<DashboardSummary | null>(null); // Signal holding the summary data.
  private loadingSignal = signal<boolean>(true);               // Signal for loading state.
  private budgetsSignal = signal<Budget[]>([]);               // Signal for budgets list.

  // Typed getters so Angular templates can access the unwrapped values.
  get summary(): DashboardSummary | null { return this.summarySignal(); }
  get loading(): boolean { return this.loadingSignal(); }

  // Explicit accessor methods for templates to avoid signal typing issues.
  summaryValue(): DashboardSummary | null { return this.summarySignal(); }
  loadingValue(): boolean { return this.loadingSignal(); }
  budgets(): Budget[] { return this.budgetsSignal(); }

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
        this.enrichWithBudgets();                              // Enrich with budget data.
      },
      error: (err) => {                               // Runs if the request fails.
        console.error('[Dashboard] summary error', err);
        this.loadingSignal.set(false);                         // Stop loading even on error.
      }
    });
  }

  // Fetch budgets and enrich the summary with budget limits.
  private enrichWithBudgets(): void {                // Enrich summary with budget info.
    this.api.getBudgets().subscribe({                // Get all budgets.
      next: (budgets) => {                            // When budgets arrive.
        this.budgetsSignal.set(budgets);              // Store them.
        const summary = this.summarySignal();         // Get current summary.
        if (summary) {
          // For each category, find the budget for this month/year (if any).
          const now = new Date();
          const currentMonth = now.getMonth() + 1;    // 1-based month.
          const currentYear = now.getFullYear();
          
          summary.byCategory.forEach(cat => {
            const budget = budgets.find(b => 
              b.categoryId === (cat as any).categoryId && // Note: categoryId is not in the interface but may be on the object
              b.month === currentMonth && 
              b.year === currentYear
            );
            if (budget) {
              cat.budgetLimit = budget.monthlyLimit;  // Add budget limit to category.
            }
          });
        }
      },
      error: (err) => {                               // If budgets fail to load.
        console.error('[Dashboard] budgets error', err);
        // Continue without budgets; don't block the summary.
      }
    });
  }

  // Work out a bar's width as a percentage of the largest category total.
  barWidth(item: CategorySummary): number {          // Returns 0-100 for the given item.
    const s = this.summarySignal();                         // Read the signal value.
    if (!s || s.byCategory.length === 0) return 0; // No data -> 0 width.
    
    // Use budget limit as max if available, otherwise use the largest total.
    let max = item.budgetLimit || 0;
    if (max === 0) {
      max = Math.max(...s.byCategory.map(c => c.total));  // Find the largest total.
    }
    
    if (max === 0) return 0;                         // Avoid dividing by zero.
    return (item.total / max) * 100;                 // This bar's size relative to the max.
  }

  // Calculate budget status: percentage used and over/under status.
  budgetStatus(item: CategorySummary): { percentage: number; status: string; over: boolean } {
    if (!item.budgetLimit) {
      return { percentage: 0, status: 'No budget', over: false };
    }
    const percentage = (item.total / item.budgetLimit) * 100;
    const over = percentage > 100;
    const status = over ? `Over by ${(percentage - 100).toFixed(0)}%` : `${percentage.toFixed(0)}% used`;
    return { percentage, status, over };
  }
}
