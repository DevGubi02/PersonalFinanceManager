// The namespace groups all our shared data classes together.
using System.ComponentModel.DataAnnotations; // Gives us validation attributes like [Required].

namespace FinanceTracker.DataModels;         // Namespace for our model classes.

// A spending/earning category, e.g. "Food", "Rent", "Salary". Each category belongs to one user.
public class Category                         // The Category model class.
{
    public int Id { get; set; }               // Unique number that identifies this category (auto-generated).
    public int UserId { get; set; }           // The id of the user who owns this category.

    [Required]                                // Reject the request if this field is missing.
    [MaxLength(50)]                            // Keep names short and database-friendly.
    public string Name { get; set; } = string.Empty; // The category name shown in the app.

    [Required]                                // Reject the request if this field is missing.
    public string Type { get; set; } = "Expense"; // "Income" or "Expense".
}
