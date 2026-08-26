// Import the tools we need to talk to the database using ADO.NET.
using System.Data;                           // CommandType, ConnectionState, DbType.
using FinanceTracker.DataModels;             // Our shared data classes (User).
using Microsoft.EntityFrameworkCore;         // We use the DbContext only to get a connection.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// Interface describing what the user repository can do (create + find users).
public interface IUserRepository             // The contract for the user repository.
{
    Task<int> CreateUserAsync(string email, string fullName, string passwordHash, CancellationToken ct = default); // Create.
    Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default); // Find by email.
}

// The real implementation that calls our stored procedures.
public class UserRepository : IUserRepository // The concrete user repository.
{
    private readonly ApplicationDbContext _context; // Supplies the database connection.

    public UserRepository(ApplicationDbContext context) => _context = context; // Constructor (dependency injection).

    // Create a new user by calling the usp_CreateUser stored procedure.
    public async Task<int> CreateUserAsync(string email, string fullName, string passwordHash, CancellationToken ct = default) // Create.
    {
        var connection = _context.Database.GetDbConnection(); // Get the underlying database connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open it if needed.

        using var command = connection.CreateCommand();       // Create a command to run the procedure.
        command.CommandText = "usp_CreateUser";               // The stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure, not raw SQL.

        DbHelper.AddParam(command, "@Email", email, DbType.String);        // Add the @Email parameter.
        DbHelper.AddParam(command, "@FullName", fullName, DbType.String);  // Add the @FullName parameter.
        DbHelper.AddParam(command, "@PasswordHash", passwordHash, DbType.String); // Add the pre-hashed password.

        var result = await command.ExecuteScalarAsync(ct);    // Run it and read the new user's id.
        return Convert.ToInt32(result);                       // Return the id as an int.
    }

    // Find a user by email by calling the usp_GetUserByEmail stored procedure.
    public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default) // Find by email.
    {
        var connection = _context.Database.GetDbConnection(); // Get the database connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open it if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_GetUserByEmail";           // The stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@Email", email, DbType.String); // Pass the email safely.

        using var reader = await command.ExecuteReaderAsync(ct); // Run the query and read rows.

        if (await reader.ReadAsync(ct))          // If there is at least one row...
        {
            return new User                      // ...build a User object from it.
            {
                Id           = reader.GetInt32(reader.GetOrdinal("Id")),           // Read the Id.
                Email        = reader.GetString(reader.GetOrdinal("Email")),       // Read the Email.
                FullName     = reader.GetString(reader.GetOrdinal("FullName")),    // Read the FullName.
                PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")) // Read the stored hash.
            };
        }

        return null;                             // No matching user found, so return null.
    }
}
