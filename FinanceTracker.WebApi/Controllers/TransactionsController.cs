// Import the web framework tools and our layers.
using Microsoft.AspNetCore.Authorization;     // The [Authorize] attribute that requires login.
using Microsoft.AspNetCore.Mvc;               // Controller base classes and HTTP attributes.
using FinanceTracker.DAL;                     // ITransactionRepository (data access).
using FinanceTracker.DataModels;              // TransactionDto.

namespace FinanceTracker.WebApi.Controllers;  // Namespace for our controllers.

[ApiController]                                 // Marks this as a Web API controller.
[Route("api/[controller]")]                    // Base URL becomes /api/transactions.
[Authorize]                                     // Every action here requires a valid login token.
public class TransactionsController : ControllerBase // The transactions controller.
{
    private readonly ITransactionRepository _repository; // Reads/writes transactions.

    public TransactionsController(ITransactionRepository repository) => _repository = repository; // Constructor (DI).

    [HttpGet]                                   // Responds to GET /api/transactions.
    public async Task<IActionResult> Get(CancellationToken ct) // List the logged-in user's transactions.
    {
        var userId = this.GetUserId();          // Read the user's id from the trusted token.
        if (userId <= 0) return Unauthorized(); // Reject if the token had no valid id.
        var items = await _repository.GetTransactionsByUserAsync(userId, ct); // Fetch only this user's data.
        return Ok(items);                       // Return them as JSON.
    }

    [HttpPost]                                  // Responds to POST /api/transactions.
    public async Task<IActionResult> Create([FromBody] TransactionDto item, CancellationToken ct) // Add one.
    {
        if (!ModelState.IsValid) return BadRequest(ModelState); // Validate the incoming data.
        var userId = this.GetUserId();          // Read the user's id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not properly logged in.
        item.UserId = userId;                   // Force the owner to be the logged-in user (ignore client value).
        item.Id = await _repository.CreateAsync(item, ct); // Save it and capture the new id.
        return Ok(item);                        // Return the saved transaction.
    }

    [HttpPut("{id:int}")]                       // Responds to PUT /api/transactions/{id}.
    public async Task<IActionResult> Update(int id, [FromBody] TransactionDto item, CancellationToken ct) // Update one.
    {
        if (!ModelState.IsValid) return BadRequest(ModelState); // Validate the incoming data.
        var userId = this.GetUserId();          // Read the user's id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        item.Id = id;                           // Use the id from the URL.
        item.UserId = userId;                   // Force the owner to be the logged-in user.
        await _repository.UpdateAsync(item, ct);// The database only updates rows owned by this user.
        return Ok(item);                        // Return the updated transaction.
    }

    [HttpDelete("{id:int}")]                    // Responds to DELETE /api/transactions/{id}.
    public async Task<IActionResult> Delete(int id, CancellationToken ct) // Delete one.
    {
        var userId = this.GetUserId();          // Read the user's id from the token.
        if (userId <= 0) return Unauthorized(); // Reject if not logged in.
        await _repository.DeleteAsync(id, userId, ct); // Delete only if this user owns the row.
        return NoContent();                     // 204 = success, nothing to return.
    }
}
