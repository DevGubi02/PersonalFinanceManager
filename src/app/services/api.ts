// Import the Angular tools and our data models.
import { Injectable } from '@angular/core';           // Marks this as a shareable service.
import { HttpClient } from '@angular/common/http';    // Used to call the API over HTTP.
import { Observable } from 'rxjs';                     // The async result type our methods return.
import { environment } from '../../environments/environment'; // The API base address.
import { Transaction, Category, Budget, DashboardSummary } from '../models/models'; // Data shapes.

@Injectable({ providedIn: 'root' })                    // One shared instance for the whole app.
export class Api {                                     // The service that talks to every finance endpoint.
  private readonly base = environment.apiUrl;          // The base API address, e.g. https://localhost:7000/api.

  constructor(private http: HttpClient) {}             // Receive Angular's HttpClient automatically.

  // ---------------- TRANSACTIONS ----------------

  getTransactions(): Observable<Transaction[]> {                                   // Get the user's transactions.
    return this.http.get<Transaction[]>(`${this.base}/transactions`);             // GET /api/transactions.
  }

  createTransaction(t: Transaction): Observable<Transaction> {                     // Add a new transaction.
    return this.http.post<Transaction>(`${this.base}/transactions`, t);           // POST /api/transactions.
  }

  updateTransaction(id: number, t: Transaction): Observable<Transaction> {         // Update one transaction by id.
    return this.http.put<Transaction>(`${this.base}/transactions/${id}`, t);      // PUT /api/transactions/{id}.
  }

  deleteTransaction(id: number): Observable<void> {                                // Delete one transaction by id.
    return this.http.delete<void>(`${this.base}/transactions/${id}`);             // DELETE /api/transactions/{id}.
  }

  // ---------------- CATEGORIES ----------------

  getCategories(): Observable<Category[]> {                                        // Get the user's categories.
    return this.http.get<Category[]>(`${this.base}/categories`);                  // GET /api/categories.
  }

  createCategory(c: Category): Observable<Category> {                              // Add a new category.
    return this.http.post<Category>(`${this.base}/categories`, c);                // POST /api/categories.
  }

  deleteCategory(id: number): Observable<void> {                                   // Delete one category by id.
    return this.http.delete<void>(`${this.base}/categories/${id}`);               // DELETE /api/categories/{id}.
  }

  // ---------------- BUDGETS ----------------

  getBudgets(): Observable<Budget[]> {                                             // Get the user's budgets.
    return this.http.get<Budget[]>(`${this.base}/budgets`);                       // GET /api/budgets.
  }

  createBudget(b: Budget): Observable<Budget> {                                    // Add a new budget.
    return this.http.post<Budget>(`${this.base}/budgets`, b);                     // POST /api/budgets.
  }

  deleteBudget(id: number): Observable<void> {                                     // Delete one budget by id.
    return this.http.delete<void>(`${this.base}/budgets/${id}`);                  // DELETE /api/budgets/{id}.
  }

  // ---------------- DASHBOARD ----------------

  getDashboardSummary(start?: string, end?: string): Observable<DashboardSummary> { // Get the dashboard summary.
    let query = '';                                                // Start with an empty query string.
    if (start) query += `?start=${start}`;                         // Add the start date if one was given.
    if (end) query += `${query ? '&' : '?'}end=${end}`;            // Add the end date if one was given.
    return this.http.get<DashboardSummary>(`${this.base}/dashboard/summary${query}`); // GET the summary.
  }
}
