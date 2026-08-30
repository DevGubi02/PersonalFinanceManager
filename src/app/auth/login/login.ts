// Import the Angular building blocks we need.
import { Component } from '@angular/core';            // Marks this class as a UI component.
import { CommonModule } from '@angular/common';       // Provides *ngIf and *ngFor for the template.
import { FormsModule } from '@angular/forms';         // Enables [(ngModel)] two-way form binding.
import { Router, RouterLink } from '@angular/router'; // Router = navigate in code; RouterLink = link in HTML.
import { Auth } from '../../services/auth';           // Our auth service (login method).

@Component({
  selector: 'app-login',                              // The HTML tag name for this component.
  standalone: true,                                   // This component manages its own imports.
  imports: [CommonModule, FormsModule, RouterLink],   // Common directives (*ngIf) + forms + router links.
  templateUrl: './login.html',                        // The HTML layout for this page.
  styleUrl: './login.css'                             // The styles for this page.
})
export class Login {                                  // The login page component.
  email = '';        // The email the user types (bound to the input box).
  secretValue = '';  // The login secret the user types (bound to the input box).
  errorMessage = ''; // Message shown if something goes wrong (empty when no error).
  loading = false;   // True while we wait for the server (used to disable the button).

  constructor(private auth: Auth, private router: Router) {} // Receive Auth + Router (dependency injection).

  showToast(message: string): void {
    this.errorMessage = message;
    window.clearTimeout((this as any).toastTimer);
    (this as any).toastTimer = window.setTimeout(() => {
      this.errorMessage = '';
    }, 3000);
  }

  // Called when the user submits the login form.
  onSubmit(): void {                                  // The submit handler.
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.secretValue.trim();

    if (!trimmedEmail || !trimmedPassword) {
      this.showToast('Please enter both email and password.');
      return;
    }

    this.errorMessage = '';   // Clear any old error.
    this.loading = true;      // Show that we are working.

    this.auth.login(trimmedEmail, trimmedPassword).subscribe({ // Ask the auth service to log in.
      next: () => {                                    // Runs when login succeeds.
        this.loading = false;                          // Done working.
        this.errorMessage = '';                        // Clear any toast.
        this.router.navigate(['dashboard']);           // Go to the dashboard.
      },
      error: (err: Error) => {                         // Runs when login fails.
        this.loading = false;                          // Done working.
        this.showToast(err.message || 'Invalid email or password.');
      }
    });
  }
}
