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
[Route("chat")]
[Authorize]
public class ChatController : ControllerBase
{
	private readonly DbContext _db;
	private readonly IConfiguration _config;
	private readonly HttpClient _http;

	public ChatController(DbContext db, IConfiguration config, IHttpClientFactory httpFactory)
	{
		_db = db;
		_config = config;
		_http = httpFactory.CreateClient();
	}

	// GET /chat
	[HttpGet]
	public async Task<IActionResult> GetHistory()
	{
		using var conn = _db.CreateConnection();

		var rows = await conn.QueryAsync<ChatMessage>(
			"SELECT * FROM polimind.chat_messages WHERE user_id = @UserId ORDER BY sent_at ASC",
			new { UserId = GetUserId() }
		);

		return Ok(rows.Select(r => new ChatMessageDto
		{
			Id = r.Id.ToString(),
			UserId = r.UserId.ToString(),
			Role = r.Role,
			Text = r.Message,
			Timestamp = new DateTimeOffset(r.SentAt).ToUnixTimeMilliseconds(),
		}));
	}

	// POST /chat
	[HttpPost]
	public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest req)
	{
		if (string.IsNullOrWhiteSpace(req.Message))
			return BadRequest(new { error = "Message is required" });

		var userId = GetUserId();
		using var conn = _db.CreateConnection();

		// Save user message
		await conn.ExecuteAsync(
			"INSERT INTO polimind.chat_messages (user_id, role, message) VALUES (@UserId, 'user', @Message)",
			new { UserId = userId, req.Message }
		);

		// Get last 10 messages for context
		var history = await conn.QueryAsync<ChatMessage>(
			"SELECT * FROM polimind.chat_messages WHERE user_id = @UserId ORDER BY sent_at DESC LIMIT 10",
			new { UserId = userId }
		);
		var context = history.Reverse().ToList();

		// Call Gemini REST API
		var botReply = await CallGemini(req.Message, context, req.Language);

		// Save bot reply
		var saved = await conn.QueryFirstAsync<ChatMessage>(
			"INSERT INTO polimind.chat_messages (user_id, role, message) VALUES (@UserId, 'model', @Message) RETURNING *",
			new { UserId = userId, Message = botReply }
		);

		return Ok(new ChatMessageDto
		{
			Id = saved.Id.ToString(),
			UserId = userId.ToString(),
			Role = "model",
			Text = botReply,
			Timestamp = new DateTimeOffset(saved.SentAt).ToUnixTimeMilliseconds(),
		});
	}

	// DELETE /chat
	[HttpDelete]
	public async Task<IActionResult> ClearChat()
	{
		using var conn = _db.CreateConnection();
		await conn.ExecuteAsync(
			"DELETE FROM polimind.chat_messages WHERE user_id = @UserId",
			new { UserId = GetUserId() }
		);
		return Ok(new { message = "Chat cleared" });
	}

	// ── Gemini REST call ───────────────────────────────────
	private async Task<string> CallGemini(string message, List<ChatMessage> history, string language)
	{
		var apiKey = _config["Gemini:ApiKey"] ?? "";
		var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

		var systemPrompt = $@"You are PoliBot, a friendly AI counselor for Politeknik students in Malaysia.
You understand LI (Industrial Training), FYP, Quizzes, PTPTN, and Hostel life.
Be supportive. If extremely depressed, suggest e-Psychology PSA.
Language: {(language == "ms" ? "Malay/Bahasa Melayu" : "English")}.";

		// Build contents array from history + new message
		var contents = new List<object>();
		foreach (var msg in history.Where(m => m.Message != message))
		{
			contents.Add(new
			{
				role = msg.Role == "model" ? "model" : "user",
				parts = new[] { new { text = msg.Message } }
			});
		}
		contents.Add(new
		{
			role = "user",
			parts = new[] { new { text = message } }
		});

		var body = new
		{
			system_instruction = new { parts = new[] { new { text = systemPrompt } } },
			contents
		};

		var json = JsonSerializer.Serialize(body);
		var content = new StringContent(json, Encoding.UTF8, "application/json");
		var response = await _http.PostAsync(url, content);
		var raw = await response.Content.ReadAsStringAsync();

		try
		{
			var doc = JsonDocument.Parse(raw);
			var reply = doc.RootElement
						  .GetProperty("candidates")[0]
						  .GetProperty("content")
						  .GetProperty("parts")[0]
						  .GetProperty("text")
						  .GetString();
			return reply ?? "I'm sorry, I couldn't process that.";
		}
		catch
		{
			return "System busy, please try again.";
		}
	}

	private int GetUserId()
		=> int.Parse(User.FindFirstValue("id") ?? "0");
}