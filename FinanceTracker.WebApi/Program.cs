// Import everything the app needs to start up and wire together.
using System.Text;                                          // For turning the JWT key text into bytes.
using Microsoft.AspNetCore.Authentication.JwtBearer;        // JWT authentication scheme.
using Microsoft.EntityFrameworkCore;                        // Entity Framework Core (database connection).
using Microsoft.IdentityModel.Tokens;                       // Security key + token validation settings.
using FinanceTracker.DAL;                                   // Our DbContext and repositories.
using FinanceTracker.Utils;                                 // Our password hasher and token service.

var builder = WebApplication.CreateBuilder(args);           // Create the app builder that configures everything.

var configuration = builder.Configuration;                  // Shortcut to app settings (appsettings.json + env vars).

// ---------------------------------------------------------------------
// Register services in the dependency-injection container.
// ---------------------------------------------------------------------

builder.Services.AddControllers();                          // Turn on API controllers (the Controllers folder).

var angularOrigin = configuration["AllowedOrigin"] ?? "http://localhost:4200"; // The Angular app's address.
builder.Services.AddCors(options =>                         // Configure CORS (who is allowed to call the API).
{
    options.AddPolicy("AngularOnly", policy =>              // Create a policy named "AngularOnly".
        policy.WithOrigins(angularOrigin)                  // Allow only the Angular app's address.
              .AllowAnyHeader()                            // Allow any request headers (e.g. Authorization).
              .AllowAnyMethod());                          // Allow GET, POST, PUT, DELETE, etc.
});

var jwtKey = configuration["Jwt:Key"] ?? "dev_secret_key_please_change"; // Read the JWT signing secret.
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);              // Convert the secret text into bytes.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme) // Use JWT bearer authentication.
    .AddJwtBearer(options =>                                // Configure how JWT tokens are validated.
    {
        options.TokenValidationParameters = new TokenValidationParameters // The rules for a valid token.
        {
            ValidateIssuer = false,                        // We do not check the issuer in this simple setup.
            ValidateAudience = false,                      // We do not check the audience in this simple setup.
            ValidateIssuerSigningKey = true,               // We DO verify the token was signed with our key.
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes) // The key used to verify the signature.
        };
    });

builder.Services.AddDbContext<ApplicationDbContext>(options => // Register the database context.
    options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"))); // Use SQL Server + our connection string.

builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();  // Register the password hasher service (Utils).
builder.Services.AddScoped<ITokenService, TokenService>();      // Register the JWT token service (Utils).

builder.Services.AddScoped<IUserRepository, UserRepository>();               // Register the user repository (DAL).
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>(); // Register the transaction repository (DAL).
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();       // Register the category repository (DAL).
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();           // Register the budget repository (DAL).
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();     // Register the dashboard repository (DAL).

builder.Services.AddOpenApi();                              // Add OpenAPI/Swagger for easy API testing in dev.

var app = builder.Build();                                  // Build the application from the settings above.

// ---------------------------------------------------------------------
// Configure the HTTP request pipeline (the order matters here).
// ---------------------------------------------------------------------

if (app.Environment.IsDevelopment())                        // Only in development mode...
{
    app.MapOpenApi();                                       // ...expose the OpenAPI document for testing.
}

app.UseHttpsRedirection();   // Force insecure HTTP requests to switch to secure HTTPS.

app.UseCors("AngularOnly");  // Apply the CORS policy so only the Angular app can call us.
app.UseAuthentication();     // Check the JWT token and identify the user (who are you?).
app.UseAuthorization();      // Enforce [Authorize] rules (are you allowed to do this?).

app.MapControllers();        // Route incoming requests to the matching controller actions.

app.Run();                   // Start the web server and begin handling requests.
