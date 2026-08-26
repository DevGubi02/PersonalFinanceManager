// The namespace groups all our shared data classes together.
using System.ComponentModel.DataAnnotations; // Gives us validation attributes like [Required] and [Range].

namespace FinanceTracker.DataModels;         // Namespace for our model classes.

// A monthly spending limit the user sets for a category, e.g. "Food: max 5000 per month".
public class Budget                           // The Budget model class.
{
    public int Id { get; set; }               // Unique number that identifies this budget (auto-generated).
    public int UserId { get; set; }           // The id of the user who owns this budget.

    [Required]                                // Reject the request if this field is missing.
    public int CategoryId { get; set; }       // The category this budget applies to (links to Category.Id).

    [Range(0, double.MaxValue)]               // Reject negative budget amounts.
    public decimal MonthlyLimit { get; set; } // The maximum amount the user plans to spend.

    [Range(1, 12)]                            // Only allow valid month numbers.
    public int Month { get; set; }            // The month this budget is for (1-12).

    [Range(2000, 2100)]                       // Only allow a sensible year range.
    public int Year { get; set; }             // The year this budget is for (e.g. 2026).
}
