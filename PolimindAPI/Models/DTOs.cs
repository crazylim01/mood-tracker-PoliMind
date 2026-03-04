namespace PoliMind.API.Models;

// ── Auth DTOs ─────────────────────────────────────────────
public class LoginRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RegisterRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FullName { get; set; } = "";
}

public class LoginResponse
{
    public string Token { get; set; } = "";
    public UserDto User { get; set; } = new();
    public SettingsDto Settings { get; set; } = new();
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "";
    public string Campus { get; set; } = "";
}

public class SettingsDto
{
    public string Name { get; set; } = "";
    public string Language { get; set; } = "en";
    public string Status { get; set; } = "available";
    public string Campus { get; set; } = "";
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}

public class UpdateSettingsRequest
{
    public string? DisplayName { get; set; }
    public string? Language { get; set; }
    public string? Status { get; set; }
}

// ── Mood DTOs ─────────────────────────────────────────────
public class CreateMoodRequest
{
    public string Mood { get; set; } = "";
    public int Intensity { get; set; }
    public string? Note { get; set; }
    public List<string> Activities { get; set; } = new();
}

public class MoodEntryDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Mood { get; set; } = "";
    public int Intensity { get; set; }
    public string? Note { get; set; }
    public List<string> Activities { get; set; } = new();
    public long Timestamp { get; set; }   // Unix ms for frontend
}

// ── Journal DTOs ──────────────────────────────────────────
public class CreateJournalRequest
{
    public string Content { get; set; } = "";
    public string Status { get; set; } = "available";
    public List<string> Images { get; set; } = new();  // base64 strings
}

public class UpdateJournalRequest
{
    public string? Content { get; set; }
    public string? Status { get; set; }
    public List<string>? Images { get; set; }
}

public class JournalEntryDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Content { get; set; } = "";
    public string Status { get; set; } = "";
    public List<string> Images { get; set; } = new();
    public long Timestamp { get; set; }
}

// ── Chat DTOs ─────────────────────────────────────────────
public class SendMessageRequest
{
    public string Message { get; set; } = "";
    public string Language { get; set; } = "en";
}

public class ChatMessageDto
{
    public string Id { get; set; } = "";
    public string UserId { get; set; } = "";
    public string Role { get; set; } = "";
    public string Text { get; set; } = "";
    public long Timestamp { get; set; }
}

// ── Insights DTOs ─────────────────────────────────────────
public class InsightsDto
{
    public string Summary { get; set; } = "";
    public List<string> Recommendations { get; set; } = new();
    public string SuggestedAction { get; set; } = "";
}

// ── Admin DTOs ────────────────────────────────────────────
public class StudentStatDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string FullName { get; set; } = "";
    public int TotalLogs { get; set; }
    public double AvgIntensity { get; set; }
    public DateTime? LastActive { get; set; }
}

public class AdminOverviewDto
{
    public List<MoodCountDto> MoodCounts { get; set; } = new();
    public int ActiveStudents { get; set; }
    public int TotalLogs { get; set; }
    public string AvgIntensity { get; set; } = "0";
}

public class MoodCountDto
{
    public string Mood { get; set; } = "";
    public int Count { get; set; }
}