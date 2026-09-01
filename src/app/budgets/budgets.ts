// Import the Angular building blocks and our services/models.
import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';   // Component + signals + OnPush.
import { CommonModule } from '@angular/common';      // *ngFor, *ngIf, currency pipe.
import { FormsModule } from '@angular/forms';        // [(ngModel)] two-way binding.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { Budget, Category } from '../models/models'; // Data shapes.
import { ToastService } from '../services/toast';
import { AppCurrencyPipe } from '../shared/currency.pipe';

@Component({
  selector: 'app-budgets',                           // The HTML tag <app-budgets>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, FormsModule, Nav, AppCurrencyPipe], // Directives + forms + nav bar + currency.
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budgets.html',                     // The HTML layout.
  styleUrl: './budgets.css'                          // The styles.
})
export class Budgets implements OnInit {             // The budgets page component.
  private itemsSignal = signal<Budget[]>([]);        // Signal for budgets list.
  private categoriesSignal = signal<Category[]>([]); // Signal for categories.
  newItem: Budget = this.blankItem();                // The "new budget" form model.
  private loadingSignal = signal<boolean>(true);     // Loading state signal.
  private savingSignal = signal<boolean>(false);     // Saving state signal.

  // Template accessors
  items() { return this.itemsSignal(); }
  categories() { return this.categoriesSignal(); }
  loading() { return this.loadingSignal(); }
  saving() { return this.savingSignal(); }

  constructor(private api: Api, private toast: ToastService) {} // Receive the API service and toast helper.

  ngOnInit(): void {                                 // Runs once when the page opens.
    this.loadCategories();                           // Load categories for the dropdown + name lookup.
    this.load();                                     // Load the budgets themselves.
  }

  // Build an empty budget for the form, defaulting to this month/year.
  blankItem(): Budget {                              // Returns a blank budget.
    const now = new Date();                          // Today's date.
    return {                                         // Build the object with sensible defaults.
      categoryId: 0,                                 // No category chosen yet.
      monthlyLimit: 0,                               // Zero limit to start.
      month: now.getMonth() + 1,                     // Current month (getMonth is 0-based, so +1).
      year: now.getFullYear()                        // Current year.
    };
  }

  // Load the user's categories.
  loadCategories(): void {                           // The category-loading method.
    this.api.getCategories().subscribe(cats => this.categoriesSignal.set(cats)); // Save the categories when they arrive.
  }

  // Load the user's budgets.
  load(): void {                                     // The budget-loading method.
    this.loadingSignal.set(true);                    // Show loading.
    this.api.getBudgets().subscribe({                // Ask the API for the budgets.
      next: (data) => {                               // Runs when the data arrives.
        this.itemsSignal.set(data);                   // Save the list.
        this.loadingSignal.set(false);                // Done loading.
      },
      error: () => {                                  // Runs if the request fails.
        this.loadingSignal.set(false);                // Stop loading on error.
      }
    });
  }

  // Look up a category name from its id (for display in the list).
  categoryName(id: number): string {                 // Returns the matching category's name.
    const found = this.categoriesSignal().find(c => c.id === id); // Find the matching category.
    return found ? found.name : 'Unknown';           // Return its name or a fallback.
  }

  // Add a new budget from the form.
  add(): void {                                      // The add method.
    if (!this.newItem.categoryId || this.newItem.monthlyLimit <= 0 || !this.newItem.month || !this.newItem.year) {
      this.toast.show('Please fill in category, limit, month and year.');
      return; // Require category, positive limit, month, and year.
    }

    this.savingSignal.set(true);                      // Show saving.
    this.api.createBudget(this.newItem).subscribe({  // Ask the API to create it.
      next: () => {                                   // Runs on success.
        this.savingSignal.set(false);                 // Done saving.
        this.newItem = this.blankItem();              // Reset the form.
        this.load();                                  // Refresh the list.
      },
      error: () => {                                  // Runs on failure.
        this.savingSignal.set(false);                 // Stop saving on error.
      }
    });
  }

  // Delete a budget after confirming.
  remove(id?: number): void {                        // The delete method.
    if (!id) return;                                 // Need an id.
    if (!confirm('Delete this budget?')) return;     // Confirm first.
    this.api.deleteBudget(id).subscribe(() => this.load()); // Delete then refresh.
  }
}
