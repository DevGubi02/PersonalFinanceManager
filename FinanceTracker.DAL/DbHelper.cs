// Import the database tools we reuse across all repositories.
using System.Data;                           // CommandType, ConnectionState, DbType.
using System.Data.Common;                    // DbCommand, DbConnection base types.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// A small collection of shared helper methods so every repository writes less repetitive code.
public static class DbHelper                 // Static helper class (no instance needed).
{
    // Add a named, typed parameter to a command. Parameters keep us safe from SQL injection.
    public static void AddParam(DbCommand command, string name, object? value, DbType type) // Add-parameter helper.
    {
        var p = command.CreateParameter();   // Create a fresh parameter object.
        p.ParameterName = name;              // Give it a name like "@UserId".
        p.Value = value ?? DBNull.Value;     // Use the value, or database NULL if it is null.
        p.DbType = type;                     // Tell the database what kind of data this is.
        command.Parameters.Add(p);           // Attach the parameter to the command.
    }

    // Make sure a connection is open before we use it (opens it only if needed).
    public static async Task EnsureOpenAsync(DbConnection connection, CancellationToken ct) // Ensure-open helper.
    {
        if (connection.State != ConnectionState.Open) // Only open if it is not already open.
            await connection.OpenAsync(ct);           // Open the connection to the database.
    }
}
