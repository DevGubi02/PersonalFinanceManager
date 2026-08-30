// Import the Angular tools for HTTP interception.
import { HttpInterceptorFn } from '@angular/common/http'; // The type for a functional interceptor.
import { inject } from '@angular/core';                    // Lets us grab a service inside a function.
import { Auth } from './auth';                             // Our auth service that holds the token.

// An interceptor runs automatically for EVERY outgoing HTTP request.
// This one attaches the login token so the API knows who is calling.
export const authInterceptor: HttpInterceptorFn = (req, next) => { // The interceptor function.
  const auth = inject(Auth);          // Get the shared Auth service.
  const token = auth.getToken();      // Read the stored login token (if any).

  if (token) {                        // If we have a token...
    const cloned = req.clone({        // ...copy the request and add a header (requests are immutable).
      setHeaders: { Authorization: `Bearer ${token}` } // Add the standard "Bearer" auth header.
    });
    return next(cloned);              // Continue with the modified request.
  }

  return next(req);                   // No token -> send the request unchanged.
};
