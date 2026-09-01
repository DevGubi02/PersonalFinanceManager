// Import the Angular building blocks and our services/models.
import { Component, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';   // Component + signals + OnPush.
import { CommonModule } from '@angular/common';      // *ngFor, *ngIf, currency/date pipes.
import { FormsModule } from '@angular/forms';        // [(ngModel)] two-way binding.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { Transaction, Category } from '../models/models'; // Data shapes.
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-transactions',                      // The HTML tag <app-transactions>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, FormsModule, Nav],         // Directives + forms + nav bar.
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions.html',                // The HTML layout.
  styleUrl: './transactions.css'                     // The styles.
})
export class Transactions implements OnInit {        // The transactions page component.
  private itemsSignal = signal<Transaction[]>([]);   // Signal for transactions list.
  private categoriesSignal = signal<Category[]>([]); // Signal for categories dropdown.
  newItem: Transaction = this.blankItem();           // The "new transaction" form model.
  private loadingSignal = signal<boolean>(true);     // Loading state signal.
  private savingSignal = signal<boolean>(false);     // Saving state signal.

  // Getters for template access.
  items() { return this.itemsSignal(); }
  categories() { return this.categoriesSignal(); }
  loading() { return this.loadingSignal(); }
  saving() { return this.savingSignal(); }

  constructor(private api: Api, private toast: ToastService) {} // Receive the API service and toast helper.

  ngOnInit(): void {                                 // Runs once when the page loads.
    this.loadCategories();                           // Load categories for the dropdown.
    this.loadTransactions();                         // Load the existing transactions.
  }

  // Create a fresh, empty transaction object for the form.
  blankItem(): Transaction {                         // Returns a blank transaction.
    return {                                         // Build the object with sensible defaults.
      categoryId: 0,                                 // No category chosen yet.
      amount: 0,                                     // Zero amount.
      type: 'Expense',                               // Default to expense.
      description: '',                               // Empty note.
      date: new Date().toISOString().substring(0, 10) // Today's date as "YYYY-MM-DD".
    };
  }

  // Load the user's categories from the API.
  loadCategories(): void {                           // The category-loading method.
    this.api.getCategories().subscribe(cats => this.categoriesSignal.set(cats)); // Save the categories when they arrive.
  }

  // Keep the type in sync with the selected category.
  onCategoryChange(): void {
    const selectedCategory = this.categoriesSignal().find(c => c.id === this.newItem.categoryId);
    if (selectedCategory) {
      this.newItem.type = selectedCategory.type;
    }
  }

  // Load the user's transactions from the API.
  loadTransactions(): void {                         // The transaction-loading method.
    this.loadingSignal.set(true);                    // Show loading.
    this.api.getTransactions().subscribe({           // Ask the API for the transactions.
      next: (data) => {                               // Runs when the data arrives.
        this.itemsSignal.set(data);                   // Save the list.
        this.loadingSignal.set(false);                // Done loading.
      },
      error: () => {                                  // Runs if the request fails.
        this.loadingSignal.set(false);                // Stop loading on error.
      }
    });
  }

  // Save the new transaction from the form.
  add(): void {                                      // The add method.
    if (!this.newItem.categoryId || !this.newItem.type || this.newItem.amount <= 0 || !this.newItem.date) {
      this.toast.show('Please fill in category, type, amount and date.');
      return; // Require category, type, positive amount, and date; note is optional.
    }

    this.savingSignal.set(true);                      // Show saving.
    this.api.createTransaction(this.newItem).subscribe({ // Ask the API to create it.
      next: () => {                                   // Runs on success.
        this.savingSignal.set(false);                 // Done saving.
        this.newItem = this.blankItem();              // Reset the form.
        this.loadTransactions();                      // Refresh the list.
      },
      error: () => {                                  // Runs on failure.
        this.savingSignal.set(false);                 // Stop saving on error.
      }
    });
  }

  // Delete a transaction after asking the user to confirm.
  remove(id?: number): void {                        // The delete method.
    if (!id) return;                                 // Nothing to delete without an id.
    if (!confirm('Delete this transaction?')) return; // Ask for confirmation.
    this.api.deleteTransaction(id).subscribe(() => this.loadTransactions()); // Delete then refresh.
  }

  // Export the current transactions to a CSV file the user can open in Excel.
  exportCsv(): void {                                // The export method.
    const header = ['Date', 'Type', 'Category', 'Amount', 'Description']; // The CSV header row.
    const rows = this.itemsSignal().map(t => [               // Turn each transaction into an array of text values.
      t.date,                                        // The date value.
      t.type,                                        // The type value.
      t.categoryName ?? '',                          // The category name (blank if missing).
      t.amount.toString(),                           // The amount as text.
      (t.description ?? '').replace(/"/g, '""')      // The note, with any quotes escaped for CSV safety.
    ].map(v => `"${v}"`).join(','));                 // Wrap each value in quotes and join with commas.

    const csv = [header.join(','), ...rows].join('\n'); // Join the header and rows with new lines.

    const blob = new Blob([csv], { type: 'text/csv' }); // Turn the text into a downloadable file object.
    const url = URL.createObjectURL(blob);           // Create a temporary URL for the file.
    const a = document.createElement('a');           // Create an invisible link element.
    a.href = url;                                    // Point the link at our file.
    a.download = 'transactions.csv';                 // Set the downloaded file name.
    a.click();                                       // Trigger the download.
    URL.revokeObjectURL(url);                        // Clean up the temporary URL.
  }
}
