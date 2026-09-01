// Import the routing type and all the page components.
import { Routes } from '@angular/router';                   // The type describing our routes.
import { Login } from './auth/login/login';                 // The login page.
import { CreateUsers } from './create-users/create-users';  // The registration page.
import { Dashboard } from './dashboard/dashboard';          // The dashboard (charts + totals).
import { Transactions } from './transactions/transactions'; // The transactions page.
import { Categories } from './categories/categories';       // The categories page.
import { Budgets } from './budgets/budgets';                // The budgets page.
import { Reports } from './reports/reports';                // The reports page.
import { Settings } from './settings/settings';              // Currency and app settings.
import { authGuard } from './services/auth-guard';          // Blocks pages when not logged in.

// The list of pages in our app and which URL shows each one.
export const routes: Routes = [                                            // The route table.
  { path: '', component: Login },                                          // "/" shows the login page.
  { path: 'register', component: CreateUsers },                            // "/register" shows sign-up.
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },   // "/dashboard" (login required).
  { path: 'transactions', component: Transactions, canActivate: [authGuard] }, // "/transactions" (login required).
  { path: 'categories', component: Categories, canActivate: [authGuard] }, // "/categories" (login required).
  { path: 'budgets', component: Budgets, canActivate: [authGuard] },       // "/budgets" (login required).
  { path: 'reports', component: Reports, canActivate: [authGuard] },       // "/reports" (login required).
  { path: 'settings', component: Settings, canActivate: [authGuard] },     // "/settings" (login required).
  { path: '**', redirectTo: '' }                                           // Any unknown URL -> back to login.
];
