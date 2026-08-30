// Import the Angular routing tools.
import { CanActivateFn, Router } from '@angular/router'; // The guard type and the Router for redirecting.
import { inject } from '@angular/core';                   // Lets us grab services inside a function.
import { Auth } from './auth';                            // Our auth service.

// A route guard decides whether the user is allowed to open a page.
// We use it to protect pages that require the user to be logged in.
export const authGuard: CanActivateFn = () => { // The guard function.
  const auth = inject(Auth);       // Get the shared Auth service.
  const router = inject(Router);   // Get the Router so we can redirect if needed.

  if (auth.isLoggedIn()) {         // If the user is logged in...
    return true;                   // ...allow them to view the page.
  }

  router.navigate(['']);           // Otherwise, send them to the login page.
  return false;                    // Block the current page.
};
