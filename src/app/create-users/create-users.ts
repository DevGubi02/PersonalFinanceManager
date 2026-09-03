// Import the Angular building blocks we need.
import { Component } from '@angular/core';            // Marks this class as a UI component.
import { CommonModule } from '@angular/common';       // Provides *ngIf and *ngFor for the template.
import { FormsModule } from '@angular/forms';         // Enables [(ngModel)] two-way form binding.
import { Router, RouterLink } from '@angular/router'; // Router = navigate in code; RouterLink = link in HTML.
import { Auth } from '../services/auth';              // Our auth service (register method).
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-create-users',                       // The HTML tag name for this component.
  standalone: true,                                   // Manages its own imports.
  imports: [CommonModule, FormsModule, RouterLink],   // Common directives (*ngIf) + forms + router links.
  templateUrl: './create-users.html',                 // The HTML layout.
  styleUrl: './create-users.css'                      // The styles.
})
export class CreateUsers {                            // The registration page component.
  fullName = '';     // The user's display name (bound to the input box).
  email = '';        // The user's email (bound to the input box).
  emailError = '';   // Validation message shown below the email input.
  validationAttempted = false;
  secretValue = '';  // The chosen login secret (bound to the input box).
  loading = false;   // True while waiting for the server.

  constructor(private auth: Auth, private router: Router, private toast: ToastService) {} // Receive Auth + Router (dependency injection).

  // Called when the user submits the registration form.
  onSubmit(): void {                                  // The submit handler.
    this.validationAttempted = true;
    this.toast.hide();       // Clear any old error.
    this.validateEmail();

    if (this.emailError) {
      this.toast.show(this.emailError);
      return;
    }

    if (!this.fullName.trim()) {
      this.toast.show('Full name is required.');
      return;
    }

    if (this.secretValue.length < 8) {               // Basic check: the secret must be 8+ characters.
      this.toast.show('Password must be at least 8 characters.'); // Show the rule to the user.
      return;                                        // Stop here; do not call the server.
    }

    this.loading = true;     // Show that we are working.

    this.auth.register(this.email.trim(), this.fullName.trim(), this.secretValue).subscribe({ // Ask to register.
      next: () => {                                   // Runs when registration succeeds.
        this.loading = false;                         // Done working.
        this.router.navigate(['dashboard']);          // Go straight to the dashboard after signup.
      },
      error: (err) => {                               // Runs when registration fails.
        this.loading = false;                         // Done working.
        // Show a specific message if the email is already taken, otherwise a generic one.
        this.toast.show(err?.status === 409       // 409 means the email already exists.
          ? 'An account with this email already exists.' // Message for a duplicate email.
          : 'Could not create the account. Please try again.'); // Message for any other error.
      }
    });
  }

  validateEmail(): void {
    const email = this.email.trim();
    this.emailError = !email
      ? 'Email is required.'
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? ''
        : 'Please enter a valid email address.';
  }
}
