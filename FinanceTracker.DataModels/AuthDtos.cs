// The namespace groups all our shared data classes together.
using System.ComponentModel.DataAnnotations; // Gives us [Required], [EmailAddress], etc. for validation.

namespace FinanceTracker.DataModels;         // Namespace for our model classes.

// The data the user sends when they SIGN UP (register a new account).
public class RegisterRequest                  // The registration request model.
{
    [Required]                                // Reject the request if this field is missing.
    [EmailAddress]                            // Reject the request if this is not a valid email format.
    public string Email { get; set; } = string.Empty; // The new account's email.

    [Required]                                // Reject the request if this field is missing.
    [MaxLength(100)]                           // Prevent overly long names (protects the database).
    public string FullName { get; set; } = string.Empty; // The user's display name.

    [Required]                                // Reject the request if this field is missing.
    [MinLength(8)]                            // Enforce a minimum password length for security.
    public string Password { get; set; } = string.Empty; // The chosen password (hashed before storing).
}

// The data the user sends when they LOG IN to an existing account.
public class LoginRequest                     // The login request model.
{
    [Required]                                // Reject the request if this field is missing.
    [EmailAddress]                            // Reject the request if this is not a valid email format.
    public string Email { get; set; } = string.Empty; // The login email.

    [Required]                                // Reject the request if this field is missing.
    public string Password { get; set; } = string.Empty; // The login password.
}

// The data we send BACK to the user after a successful login or registration.
public class AuthResponse                     // The authentication response model.
{
    public string Token { get; set; } = string.Empty; // The signed JWT token the client stores.
    public string FullName { get; set; } = string.Empty; // The user's display name, to greet them.
    public int UserId { get; set; }           // The user's unique id.
}
