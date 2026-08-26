// Import database tools and our shared data classes.
using System.Data;                           // CommandType, DbType.
using FinanceTracker.DataModels;             // DashboardSummary, CategorySummary.
using Microsoft.EntityFrameworkCore;         // Used to get the database connection.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// Interface for the dashboard/report data access.
public interface IDashboardRepository        // The contract for the dashboard repository.
{
    Task<DashboardSummary> GetSummaryAsync(int userId, DateTime start, DateTime end, CancellationToken ct = default); // Summary.
}

// The real implementation calling the summary stored procedure.
public class DashboardRepository : IDashboardRepository // The concrete dashboard repository.
{
    private readonly ApplicationDbContext _context; // Supplies the database connection.

    public DashboardRepository(ApplicationDbContext context) => _context = context; // Constructor (DI).

    // Read the per-category totals and add up income vs expense (calls usp_GetDashboardSummary).
    public async Task<DashboardSummary> GetSummaryAsync(int userId, DateTime start, DateTime end, CancellationToken ct = default) // Summary.
    {
        var summary = new DashboardSummary();             // The result object we will fill in.

        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_GetDashboardSummary";      // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32);        // Whose data.
        DbHelper.AddParam(command, "@StartDate", start, DbType.DateTime2);  // Period start.
        DbHelper.AddParam(command, "@EndDate", end, DbType.DateTime2);      // Period end.

        using var reader = await command.ExecuteReaderAsync(ct); // Run the query.
        while (await reader.ReadAsync(ct))       // Loop over each category row.
        {
            var name  = reader.GetString(reader.GetOrdinal("CategoryName")); // Category name.
            var type  = reader.GetString(reader.GetOrdinal("Type"));         // Income/Expense.
            var total = reader.GetDecimal(reader.GetOrdinal("Total"));       // Sum for that category.

            summary.ByCategory.Add(new CategorySummary { CategoryName = name, Type = type, Total = total }); // Add to breakdown.

            if (string.Equals(type, "Income", StringComparison.OrdinalIgnoreCase)) // If this group is income...
                summary.TotalIncome += total;   // ...add to total income.
            else                                 // Otherwise...
                summary.TotalExpense += total;  // ...add to total expense.
        }

        summary.Balance = summary.TotalIncome - summary.TotalExpense; // Balance = income minus expense.

        return summary;                          // Hand back the finished summary.
    }
}
