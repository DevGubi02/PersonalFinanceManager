// Import the web framework tools and our layers.
using Microsoft.AspNetCore.Authorization;     // The [Authorize] attribute.
using Microsoft.AspNetCore.Mvc;               // Controller base classes and HTTP attributes.
using FinanceTracker.DAL;                     // IBudgetRepository (data access).
using FinanceTracker.DataModels;              // Budget.

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

[ApiController]                                 // Marks this as a Web API controller.
[Route("api/[controller]")]                    // Base URL becomes /api/budgets.
[Authorize]                                     // Requires a valid login token.
public class BudgetsController : ControllerBase // The budgets controller.
{
    private readonly IBudgetRepository _repository; // Reads/writes budgets.

    public BudgetsController(IBudgetRepository repository) => _repository = repository; // Constructor (DI).

    [HttpGet]                                   // Responds to GET /api/budgets.
    public async Task<IActionResult> Get(CancellationToken ct) // List this user's budgets.
    {
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        var items = await _repository.GetByUserAsync(userId, ct); // Fetch this user's budgets.
        return Ok(items);                       // Return them.
    }

    [HttpPost]                                  // Responds to POST /api/budgets.
    public async Task<IActionResult> Create([FromBody] Budget item, CancellationToken ct) // Add one.
    {
        if (!ModelState.IsValid) return BadRequest(ModelState); // Validate input.
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        item.UserId = userId;                   // Force owner to the logged-in user.
        item.Id = await _repository.CreateAsync(item, ct); // Save and capture the new id.
        return Ok(item);                        // Return the saved budget.
    }

    [HttpDelete("{id:int}")]                    // Responds to DELETE /api/budgets/{id}.
    public async Task<IActionResult> Delete(int id, CancellationToken ct) // Delete one.
    {
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        await _repository.DeleteAsync(id, userId, ct); // Delete only if this user owns it.
        return NoContent();                     // 204 = success.
    }
}
