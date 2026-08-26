// Import the web framework tools and our layers.
using Microsoft.AspNetCore.Authorization;     // The [Authorize] attribute.
using Microsoft.AspNetCore.Mvc;               // Controller base classes and HTTP attributes.
using FinanceTracker.DAL;                     // ICategoryRepository (data access).
using FinanceTracker.DataModels;              // Category.

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

[ApiController]                                 // Marks this as a Web API controller.
[Route("api/[controller]")]                    // Base URL becomes /api/categories.
[Authorize]                                     // Requires a valid login token.
public class CategoriesController : ControllerBase // The categories controller.
{
    private readonly ICategoryRepository _repository; // Reads/writes categories.

    public CategoriesController(ICategoryRepository repository) => _repository = repository; // Constructor (DI).

    [HttpGet]                                   // Responds to GET /api/categories.
    public async Task<IActionResult> Get(CancellationToken ct) // List this user's categories.
    {
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        var items = await _repository.GetByUserAsync(userId, ct); // Fetch this user's categories.
        return Ok(items);                       // Return them.
    }

    [HttpPost]                                  // Responds to POST /api/categories.
    public async Task<IActionResult> Create([FromBody] Category item, CancellationToken ct) // Add one.
    {
        if (!ModelState.IsValid) return BadRequest(ModelState); // Validate input.
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        item.UserId = userId;                   // Force owner to the logged-in user.
        item.Id = await _repository.CreateAsync(item, ct); // Save and capture the new id.
        return Ok(item);                        // Return the saved category.
    }

    [HttpDelete("{id:int}")]                    // Responds to DELETE /api/categories/{id}.
    public async Task<IActionResult> Delete(int id, CancellationToken ct) // Delete one.
    {
        var userId = this.GetUserId();          // User id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        await _repository.DeleteAsync(id, userId, ct); // Delete only if this user owns it.
        return NoContent();                     // 204 = success.
    }
}
