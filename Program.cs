using Databox;
using Databox.Data;
using Databox.Jobs;
using Databox.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Quartz;

namespace Databox;

public class Program
{
    public static void Main(string[] args)
    {
        var dataPath = Path.Combine(AppContext.BaseDirectory, "data", "databox.sqlite");
        var keysPath = Path.Combine(AppContext.BaseDirectory, "keys");

        var builder = WebApplication.CreateBuilder(args);

        // Configure logging
        builder.Logging.ClearProviders();
        builder.Logging.AddConsole();

        if (builder.Environment.IsDevelopment())
            builder.Logging.AddDebug();

        string dbProvider = builder.Configuration["DatabaseProvider"] ?? "sqlite";
        string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? $"Data Source={dataPath}";

        if (!builder.Environment.IsDevelopment())
        {
            builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keysPath));
            builder.Logging.AddFile(options =>
            {
                options.FileName = "log-"; // The log file prefixes
                options.LogDirectory = "logs/";
            });
        }


        builder.Services.AddDbContext<DataboxContext>(options => ConfigureDbContext(options, dbProvider, connectionString));

        builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

        builder.Services.AddScoped<EmailService>();
        builder.Services.AddScoped<TemplateService>();
        builder.Services.AddScoped<TempFileStorageService>();

        builder.Services.AddQuartz(q =>
        {
            var jobKey = new JobKey("SubmissionCleanupJob");
            q.AddJob<SubmissionCleanupJob>(opts => opts.WithIdentity(jobKey));
            q.AddTrigger(t => t
                .ForJob(jobKey)
                .WithIdentity("SubmissionCleanupJobTrigger")
                .WithSimpleSchedule(s => s
                    .WithIntervalInHours(1)
                    .RepeatForever())
            );

            jobKey = new JobKey("FileUploadCleanupJob");
            q.AddJob<FileUploadCleanupJob>(opts => opts.WithIdentity(jobKey));
            q.AddTrigger(t => t
                .ForJob(jobKey)
                .WithIdentity("FileUploadCleanupJobTrigger")
                .WithSimpleSchedule(s => s
                    .WithIntervalInMinutes(10)
                    .RepeatForever())
            );

        });

        builder.Services.AddControllersWithViews(options =>
        {
            options.InputFormatters.Insert(0, new PlainTextInputFormatter());
        });

        var app = builder.Build();

        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger<Program>();
        logger.LogInformation("Starting application");

        string subpath = builder.Configuration["App:BasePath"] ?? "";
        if (!string.IsNullOrEmpty(subpath))
        {
            logger.LogInformation("Running under subpath {subpath}", subpath);
            app.UsePathBase(subpath);
        }

        logger.LogInformation("Using database provider: {Provider}", dbProvider);
        logger.LogDebug("Initializing Database if not exists");
        app.EnsureDatabaseCreated();

        // Configure the HTTP request pipeline.
        if (!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
        }

        // app.UseHttpsRedirection();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseAuthorization();

        app.MapControllerRoute(
            name: "default",
            pattern: "{controller=Data}/{action=Index}/{id?}");

        app.Run();
    }

    static void ConfigureDbContext(DbContextOptionsBuilder options, string provider, string connString)
    {
        switch (provider.ToLower())
        {
            case "sqlserver":
                options.UseSqlServer(connString);
                break;
            case "sqlite":
                options.UseSqlite(connString);
                break;
            default:
                throw new Exception("Unsupported provider");
        }
    }

    static void CreateDatabaseFile(IServiceProvider services, IConfiguration configuration, ILogger logger)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DataboxContext>();
        var provider = configuration["ConnectionStrings:DatabaseProvider"]?.ToLower();
        var connString = configuration.GetConnectionString("DefaultConnection") ?? "";

        if (provider == "sqlite")
        {
            // Extract the path from the connection string
            var path = ExtractSqlitePath(connString);
            if (string.IsNullOrEmpty(path))
            {
                logger.LogError("SQLite connection string does not specify a Data Source.");
                return;
            }
            
            logger.LogInformation("SQLite database file: {DatabasePath}", Path.GetFullPath(path));

            logger.LogInformation("Ensuring SQLite database file exists...");
            if (db.Database.EnsureCreated())
            {
                logger.LogInformation("Database created.");
            }
            else
            {
                logger.LogInformation("Database already exists.");
            }
        }
    }

    static string? ExtractSqlitePath(string connectionString)
    {
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (trimmed.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                return trimmed.Substring("Data Source=".Length).Trim();
            }
        }
        return null;
    }
}