// Import Entity Framework Core.
using Microsoft.EntityFrameworkCore;         // Gives us the DbContext base class.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// The database context. We use it only to get a managed connection to SQL Server;
// the actual data work is done through stored procedures in the repositories.
public class ApplicationDbContext : DbContext // Our EF Core context.
{
    // The constructor receives the configured options (connection string, provider, etc.).
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) // Constructor.
    {
    }

    // No DbSets are declared because we use direct stored-procedure calls instead of EF entities.
}
