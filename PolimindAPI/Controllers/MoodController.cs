using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PoliMind.API.Data;
using PoliMind.API.Models;

namespace PoliMind.API.Controllers;

[ApiController]
[Route("mood")]
[Authorize]
public class MoodController : ControllerBase
{
    private readonly DbContext _db;

    public MoodController(DbContext db) => _db = db;

    // GET /mood
    [HttpGet]
    public async Task<IActionResult> GetEntries()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<MoodEntry>(
            "SELECT * FROM polimind.mood_entries WHERE user_id = @UserId ORDER BY logged_at DESC",
            new { UserId = GetUserId() }
        );

        return Ok(rows.Select(ToDto));
    }

    // POST /mood
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMoodRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Mood) || req.Intensity < 1 || req.Intensity > 5)
            return BadRequest(new { error = "mood and intensity (1-5) are required" });

        using var conn = _db.CreateConnection();

        var row = await conn.QueryFirstAsync<MoodEntry>(
            @"INSERT INTO polimind.mood_entries (user_id, mood, intensity, note, activities)
              VALUES (@UserId, @Mood, @Intensity, @Note, @Activities)
              RETURNING *",
            new
            {
                UserId = GetUserId(),
                req.Mood,
                req.Intensity,
                Note = req.Note,
                Activities = string.Join(",", req.Activities),
            }
        );

        return Created("", ToDto(row));
    }

    // DELETE /mood/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();

        var deleted = await conn.QueryFirstOrDefaultAsync(
            "DELETE FROM polimind.mood_entries WHERE id = @Id AND user_id = @UserId RETURNING id",
            new { Id = id, UserId = GetUserId() }
        );

        if (deleted is null) return NotFound(new { error = "Entry not found" });

        return Ok(new { message = "Deleted" });
    }

    // GET /mood/all  (staff only)
    [HttpGet("all")]
    public async Task<IActionResult> GetAll()
    {
        var role = User.FindFirstValue("role");
        if (role == "student") return Forbid();

        using var conn = _db.CreateConnection();

        var rows = await conn.QueryAsync<MoodEntry>(
            @"SELECT me.* FROM polimind.mood_entries me
              JOIN polimind.users u ON u.id = me.user_id
              ORDER BY me.logged_at DESC"
        );

        return Ok(rows.Select(ToDto));
    }

    // ?? Helper ?????????????????????????????????????????????
    private static MoodEntryDto ToDto(MoodEntry e) => new()
    {
        Id = e.Id,
        UserId = e.UserId.ToString(),
        Mood = e.Mood,
        Intensity = e.Intensity,
        Note = e.Note,
        Activities = string.IsNullOrEmpty(e.Activities)
                        ? new List<string>()
                        : e.Activities.Split(',').Where(a => !string.IsNullOrWhiteSpace(a)).ToList(),
        Timestamp = new DateTimeOffset(e.LoggedAt).ToUnixTimeMilliseconds(),
    };

    private int GetUserId()
        => int.Parse(User.FindFirstValue("id") ?? "0");
}