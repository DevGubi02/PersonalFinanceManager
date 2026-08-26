// Import database tools and our shared data classes.
using System.Data;                           // CommandType, DbType.
using FinanceTracker.DataModels;             // Budget.
using Microsoft.EntityFrameworkCore;         // Used to get the database connection.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// Interface describing what the budget repository can do.
public interface IBudgetRepository           // The contract for the budget repository.
{
    Task<IEnumerable<Budget>> GetByUserAsync(int userId, CancellationToken ct = default); // List a user's budgets.
    Task<int> CreateAsync(Budget item, CancellationToken ct = default);                   // Add one, return new id.
    Task DeleteAsync(int id, int userId, CancellationToken ct = default);                 // Delete one.
}

// The real implementation calling stored procedures.
public class BudgetRepository : IBudgetRepository // The concrete budget repository.
{
    private readonly ApplicationDbContext _context; // Supplies the database connection.

    public BudgetRepository(ApplicationDbContext context) => _context = context; // Constructor (DI).

    // Read all budgets for one user (calls usp_GetBudgets).
    public async Task<IEnumerable<Budget>> GetByUserAsync(int userId, CancellationToken ct = default) // Read.
    {
        var results = new List<Budget>();                 // The list we will return.
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_GetBudgets";               // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32); // Safe user id parameter.

        using var reader = await command.ExecuteReaderAsync(ct);     // Run the query.
        while (await reader.ReadAsync(ct))       // Loop each row.
        {
            results.Add(new Budget               // Build a Budget from the row.
            {
                Id           = reader.GetInt32(reader.GetOrdinal("Id")),           // Budget id.
                UserId       = reader.GetInt32(reader.GetOrdinal("UserId")),       // Owner id.
                CategoryId   = reader.GetInt32(reader.GetOrdinal("CategoryId")),   // Category id.
                MonthlyLimit = reader.GetDecimal(reader.GetOrdinal("MonthlyLimit")),// Limit amount.
                Month        = reader.GetInt32(reader.GetOrdinal("Month")),        // Month number.
                Year         = reader.GetInt32(reader.GetOrdinal("Year"))          // Year.
            });
        }
        return results;                          // Return the list.
    }

    // Create a budget (calls usp_CreateBudget) and return the new id.
    public async Task<int> CreateAsync(Budget item, CancellationToken ct = default) // Create.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_CreateBudget";             // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@UserId", item.UserId, DbType.Int32);           // Owner id.
        DbHelper.AddParam(command, "@CategoryId", item.CategoryId, DbType.Int32);   // Category id.
        DbHelper.AddParam(command, "@MonthlyLimit", item.MonthlyLimit, DbType.Decimal); // Limit.
        DbHelper.AddParam(command, "@Month", item.Month, DbType.Int32);             // Month.
        DbHelper.AddParam(command, "@Year", item.Year, DbType.Int32);               // Year.

        var result = await command.ExecuteScalarAsync(ct);    // Read the new id.
        return Convert.ToInt32(result);                       // Return it.
    }

    // Delete a budget, only if it belongs to the user (calls usp_DeleteBudget).
    public async Task DeleteAsync(int id, int userId, CancellationToken ct = default) // Delete.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_DeleteBudget";             // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@Id", id, DbType.Int32);         // Which budget.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32); // Owner (security check).

        await command.ExecuteNonQueryAsync(ct);               // Run the delete.
    }
}
