namespace PoliMind.API.Models;

// ── Users ────────────────────────────────────────────────
public class User
{
	public int Id { get; set; }
	public string Username { get; set; } = "";
	public string Password { get; set; } = "";
	public string FullName { get; set; } = "";
	public string Role { get; set; } = "student";
	public string Campus { get; set; } = "Politeknik Sultan Salahuddin Abdul Aziz Shah";
	public bool IsActive { get; set; } = true;
	public DateTime CreatedAt { get; set; }
}

public class UserSettings
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string? DisplayName { get; set; }
	public string Language { get; set; } = "en";
	public string Status { get; set; } = "available";
	public DateTime UpdatedAt { get; set; }
}

// ── Mood ─────────────────────────────────────────────────
public class MoodEntry
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string Mood { get; set; } = "";
	public int Intensity { get; set; }
	public string? Note { get; set; }
	public string Activities { get; set; } = "";  // comma-separated in DB
	public DateTime LoggedAt { get; set; }
}

// ── Journal ───────────────────────────────────────────────
public class JournalEntry
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string Content { get; set; } = "";
	public string Status { get; set; } = "available";
	public DateTime LoggedAt { get; set; }
	public DateTime UpdatedAt { get; set; }
}

public class JournalImage
{
	public int Id { get; set; }
	public int JournalId { get; set; }
	public string ImageData { get; set; } = "";   // base64
	public int SortOrder { get; set; }
	public DateTime CreatedAt { get; set; }
}

// ── Chat ─────────────────────────────────────────────────
public class ChatMessage
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string Role { get; set; } = "";   // user / model
	public string Message { get; set; } = "";
	public DateTime SentAt { get; set; }
}

// ── AI Insights ───────────────────────────────────────────
public class AiInsightsCache
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string Summary { get; set; } = "";
	public string Recommendations { get; set; } = "[]";  // JSON array string
	public string? SuggestedAction { get; set; }
	public DateTime GeneratedAt { get; set; }
	public DateTime ExpiresAt { get; set; }
}

// ── Sessions ─────────────────────────────────────────────
public class Session
{
	public int Id { get; set; }
	public int UserId { get; set; }
	public string RefreshToken { get; set; } = "";
	public DateTime CreatedAt { get; set; }
	public DateTime ExpiresAt { get; set; }
	public bool Revoked { get; set; }
}