// The namespace groups all our shared data classes. Note it now uses the DataModels project name.
namespace FinanceTracker.DataModels;           // Namespace for our model classes.

// This class represents one user account as it is stored in the database.
// We keep the password as a HASH (scrambled), never as plain text, for security.
public class User                              // The User model class.
{
    public int Id { get; set; }                // Unique number that identifies this user (auto-generated).
    public string Email { get; set; } = string.Empty; // The email the user logs in with (must be unique).
    public string FullName { get; set; } = string.Empty; // The user's display name shown in the app.
    public string PasswordHash { get; set; } = string.Empty; // The scrambled (hashed) password; never plain text.
    public DateTime CreatedAt { get; set; }    // When this account was created (useful for records).
}
