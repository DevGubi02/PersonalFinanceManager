// Import the web framework tools and our own layers.
using Microsoft.AspNetCore.Mvc;               // Controller base classes and HTTP attributes.
using FinanceTracker.DAL;                     // IUserRepository (data access).
using FinanceTracker.DataModels;              // RegisterRequest, LoginRequest, AuthResponse.
using FinanceTracker.Utils;                   // IPasswordHasher, ITokenService.

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

[ApiController]                                 // Marks this as a Web API controller (auto model validation).
[Route("api/[controller]")]                    // The base URL becomes /api/auth.
public class AuthController : ControllerBase   // The controller handling registration and login.
{
    private readonly IUserRepository _users;    // Reads/creates users in the database.
    private readonly IPasswordHasher _hasher;   // Hashes and verifies passwords.
    private readonly ITokenService _tokens;     // Creates signed JWT login tokens.

    public AuthController(IUserRepository users, IPasswordHasher hasher, ITokenService tokens) // Constructor (DI).
    {
        _users = users;                         // Save the user repository.
        _hasher = hasher;                       // Save the password hasher.
        _tokens = tokens;                       // Save the token service.
    }

    [HttpPost("register")]                      // Responds to POST /api/auth/register.
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct) // Register.
    {
        if (!ModelState.IsValid)                // If the incoming data fails validation...
            return BadRequest(ModelState);      // ...return the validation errors.

        var existing = await _users.GetUserByEmailAsync(request.Email, ct); // Look for an existing account.
        if (existing != null)                   // If one already uses this email...
            return Conflict("An account with this email already exists."); // ...return 409 (duplicate).

        var passwordHash = _hasher.Hash(request.Password); // Hash the plain password before storing it.

        var newId = await _users.CreateUserAsync(request.Email, request.FullName, passwordHash, ct); // Create the user.

        var token = _tokens.CreateToken(newId, request.Email); // Create a login token so they are signed in.

        return Ok(new AuthResponse { Token = token, FullName = request.FullName, UserId = newId }); // Return the result.
    }

    [HttpPost("login")]                         // Responds to POST /api/auth/login.
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct) // Login.
    {
        if (!ModelState.IsValid)                // If the incoming data fails validation...
            return BadRequest(ModelState);      // ...return the validation errors.

        var user = await _users.GetUserByEmailAsync(request.Email, ct); // Look up the user by email.

        // If no user was found OR the password does not match, return the SAME generic error.
        if (user == null || !_hasher.Verify(request.Password, user.PasswordHash)) // Check credentials.
            return Unauthorized("Invalid email or password."); // Reject with a generic message.

        var token = _tokens.CreateToken(user.Id, user.Email); // Credentials are correct -> create a token.

        return Ok(new AuthResponse { Token = token, FullName = user.FullName, UserId = user.Id }); // Return the result.
    }
}
