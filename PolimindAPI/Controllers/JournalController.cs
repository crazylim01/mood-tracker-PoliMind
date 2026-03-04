using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PoliMind.API.Data;
using PoliMind.API.Models;

namespace PoliMind.API.Controllers;

[ApiController]
[Route("journal")]
[Authorize]
public class JournalController : ControllerBase
{
    private readonly DbContext _db;

    public JournalController(DbContext db) => _db = db;

    // GET /journal
    [HttpGet]
    public async Task<IActionResult> GetEntries()
    {
        using var conn = _db.CreateConnection();

        var entries = await conn.QueryAsync<JournalEntry>(
            "SELECT * FROM polimind.journal_entries WHERE user_id = @UserId ORDER BY logged_at DESC",
            new { UserId = GetUserId() }
        );

        // Attach images to each entry
        var result = new List<JournalEntryDto>();
        foreach (var entry in entries)
        {
            var images = await conn.QueryAsync<string>(
                "SELECT image_data FROM polimind.journal_images WHERE journal_id = @Id ORDER BY sort_order ASC",
                new { entry.Id }
            );

            result.Add(new JournalEntryDto
            {
                Id = entry.Id,
                UserId = entry.UserId.ToString(),
                Content = entry.Content,
                Status = entry.Status,
                Images = images.ToList(),
                Timestamp = new DateTimeOffset(entry.LoggedAt).ToUnixTimeMilliseconds(),
            });
        }

        return Ok(result);
    }

    // POST /journal
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJournalRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { error = "Content is required" });

        using var conn = _db.CreateConnection();

        var entry = await conn.QueryFirstAsync<JournalEntry>(
            @"INSERT INTO polimind.journal_entries (user_id, content, status)
              VALUES (@UserId, @Content, @Status)
              RETURNING *",
            new { UserId = GetUserId(), req.Content, req.Status }
        );

        // Save images
        for (int i = 0; i < req.Images.Count; i++)
        {
            await conn.ExecuteAsync(
                @"INSERT INTO polimind.journal_images (journal_id, image_data, sort_order)
                  VALUES (@JournalId, @ImageData, @SortOrder)",
                new { JournalId = entry.Id, ImageData = req.Images[i], SortOrder = i }
            );
        }

        return Created("", new JournalEntryDto
        {
            Id = entry.Id,
            UserId = entry.UserId.ToString(),
            Content = entry.Content,
            Status = entry.Status,
            Images = req.Images,
            Timestamp = new DateTimeOffset(entry.LoggedAt).ToUnixTimeMilliseconds(),
        });
    }

    // PATCH /journal/{id}
    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJournalRequest req)
    {
        using var conn = _db.CreateConnection();

        var updated = await conn.QueryFirstOrDefaultAsync<JournalEntry>(
            @"UPDATE polimind.journal_entries
              SET content    = COALESCE(@Content, content),
                  status     = COALESCE(@Status,  status),
                  updated_at = NOW()
              WHERE id = @Id AND user_id = @UserId
              RETURNING *",
            new { req.Content, req.Status, Id = id, UserId = GetUserId() }
        );

        if (updated is null) return NotFound(new { error = "Entry not found" });

        // Replace images if provided
        if (req.Images is not null)
        {
            await conn.ExecuteAsync(
                "DELETE FROM polimind.journal_images WHERE journal_id = @Id",
                new { Id = id }
            );
            for (int i = 0; i < req.Images.Count; i++)
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO polimind.journal_images (journal_id, image_data, sort_order)
                      VALUES (@JournalId, @ImageData, @SortOrder)",
                    new { JournalId = id, ImageData = req.Images[i], SortOrder = i }
                );
            }
        }

        return Ok(new { message = "Updated", id });
    }

    // DELETE /journal/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();

        var deleted = await conn.QueryFirstOrDefaultAsync(
            "DELETE FROM polimind.journal_entries WHERE id = @Id AND user_id = @UserId RETURNING id",
            new { Id = id, UserId = GetUserId() }
        );

        if (deleted is null) return NotFound(new { error = "Entry not found" });

        return Ok(new { message = "Deleted" });
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue("id") ?? "0");
}