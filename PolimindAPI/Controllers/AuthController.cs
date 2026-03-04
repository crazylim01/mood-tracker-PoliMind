using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using PoliMind.API.Data;
using PoliMind.API.Models;

namespace PoliMind.API.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly DbContext _db;
    private readonly IConfiguration _config;

    public AuthController(DbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // POST /auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { error = "Username and password required" });

        using var conn = _db.CreateConnection();

        var user = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM polimind.users WHERE UPPER(username) = UPPER(@Username) AND is_active = TRUE",
            new { req.Username }
        );

        if (user is null)
            return Unauthorized(new { error = "User not found" });

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
            return Unauthorized(new { error = "Incorrect password" });

        var settings = await conn.QueryFirstOrDefaultAsync<UserSettings>(
            "SELECT * FROM polimind.user_settings WHERE user_id = @Id",
            new { user.Id }
        );

        var token = GenerateToken(user);

        return Ok(new LoginResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role,
                Campus = user.Campus,
            },
            Settings = new SettingsDto
            {
                Name = settings?.DisplayName ?? user.FullName,
                Language = settings?.Language ?? "en",
                Status = settings?.Status ?? "available",
                Campus = user.Campus,
            }
        });
    }

    // POST /auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) ||
            string.IsNullOrWhiteSpace(req.Password) ||
            string.IsNullOrWhiteSpace(req.FullName))
            return BadRequest(new { error = "All fields required" });

        var normalized = req.Username.ToUpper().Trim();

        if (!normalized.StartsWith("08") || normalized.Length != 12)
            return BadRequest(new { error = "Invalid student matrix number format" });

        using var conn = _db.CreateConnection();

        var existing = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT id FROM polimind.users WHERE UPPER(username) = @Username",
            new { Username = normalized }
        );

        if (existing is not null)
            return Conflict(new { error = "Student already registered" });

        var hashed = BCrypt.Net.BCrypt.HashPassword(req.Password, 12);

        var newUser = await conn.QueryFirstAsync<User>(
            @"INSERT INTO polimind.users (username, password, full_name, role)
              VALUES (@Username, @Password, @FullName, 'student')
              RETURNING *",
            new { Username = normalized, Password = hashed, FullName = req.FullName.Trim() }
        );

        await conn.ExecuteAsync(
            @"INSERT INTO polimind.user_settings (user_id, display_name, language, status)
              VALUES (@UserId, @DisplayName, 'en', 'available')",
            new { UserId = newUser.Id, DisplayName = req.FullName.Trim() }
        );

        return Created("", new { message = "Registered successfully. Please log in." });
    }

    // GET /auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = GetUserId();
        using var conn = _db.CreateConnection();

        var row = await conn.QueryFirstOrDefaultAsync(
            @"SELECT u.*, s.display_name, s.language, s.status
              FROM polimind.users u
              LEFT JOIN polimind.user_settings s ON s.user_id = u.id
              WHERE u.id = @UserId",
            new { UserId = userId }
        );

        if (row is null) return NotFound(new { error = "User not found" });

        return Ok(new
        {
            user = new UserDto
            {
                Id = (int)row.id,
                Username = (string)row.username,
                FullName = (string)row.full_name,
                Role = (string)row.role,
                Campus = (string)row.campus,
            },
            settings = new SettingsDto
            {
                Name = (string?)row.display_name ?? (string)row.full_name,
                Language = (string?)row.language ?? "en",
                Status = (string?)row.status ?? "available",
                Campus = (string)row.campus,
            }
        });
    }

    // PATCH /auth/password
    [HttpPatch("password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = GetUserId();
        using var conn = _db.CreateConnection();

        var user = await conn.QueryFirstAsync<User>(
            "SELECT password FROM polimind.users WHERE id = @UserId",
            new { UserId = userId }
        );

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.Password))
            return Unauthorized(new { error = "Current password is incorrect" });

        var hashed = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, 12);
        await conn.ExecuteAsync(
            "UPDATE polimind.users SET password = @Password WHERE id = @UserId",
            new { Password = hashed, UserId = userId }
        );

        return Ok(new { message = "Password updated successfully" });
    }

    // PATCH /auth/settings
    [HttpPatch("settings")]
    [Authorize]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest req)
    {
        var userId = GetUserId();
        using var conn = _db.CreateConnection();

        await conn.ExecuteAsync(
            @"UPDATE polimind.user_settings
              SET display_name = COALESCE(@DisplayName, display_name),
                  language     = COALESCE(@Language,    language),
                  status       = COALESCE(@Status,      status),
                  updated_at   = NOW()
              WHERE user_id = @UserId",
            new { req.DisplayName, req.Language, req.Status, UserId = userId }
        );

        return Ok(new { message = "Settings updated" });
    }

    // ── Helpers ───────────────────────────────────────────
    private string GenerateToken(User user)
    {
        var secret = _config["Jwt:Key"] ?? "secret";
        var expires = int.Parse(_config["Jwt:ExpiresInDays"] ?? "7");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("id",       user.Id.ToString()),
            new Claim("username", user.Username),
            new Claim("role",     user.Role),
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expires),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int GetUserId()
        => int.Parse(User.FindFirstValue("id") ?? "0");
}