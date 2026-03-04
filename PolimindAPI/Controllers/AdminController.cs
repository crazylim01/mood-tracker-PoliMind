using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PoliMind.API.Data;
using PoliMind.API.Models;

namespace PoliMind.API.Controllers;

[ApiController]
[Route("admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly DbContext _db;

    public AdminController(DbContext db) => _db = db;

    // GET /admin/overview
    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        if (!IsStaff()) return Forbid();

        using var conn = _db.CreateConnection();

        var moodCounts = await conn.QueryAsync(
            "SELECT mood, COUNT(*) AS count FROM polimind.mood_entries GROUP BY mood"
        );

        var totals = await conn.QueryFirstAsync(
            @"SELECT
                COUNT(DISTINCT user_id) AS active_students,
                COUNT(*)                AS total_logs,
                AVG(intensity)          AS avg_intensity
              FROM polimind.mood_entries"
        );

        return Ok(new AdminOverviewDto
        {
            MoodCounts = moodCounts.Select(r => new MoodCountDto
            {
                Mood = (string)r.mood,
                Count = (int)(long)r.count,
            }).ToList(),
            ActiveStudents = (int)(long)totals.active_students,
            TotalLogs = (int)(long)totals.total_logs,
            AvgIntensity = ((double?)totals.avg_intensity ?? 0).ToString("F1"),
        });
    }

    // GET /admin/students
    [HttpGet("students")]
    public async Task<IActionResult> Students()
    {
        if (!IsStaff()) return Forbid();

        using var conn = _db.CreateConnection();

        var rows = await conn.QueryAsync(
            @"SELECT
                u.id, u.username, u.full_name,
                COUNT(me.id)    AS total_logs,
                AVG(me.intensity) AS avg_intensity,
                MAX(me.logged_at) AS last_active
              FROM polimind.users u
              LEFT JOIN polimind.mood_entries me ON me.user_id = u.id
              WHERE u.role = 'student' AND u.is_active = TRUE
              GROUP BY u.id
              ORDER BY last_active DESC NULLS LAST"
        );

        return Ok(rows.Select(r => new StudentStatDto
        {
            Id = (int)r.id,
            Username = (string)r.username,
            FullName = (string)r.full_name,
            TotalLogs = (int)(long)r.total_logs,
            AvgIntensity = (double)(r.avg_intensity ?? 0),
            LastActive = (DateTime?)r.last_active,
        }));
    }

    // GET /admin/students/{id}/logs
    [HttpGet("students/{id}/logs")]
    public async Task<IActionResult> StudentLogs(int id)
    {
        if (!IsStaff()) return Forbid();

        using var conn = _db.CreateConnection();

        var rows = await conn.QueryAsync<MoodEntry>(
            "SELECT * FROM polimind.mood_entries WHERE user_id = @UserId ORDER BY logged_at DESC",
            new { UserId = id }
        );

        return Ok(rows.Select(e => new MoodEntryDto
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
        }));
    }

    // GET /admin/staff
    [HttpGet("staff")]
    public async Task<IActionResult> Staff()
    {
        if (!IsStaff()) return Forbid();

        using var conn = _db.CreateConnection();

        var rows = await conn.QueryAsync(
            "SELECT id, username, full_name, role, created_at FROM polimind.users WHERE role != 'student' ORDER BY role, full_name"
        );

        return Ok(rows);
    }

    private bool IsStaff()
        => User.FindFirstValue("role") != "student";
}