// Import the Angular building blocks we need.
import { Component, ChangeDetectorRef } from '@angular/core';            // Marks this class as a UI component.
import { CommonModule } from '@angular/common';       // Provides *ngIf and *ngFor for the template.
import { FormsModule } from '@angular/forms';         // Enables [(ngModel)] two-way form binding.
import { Router, RouterLink } from '@angular/router'; // Router = navigate in code; RouterLink = link in HTML.
import { Auth } from '../../services/auth';           // Our auth service (login method).
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-login',                              // The HTML tag name for this component.
  standalone: true,                                   // This component manages its own imports.
  imports: [CommonModule, FormsModule, RouterLink],   // Common directives (*ngIf) + forms + router links.
  templateUrl: './login.html',                        // The HTML layout for this page.
  styleUrl: './login.css'                             // The styles for this page.
})
export class Login {                                  // The login page component.
  email = '';        // The email the user types (bound to the input box).
  emailError = '';   // Validation message shown below the email input.
  validationAttempted = false;
  secretValue = '';  // The login secret the user types (bound to the input box).
  loading = false;   // True while we wait for the server (used to disable the button).

  constructor(private auth: Auth, private router: Router, private cdr: ChangeDetectorRef, private toast: ToastService) {} // Receive Auth + Router (dependency injection).

  showToast(message: string): void {
    this.toast.show(message, 5000);
  }

  // Called when the user submits the login form.
  onSubmit(): void {                                  // The submit handler.
    this.validationAttempted = true;
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.secretValue.trim();

    this.validateEmail(trimmedEmail);
    if (this.emailError) {
      this.toast.show(this.emailError);
      return;
    }

    if (!trimmedEmail || !trimmedPassword) {
      this.showToast('Please enter both email and password.');
      return;
    }

    this.loading = true;      // Show that we are working.
    this.cdr.markForCheck();  // Ensure loading state is displayed

    this.auth.login(trimmedEmail, trimmedPassword).subscribe({ // Ask the auth service to log in.
      next: () => {                                    // Runs when login succeeds.
        this.loading = false;                          // Done working.
        this.toast.hide();                             // Clear any toast.
        this.router.navigate(['dashboard']);           // Go to the dashboard.
      },
      error: (err: Error) => {                         // Runs when login fails.
        this.loading = false;                          // Done working.
        this.showToast(err.message || 'Invalid email or password.');
      }
    });
  }

  validateEmail(email: string = this.email.trim()): void {
    this.emailError = !email
      ? 'Email is required.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? ''
        : 'Please enter a valid email address.';
  }
}
