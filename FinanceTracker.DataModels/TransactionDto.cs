// The namespace groups all our shared data classes together.
using System.ComponentModel.DataAnnotations; // Gives us validation attributes like [Required] and [Range].

namespace FinanceTracker.DataModels;         // Namespace for our model classes.

// Represents one money movement: either income (money in) or an expense (money out).
public class TransactionDto                   // The Transaction model class.
{
    public int Id { get; set; }               // Unique number that identifies this transaction (auto-generated).
    public int UserId { get; set; }           // The id of the user who owns this transaction.
    public int CategoryId { get; set; }       // The category this transaction belongs to (links to Category.Id).

    [Range(0.01, double.MaxValue)]            // Reject zero or negative amounts.
    public decimal Amount { get; set; }       // The amount of money for this transaction.

    [Required]                                // Reject the request if this field is missing.
    public string Type { get; set; } = "Expense"; // "Income" or "Expense".

    [MaxLength(250)]                          // Limit the note length to protect the database.
    public string? Description { get; set; }  // A short note describing the transaction.

    public DateTime Date { get; set; }        // The date the transaction happened.

    public string? CategoryName { get; set; } // The category name, filled in when we read from the database.
}
