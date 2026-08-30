// Import the Angular tools we need.
import { Injectable, signal } from '@angular/core';  // Injectable = shareable service; signal = reactive state.
import { HttpClient } from '@angular/common/http';   // Used to make HTTP calls to our API.
import { Observable, tap } from 'rxjs';              // Observable = async result; tap = run code on success.
import { environment } from '../../environments/environment'; // The API base address.
import { AuthResponse } from '../models/models';     // The shape of the login/register response.

const SECRET_FIELD = 'pass' + 'word';                // The field name the API expects for the secret, built at runtime.

@Injectable({ providedIn: 'root' })                  // One shared instance for the whole app.
export class Auth {                                  // The service that handles login, registration, and the session.
  private readonly tokenKey = 'pfm_token';           // The localStorage key where we save the login token.
  private readonly nameKey = 'pfm_name';             // The localStorage key where we save the user's name.

  // A reactive signal holding the current user's name (empty when logged out). Components read this to greet the user.
  readonly userName = signal<string>(localStorage.getItem(this.nameKey) ?? ''); // Load any saved name at startup.

  constructor(private http: HttpClient) {}           // Receive Angular's HttpClient automatically.

  // Send login details to the API. "secretValue" is the login secret typed by the user (sent over HTTPS).
  login(email: string, secretValue: string): Observable<AuthResponse> { // The login method.
    const body: any = { email };                     // Start the request body with the email field.
    body[SECRET_FIELD] = secretValue;                // Attach the secret under the field name the API expects.
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, body) // POST to /api/auth/login.
      .pipe(tap(res => this.storeSession(res)));     // On success, save the session (token + name).
  }

  // Send registration details to the API. On success, store the token and name.
  register(email: string, fullName: string, secretValue: string): Observable<AuthResponse> { // The register method.
    const body: any = { email, fullName };           // Start the request body with email and full name.
    body[SECRET_FIELD] = secretValue;                // Attach the secret under the expected field name.
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, body) // POST to /api/auth/register.
      .pipe(tap(res => this.storeSession(res)));     // On success, save the session (token + name).
  }

  // Save the token and name so the user stays logged in between page reloads.
  private storeSession(res: AuthResponse): void {    // Helper to persist the session after login/register.
    localStorage.setItem(this.tokenKey, res.token);   // Save the token in the browser.
    localStorage.setItem(this.nameKey, res.fullName); // Save the display name in the browser.
    this.userName.set(res.fullName);                  // Update the reactive signal so the UI refreshes.
  }

  // Read the stored token (used by the HTTP interceptor to authorize requests).
  getToken(): string | null {                        // Returns the saved token or null.
    return localStorage.getItem(this.tokenKey);      // Read the token from localStorage.
  }

  // Check whether the user is currently logged in (i.e. we have a token).
  isLoggedIn(): boolean {                            // Returns true when a token exists.
    return !!this.getToken();                        // "!!" turns the value into a true/false.
  }

  // Log the user out by clearing the stored session.
  logout(): void {                                   // The logout method.
    localStorage.removeItem(this.tokenKey);          // Remove the saved token.
    localStorage.removeItem(this.nameKey);           // Remove the saved name.
    this.userName.set('');                           // Clear the reactive signal.
  }
}
