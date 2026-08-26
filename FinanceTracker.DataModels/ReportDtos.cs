// The namespace groups all our shared data classes together.
namespace FinanceTracker.DataModels;         // Namespace for our model classes.

// One row in the dashboard summary: how much was spent (or earned) in a single category.
public class CategorySummary                  // The per-category summary model.
{
    public string CategoryName { get; set; } = string.Empty; // The name of the category, e.g. "Food".
    public string Type { get; set; } = string.Empty; // Whether this category is "Income" or "Expense".
    public decimal Total { get; set; }        // The total amount of money for this category in the period.
}

// The overall numbers shown at the top of the dashboard.
public class DashboardSummary                 // The dashboard summary model.
{
    public decimal TotalIncome { get; set; }  // The sum of all income in the chosen period.
    public decimal TotalExpense { get; set; } // The sum of all expenses in the chosen period.
    public decimal Balance { get; set; }      // What is left over (income minus expense).
    public List<CategorySummary> ByCategory { get; set; } = new(); // A breakdown per category for charts.
}
