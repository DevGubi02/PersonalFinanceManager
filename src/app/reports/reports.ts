// Import the Angular building blocks and our services/models.
import { Component, OnInit, signal, ChangeDetectionStrategy, effect } from '@angular/core';   // Component + signals + OnPush.
import { CommonModule } from '@angular/common';      // *ngFor, *ngIf, currency/date pipes.
import { FormsModule } from '@angular/forms';        // [(ngModel)] two-way binding.
import { Nav } from '../shared/nav/nav';             // The top navigation bar.
import { Api } from '../services/api';               // Our API service.
import { Transaction } from '../models/models';      // Data shapes.
import * as XLSX from 'xlsx';                        // Excel export library.
import { AppCurrencyPipe } from '../shared/currency.pipe';
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-reports',                           // The HTML tag <app-reports>.
  standalone: true,                                  // Manages its own imports.
  imports: [CommonModule, FormsModule, Nav, AppCurrencyPipe], // Directives + forms + nav + currency.
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.html',                     // The HTML layout.
  styleUrl: './reports.css'                          // The styles.
})
export class Reports implements OnInit {             // The reports page component.
  private allTransactionsSignal = signal<Transaction[]>([]); // Signal for all transactions.
  private loadingSignal = signal<boolean>(true);     // Loading state signal.
  private exportingSignal = signal<boolean>(false);  // Exporting state signal.

  // Filter signals
  startDate = signal<string>('');                    // Start date filter.
  endDate = signal<string>('');                      // End date filter.
  validationAttempted = false;

  // Computed filtered transactions.
  filteredTransactions = () => {
    return this.allTransactionsSignal();             // Return all transactions (already filtered by API).
  };

  // Getters for template access.
  allTransactions() { return this.allTransactionsSignal(); }
  loading() { return this.loadingSignal(); }
  exporting() { return this.exportingSignal(); }

  constructor(private api: Api, private toast: ToastService) {} // Receive API and shared error toast.

  ngOnInit(): void {                                 // Runs once when the page loads.
    this.setDefaultDateRange();                      // Set default date range to current month.
    this.loadTransactions();                         // Load the existing transactions.
  }

  // Set default date range to current month.
  private setDefaultDateRange(): void {              // Helper to set default dates.
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Format dates as YYYY-MM-DD.
    const startDateStr = firstDay.toISOString().substring(0, 10);
    const endDateStr = today.toISOString().substring(0, 10);
    
    this.startDate.set(startDateStr);               // Set start date to first of month.
    this.endDate.set(endDateStr);                   // Set end date to today.
  }

  // Search for transactions using the selected date range.
  searchTransactions(): void {
    this.validationAttempted = true;
    this.loadTransactions();
  }

  // Load the user's transactions from the API.
  loadTransactions(): void {                         // The transaction-loading method.
    const startDate = this.startDate();              // Get the start date.
    const endDate = this.endDate();                  // Get the end date.

    if (!startDate || !endDate) {
      this.toast.show('Please select both start and end dates.');
      return;
    }
    if (startDate > endDate) {
      this.toast.show('Start date cannot be after end date.');
      return;
    }

    this.loadingSignal.set(true);                    // Show loading.
    this.api.getReport(startDate, endDate).subscribe({ // Call the report API with date range.
      next: (data) => {                               // Runs when the data arrives.
        // Sort by date descending.
        const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.allTransactionsSignal.set(sorted);      // Save the list.
        this.loadingSignal.set(false);                // Done loading.
      },
      error: () => {                                  // Runs if the request fails.
        this.loadingSignal.set(false);                // Stop loading on error.
        this.toast.show('Could not load the report. Please try again.');
      }
    });
  }

  // Export filtered transactions to Excel.
  formatDateOnly(value: string | null | undefined): string {
    if (!value) return '';

    const normalized = value.includes('T') ? value.split('T')[0] : value;
    const match = normalized.match(/^\d{4}-\d{2}-\d{2}$/);

    return match ? normalized : new Date(value).toISOString().split('T')[0];
  }

  exportToExcel(): void {                            // The export method.
    const data = this.filteredTransactions();        // Get the filtered data.
    if (data.length === 0) {
      this.toast.show('No data to export. Please adjust your filters.');
      return;
    }

    this.exportingSignal.set(true);                  // Show exporting state.

    try {
      // Prepare data for Excel with readable column names.
      const exportData = data.map(t => ({
        'Date': this.formatDateOnly(t.date),
        'Category': t.categoryName || 'Unknown',
        'Type': t.type,
        'Amount': t.amount,
        'Description': t.description || ''
      }));

      // Create workbook and worksheet.
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Style the header row (make it bold and add background).
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_col(col) + '1';
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: 'FFD966' } } // Light yellow background.
          };
        }
      }

      // Auto-size columns based on content.
      const colWidths = exportData.length > 0 ? 
        Object.keys(exportData[0]).map(key => ({ wch: Math.max(key.length + 2, 15) })) :
        [];
      worksheet['!cols'] = colWidths;

      // Generate filename with date range.
      const today = new Date().toISOString().substring(0, 10);
      const filename = `transactions-report-${today}.xlsx`;

      // Write the file.
      XLSX.writeFile(workbook, filename);

      this.exportingSignal.set(false);                // Done exporting.
    } catch (error) {
      console.error('Export failed:', error);
      this.toast.show('Failed to export to Excel. Please try again.');
      this.exportingSignal.set(false);                // Stop exporting on error.
    }
  }

  // Calculate totals for filtered data.
  getTotalIncome(): number {
    return this.filteredTransactions()
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpense(): number {
    return this.filteredTransactions()
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetTotal(): number {
    return this.getTotalIncome() - this.getTotalExpense();
  }
}
