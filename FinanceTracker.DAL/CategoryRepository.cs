// Import database tools and our shared data classes.
using System.Data;                           // CommandType, DbType.
using FinanceTracker.DataModels;             // Category.
using Microsoft.EntityFrameworkCore;         // Used to get the database connection.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// Interface describing what the category repository can do.
public interface ICategoryRepository         // The contract for the category repository.
{
    Task<IEnumerable<Category>> GetByUserAsync(int userId, CancellationToken ct = default); // List a user's categories.
    Task<int> CreateAsync(Category item, CancellationToken ct = default);                   // Add one, return new id.
    Task DeleteAsync(int id, int userId, CancellationToken ct = default);                   // Delete one.
}

// The real implementation calling stored procedures.
public class CategoryRepository : ICategoryRepository // The concrete category repository.
{
    private readonly ApplicationDbContext _context; // Supplies the database connection.

    public CategoryRepository(ApplicationDbContext context) => _context = context; // Constructor (DI).

    // Read all categories for one user (calls usp_GetCategories).
    public async Task<IEnumerable<Category>> GetByUserAsync(int userId, CancellationToken ct = default) // Read.
    {
        var results = new List<Category>();               // The list we will return.
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open it if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_GetCategories";            // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32); // Safe user id parameter.

        using var reader = await command.ExecuteReaderAsync(ct);     // Run the query.
        while (await reader.ReadAsync(ct))       // Loop each row.
        {
            results.Add(new Category             // Build a Category from the row.
            {
                Id     = reader.GetInt32(reader.GetOrdinal("Id")),    // Category id.
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),// Owner id.
                Name   = reader.GetString(reader.GetOrdinal("Name")), // Category name.
                Type   = reader.GetString(reader.GetOrdinal("Type"))  // Income/Expense.
            });
        }
        return results;                          // Return the list.
    }

    // Create a category (calls usp_CreateCategory) and return the new id.
    public async Task<int> CreateAsync(Category item, CancellationToken ct = default) // Create.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_CreateCategory";           // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@UserId", item.UserId, DbType.Int32); // Owner id.
        DbHelper.AddParam(command, "@Name", item.Name, DbType.String);    // Name.
        DbHelper.AddParam(command, "@Type", item.Type, DbType.String);    // Type.

        var result = await command.ExecuteScalarAsync(ct);    // Read the new id.
        return Convert.ToInt32(result);                       // Return it.
    }

    // Delete a category, only if it belongs to the user (calls usp_DeleteCategory).
    public async Task DeleteAsync(int id, int userId, CancellationToken ct = default) // Delete.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_DeleteCategory";           // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@Id", id, DbType.Int32);         // Which category.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32); // Owner (security check).

        await command.ExecuteNonQueryAsync(ct);               // Run the delete.
    }
}
