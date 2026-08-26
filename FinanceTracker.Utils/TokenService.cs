// Import the tools needed to build and sign JWT tokens.
using System.IdentityModel.Tokens.Jwt;         // The JwtSecurityTokenHandler that creates token strings.
using System.Security.Claims;                  // "Claims" are pieces of info we store inside the token.
using System.Text;                             // Used to turn our secret key text into bytes.
using Microsoft.Extensions.Configuration;      // Lets us read the JWT secret from configuration.
using Microsoft.IdentityModel.Tokens;          // Signing credentials and security keys.

namespace FinanceTracker.Utils;              // Namespace for our utility classes.

// Interface describing a service that can create login tokens for users.
public interface ITokenService               // The contract for a token service.
{
    string CreateToken(int userId, string email); // Build a signed JWT token; returns it as text.
}

// The real implementation that reads the secret key from configuration and signs tokens.
public class TokenService : ITokenService    // The concrete token service.
{
    private readonly IConfiguration _configuration; // Holds app settings so we can read the JWT secret.

    public TokenService(IConfiguration configuration) // Constructor receives configuration (dependency injection).
    {
        _configuration = configuration;         // Save it for use in CreateToken below.
    }

    // Create a signed token containing the user's id and email.
    public string CreateToken(int userId, string email) // The token-creation method.
    {
        var keyText = _configuration["Jwt:Key"] ?? "dev_secret_key_please_change"; // Read the secret key.

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyText)); // Wrap the key as bytes.

        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256); // How we sign it.

        var claims = new[]                       // The "claims" are the facts stored inside the token.
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()), // Store the user's id (subject).
            new Claim(JwtRegisteredClaimNames.Email, email),           // Store the user's email.
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // A unique id for this token.
        };

        var token = new JwtSecurityToken(        // Build the token itself.
            claims: claims,                      // The facts about the user.
            expires: DateTime.UtcNow.AddHours(8),// The token stops working after 8 hours.
            signingCredentials: credentials);    // The signature that proves it is genuine.

        return new JwtSecurityTokenHandler().WriteToken(token); // Turn the token into the compact string.
    }
}
