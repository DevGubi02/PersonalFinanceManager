// Import the tools to read claims (facts stored in the JWT token).
using System.Security.Claims;                  // ClaimsPrincipal and claim type names.
using System.IdentityModel.Tokens.Jwt;         // JwtRegisteredClaimNames (e.g. "sub").
using Microsoft.AspNetCore.Mvc;                // ControllerBase.

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

// A helper method shared by all controllers to safely read the logged-in user's id from the token.
public static class ControllerBaseExtensions // Static helper class.
{
    // Read the current user's id out of the JWT token. This is trusted because the token is signed.
    public static int GetUserId(this ControllerBase controller) // Extension method on any controller.
    {
        var idText = controller.User.FindFirstValue(JwtRegisteredClaimNames.Sub) // The id is in the "sub" claim...
                     ?? controller.User.FindFirstValue(ClaimTypes.NameIdentifier); // ...or this fallback claim.

        return int.TryParse(idText, out var id) ? id : 0; // Parse to int; 0 means "not logged in".
    }
}
