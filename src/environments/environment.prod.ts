// Production/server configuration.
// Change these values before deployment to your live API URL.
export const environment = {
  production: true,
  // Static Web Apps cannot proxy to an arbitrary external URL through a route
  // rewrite. In production, call the deployed App Service API directly.
  apiUrl: 'https://financetrackerwebapi-g0cmdxgga7hzevf9.australiaeast-01.azurewebsites.net/api'
};
