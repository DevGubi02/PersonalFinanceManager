// This file defines the "shapes" of the data our app sends to and receives from the API.
// TypeScript interfaces describe what fields exist, which helps catch mistakes early.

// The response returned by the API after a successful login or registration.
export interface AuthResponse {
  token: string;      // The signed JWT token we store and send on every request.
  fullName: string;   // The user's display name, for greeting them.
  userId: number;     // The user's unique id.
}

// One spending/earning category, e.g. "Food" or "Salary".
export interface Category {
  id?: number;        // The category id (optional because a new category does not have one yet).
  userId?: number;    // The owner id (the server fills this in, so it is optional here).
  name: string;       // The category name shown in the app.
  type: 'Income' | 'Expense';  // Whether it is income or expense.
}

// One money movement (income or expense).
export interface Transaction {
  id?: number;                 // The transaction id (optional for new ones).
  userId?: number;             // The owner id (server-filled).
  categoryId: number;          // Which category this belongs to.
  amount: number;              // The money amount.
  type: 'Income' | 'Expense';  // Income or expense.
  description?: string;        // Optional note.
  date: string;                // The date, stored as text like "2026-07-18".
  categoryName?: string;       // The category name (server adds this for display).
}

// One monthly budget limit for a category.
export interface Budget {
  id?: number;         // The budget id (optional for new ones).
  userId?: number;     // The owner id (server-filled).
  categoryId: number;  // Which category this budget limits.
  monthlyLimit: number;// The maximum planned spend.
  month: number;       // Month number (1-12).
  year: number;        // Year (e.g. 2026).
}

// One row in the dashboard's per-category breakdown.
export interface CategorySummary {
  categoryName: string;        // The category name.
  type: 'Income' | 'Expense';  // Income or expense.
  total: number;               // The total money for this category.
}

// The overall dashboard summary shown at the top of the page and in the charts.
export interface DashboardSummary {
  totalIncome: number;             // Sum of all income.
  totalExpense: number;            // Sum of all expenses.
  balance: number;                 // Income minus expense.
  byCategory: CategorySummary[];   // Breakdown used for charts.
}
