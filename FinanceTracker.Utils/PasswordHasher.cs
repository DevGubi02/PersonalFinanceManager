// This namespace groups our reusable helper services (the Utils layer).
namespace FinanceTracker.Utils;              // Namespace for our utility classes.

// A small interface describing what a password hasher can do.
// Using an interface makes the code easy to test and to swap later.
public interface IPasswordHasher             // The contract for a password hasher.
{
    string Hash(string password);            // Turn a plain password into a safe, scrambled hash.
    bool Verify(string password, string hash); // Check a plain password against a stored hash.
}

// The real implementation, powered by the trusted BCrypt library.
public class PasswordHasher : IPasswordHasher // The concrete password hasher.
{
    // Take the user's plain password and return a secure hash (includes a random "salt").
    public string Hash(string password)      // The hashing method.
    {
        return BCrypt.Net.BCrypt.HashPassword(password); // BCrypt adds a salt and slow-hashes it.
    }

    // Compare a plain password the user just typed against the stored hash.
    public bool Verify(string password, string hash) // The verify method.
    {
        return BCrypt.Net.BCrypt.Verify(password, hash); // BCrypt re-hashes and checks for a match.
    }
}
