using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using PoliMind.API.Data;
using PoliMind.API.Models;

namespace PoliMind.API.Controllers;

[ApiController]
[Route("insights")]
[Authorize]
public class InsightsController : ControllerBase
{
    private readonly DbContext _db;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public InsightsController(DbContext db, IConfiguration config, IHttpClientFactory httpFactory)
    {
        _db = db;
        _config = config;
        _http = httpFactory.CreateClient();
    }

    // GET /insights
    [HttpGet]
    public async Task<IActionResult> GetInsights()
    {
        var userId = GetUserId();
        using var conn = _db.CreateConnection();

        // Return cached insight if still valid
        var cached = await conn.QueryFirstOrDefaultAsync<AiInsightsCache>(
            @"SELECT * FROM polimind.ai_insights_cache
              WHERE user_id = @UserId AND expires_at > NOW()
              ORDER BY generated_at DESC LIMIT 1",
            new { UserId = userId }
        );

        if (cached is not null)
        {
            return Ok(new InsightsDto
            {
                Summary = cached.Summary,
                Recommendations = JsonSerializer.Deserialize<List<string>>(cached.Recommendations) ?? new(),
                SuggestedAction = cached.SuggestedAction ?? "",
            });
        }

        // Fetch recent mood entries
        var entries = await conn.QueryAsync<MoodEntry>(
            "SELECT * FROM polimind.mood_entries WHERE user_id = @UserId ORDER BY logged_at DESC LIMIT 15",
            new { UserId = userId }
        );

        if (!entries.Any()) return NoContent();

        // Get user info
        var user = await conn.QueryFirstAsync(
            @"SELECT u.full_name, u.campus, s.language
              FROM polimind.users u
              LEFT JOIN polimind.user_settings s ON s.user_id = u.id
              WHERE u.id = @UserId",
            new { UserId = userId }
        );

        var moodHistory = entries.Select(e => new
        {
            mood = e.Mood,
            activities = e.Activities,
            note = e.Note,
            date = e.LoggedAt.ToShortDateString(),
        });

        var language = (string?)user.language ?? "en";
        var result = await CallGeminiInsights(moodHistory, (string)user.full_name, (string)user.campus, language);

        if (result is null) return StatusCode(500, new { error = "AI generation failed" });

        // Cache the result
        await conn.ExecuteAsync(
            @"INSERT INTO polimind.ai_insights_cache (user_id, summary, recommendations, suggested_action)
              VALUES (@UserId, @Summary, @Recommendations, @SuggestedAction)",
            new
            {
                UserId = userId,
                result.Summary,
                Recommendations = JsonSerializer.Serialize(result.Recommendations),
                SuggestedAction = result.SuggestedAction,
            }
        );

        return Ok(result);
    }

    // DELETE /insights/cache
    [HttpDelete("cache")]
    public async Task<IActionResult> ClearCache()
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM polimind.ai_insights_cache WHERE user_id = @UserId",
            new { UserId = GetUserId() }
        );
        return Ok(new { message = "Cache cleared" });
    }

    // ── Gemini call ────────────────────────────────────────
    private async Task<InsightsDto?> CallGeminiInsights(object moodHistory, string name, string campus, string language)
    {
        var apiKey = _config["Gemini:ApiKey"] ?? "";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

        var prompt = $@"Analyze the mental wellness patterns for a student at {campus}.
Student Name: {name}
Language: {language}
History: {JsonSerializer.Serialize(moodHistory)}
Task: Provide an empathetic analysis with 3 specific recommendations for a Malaysian Politeknik student (e.g., PTPTN, LI, FYP stress).
Return ONLY valid JSON with fields: summary (string), recommendations (array of 3 strings), suggestedAction (string).
Language for response: {(language == "ms" ? "Malay/Bahasa Melayu" : "English")}.";

        var body = new
        {
            contents = new[] { new { role = "user", parts = new[] { new { text = prompt } } } },
            generationConfig = new { responseMimeType = "application/json" }
        };

        var json = JsonSerializer.Serialize(body);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(url, content);
        var raw = await response.Content.ReadAsStringAsync();

        try
        {
            var doc = JsonDocument.Parse(raw);
            var text = doc.RootElement
                         .GetProperty("candidates")[0]
                         .GetProperty("content")
                         .GetProperty("parts")[0]
                         .GetProperty("text")
                         .GetString() ?? "{}";

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<InsightsDto>(text, options);
        }
        catch
        {
            return null;
        }
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue("id") ?? "0");
}