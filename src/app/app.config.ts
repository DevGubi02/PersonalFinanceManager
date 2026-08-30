// Import the Angular application configuration tools.
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'; // App config types.
import { provideRouter } from '@angular/router';                       // Enables page routing.
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Enables HTTP + interceptors.

import { routes } from './app.routes';                                 // Our list of pages/routes.
import { authInterceptor } from './services/auth-interceptor';         // Attaches the login token to requests.

// This object configures the whole application when it starts up.
export const appConfig: ApplicationConfig = { // The app-wide configuration.
  providers: [                                 // The list of services turned on for the app.
    provideBrowserGlobalErrorListeners(),      // Report uncaught errors to the console.
    provideRouter(routes),                     // Turn on routing using our routes list.
    provideHttpClient(withInterceptors([authInterceptor])) // Turn on HTTP and register our token interceptor.
  ]
};
