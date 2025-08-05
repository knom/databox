using Microsoft.EntityFrameworkCore;

namespace Databox.Data;

public static class DatabaseInitializer
{
    public static void EnsureDatabaseCreated(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataboxContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DataboxContext>>();
        
        try
        {
            var connectionString = db.Database.GetConnectionString();
            logger.LogInformation("Initializing database with connection: {ConnectionString}", 
                connectionString?.Replace("Password=", "Password=***"));
            
            // Ensure directory exists for file-based SQLite databases
            if (connectionString?.StartsWith("Data Source=") == true && !connectionString.Contains(":memory:"))
            {
                var dataSourceMatch = System.Text.RegularExpressions.Regex.Match(connectionString, @"Data Source=([^;]+)");
                if (dataSourceMatch.Success)
                {
                    var dbPath = dataSourceMatch.Groups[1].Value;
                    var directory = Path.GetDirectoryName(dbPath);
                    if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                        logger.LogInformation("Created database directory: {Directory}", directory);
                    }
                }
            }
            
            db.Database.EnsureCreated();
            logger.LogInformation("Database schema ensured successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to initialize database");
            throw;
        }
    }
}
