// Import the database tools and our shared data classes.
using System.Data;                           // CommandType, DbType.
using FinanceTracker.DataModels;             // TransactionDto.
using Microsoft.EntityFrameworkCore;         // Used only to obtain the database connection.

namespace FinanceTracker.DAL;                // Namespace for the data-access layer.

// Interface describing everything the transaction repository can do (full create/read/update/delete).
public interface ITransactionRepository      // The contract for the transaction repository.
{
    Task<IEnumerable<TransactionDto>> GetTransactionsByUserAsync(int userId, CancellationToken ct = default); // Read all.
    Task<int> CreateAsync(TransactionDto item, CancellationToken ct = default); // Create one, return new id.
    Task UpdateAsync(TransactionDto item, CancellationToken ct = default);      // Update one.
    Task DeleteAsync(int id, int userId, CancellationToken ct = default);       // Delete one.
}

// The real transaction repository. Every method calls a stored procedure with safe parameters.
public class TransactionRepository : ITransactionRepository // The concrete transaction repository.
{
    private readonly ApplicationDbContext _context; // Supplies the database connection.

    public TransactionRepository(ApplicationDbContext context) => _context = context; // Constructor (DI).

    // Read all transactions for one user (calls usp_GetTransactions).
    public async Task<IEnumerable<TransactionDto>> GetTransactionsByUserAsync(int userId, CancellationToken ct = default) // Read.
    {
        var results = new List<TransactionDto>();          // The list we will fill and return.

        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open it if needed.

        using var command = connection.CreateCommand();       // Create the command.
        command.CommandText = "usp_GetTransactions";          // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32); // Pass the user id safely.

        using var reader = await command.ExecuteReaderAsync(ct); // Run the query.
        while (await reader.ReadAsync(ct))       // Loop over each row.
        {
            results.Add(new TransactionDto       // Build a TransactionDto from the current row.
            {
                Id           = reader.GetInt32(reader.GetOrdinal("Id")),          // Transaction id.
                UserId       = reader.GetInt32(reader.GetOrdinal("UserId")),      // Owner id.
                CategoryId   = reader.GetInt32(reader.GetOrdinal("CategoryId")),  // Category id.
                Amount       = reader.GetDecimal(reader.GetOrdinal("Amount")),    // Money amount.
                Type         = reader.GetString(reader.GetOrdinal("Type")),       // Income/Expense.
                Description  = reader.IsDBNull(reader.GetOrdinal("Description"))   // The note may be null...
                                   ? null                                          // ...use null if it is,
                                   : reader.GetString(reader.GetOrdinal("Description")), // otherwise read it.
                Date         = reader.GetDateTime(reader.GetOrdinal("Date")),     // When it happened.
                CategoryName = reader.IsDBNull(reader.GetOrdinal("CategoryName")) // The name may be null...
                                   ? null                                          // ...use null if it is,
                                   : reader.GetString(reader.GetOrdinal("CategoryName")) // otherwise read it.
            });
        }

        return results;                          // Hand back all the transactions.
    }

    // Create a new transaction (calls usp_CreateTransaction) and return its new id.
    public async Task<int> CreateAsync(TransactionDto item, CancellationToken ct = default) // Create.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_CreateTransaction";        // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@UserId", item.UserId, DbType.Int32);         // The owner id.
        DbHelper.AddParam(command, "@CategoryId", item.CategoryId, DbType.Int32); // The category id.
        DbHelper.AddParam(command, "@Amount", item.Amount, DbType.Decimal);       // The money amount.
        DbHelper.AddParam(command, "@Type", item.Type, DbType.String);            // Income or Expense.
        DbHelper.AddParam(command, "@Description", item.Description, DbType.String); // The optional note.
        DbHelper.AddParam(command, "@Date", item.Date, DbType.DateTime2);         // The date it happened.

        var result = await command.ExecuteScalarAsync(ct);    // Read the new id.
        return Convert.ToInt32(result);                       // Return it as an int.
    }

    // Update an existing transaction (calls usp_UpdateTransaction).
    public async Task UpdateAsync(TransactionDto item, CancellationToken ct = default) // Update.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_UpdateTransaction";        // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@Id", item.Id, DbType.Int32);                 // Which transaction.
        DbHelper.AddParam(command, "@UserId", item.UserId, DbType.Int32);         // The owner (security check).
        DbHelper.AddParam(command, "@CategoryId", item.CategoryId, DbType.Int32); // New category.
        DbHelper.AddParam(command, "@Amount", item.Amount, DbType.Decimal);       // New amount.
        DbHelper.AddParam(command, "@Type", item.Type, DbType.String);            // New type.
        DbHelper.AddParam(command, "@Description", item.Description, DbType.String); // New note.
        DbHelper.AddParam(command, "@Date", item.Date, DbType.DateTime2);         // New date.

        await command.ExecuteNonQueryAsync(ct);               // Run it (no rows returned).
    }

    // Delete a transaction by id, only if it belongs to the given user (calls usp_DeleteTransaction).
    public async Task DeleteAsync(int id, int userId, CancellationToken ct = default) // Delete.
    {
        var connection = _context.Database.GetDbConnection(); // Get the connection.
        await DbHelper.EnsureOpenAsync(connection, ct);       // Open if needed.

        using var command = connection.CreateCommand();       // Build the command.
        command.CommandText = "usp_DeleteTransaction";        // Stored procedure name.
        command.CommandType = CommandType.StoredProcedure;    // It is a procedure.

        DbHelper.AddParam(command, "@Id", id, DbType.Int32);          // Which transaction to delete.
        DbHelper.AddParam(command, "@UserId", userId, DbType.Int32);  // The owner (security check).

        await command.ExecuteNonQueryAsync(ct);               // Run the delete.
    }
}
