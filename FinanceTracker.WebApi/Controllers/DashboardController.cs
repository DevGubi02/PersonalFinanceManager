// Import the web framework tools and our layers.
using Microsoft.AspNetCore.Authorization;     // The [Authorize] attribute.
using Microsoft.AspNetCore.Mvc;               // Controller base classes and HTTP attributes.
using FinanceTracker.DAL;                     // IDashboardRepository (data access).

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

[ApiController]                                 // Marks this as a Web API controller.
[Route("api/[controller]")]                    // Base URL becomes /api/dashboard.
[Authorize]                                     // Requires a valid login token.
public class DashboardController : ControllerBase // The dashboard controller.
{
    private readonly IDashboardRepository _repository; // Reads summarized report data.

    public DashboardController(IDashboardRepository repository) => _repository = repository; // Constructor (DI).

    [HttpGet("summary")]                        // Responds to GET /api/dashboard/summary.
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? start, [FromQuery] DateTime? end, CancellationToken ct) // Summary.
    {
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.

        // If no start date was given, default to the first day of the current month.
        var startDate = start ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1); // Default start.

        var endDate = end ?? DateTime.UtcNow;   // If no end date was given, default to right now.

        var summary = await _repository.GetSummaryAsync(userId, startDate, endDate, ct); // Build the summary.
        return Ok(summary);                     // Return the summary as JSON.
    }
}
