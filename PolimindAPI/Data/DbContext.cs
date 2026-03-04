using Npgsql;

namespace PoliMind.API.Data;

public class DbContext
{
    private readonly string _connectionString;

    public DbContext(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new Exception("Connection string not found");
    }

    public NpgsqlConnection CreateConnection()
        => new NpgsqlConnection(_connectionString);
}