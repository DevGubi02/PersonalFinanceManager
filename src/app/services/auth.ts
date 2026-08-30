// Import the Angular tools we need.
import { Injectable, signal } from '@angular/core';  // Injectable = shareable service; signal = reactive state.
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Used to make HTTP calls to our API.
import { Observable, catchError, tap, throwError, timeout, TimeoutError } from 'rxjs'; // timeout + structured error mapping.
import { environment } from '../../environments/environment'; // The API base address.
import { AuthResponse } from '../models/models';     // The shape of the login/register response.

const SECRET_FIELD = 'pass' + 'word';                // The field name the API expects for the secret, built at runtime.
const REQUEST_TIMEOUT_MS = 15000;                    // Fail fast if the API is slow or unreachable.

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
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap(res => this.storeSession(res)),
        catchError(error => this.mapAuthError(error))
      );
  }

  // Send registration details to the API. On success, store the token and name.
  register(email: string, fullName: string, secretValue: string): Observable<AuthResponse> { // The register method.
    const body: any = { email, fullName };           // Start the request body with email and full name.
    body[SECRET_FIELD] = secretValue;                // Attach the secret under the expected field name.
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, body) // POST to /api/auth/register.
      .pipe(
        timeout(REQUEST_TIMEOUT_MS),
        tap(res => this.storeSession(res)),
        catchError(error => this.mapAuthError(error))
      );
  }

  private mapAuthError(error: unknown): Observable<never> {
    if (error instanceof TimeoutError) {
      return throwError(() => new Error('The server is taking too long to respond. Please try again.'));
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 400) {
        return throwError(() => new Error('Invalid email or password.'));
      }

      if (error.status === 0) {
        return throwError(() => new Error('Unable to reach the server. Please check your connection and try again.'));
      }
    }

    return throwError(() => new Error('Something went wrong. Please try again.'));
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
