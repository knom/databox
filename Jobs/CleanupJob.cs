using System.Data.Common;
using Databox.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Databox.Jobs
{
    public class CleanupJob : IJob
    {
        private readonly DataboxContext _db;
        private readonly ILogger<CleanupJob> _logger;

        public CleanupJob(DataboxContext db, ILogger<CleanupJob> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogDebug("CleanupJob started at {Time}", DateTime.UtcNow);

            try
            {
                var threshold = DateTime.UtcNow.AddHours(-48);
                _logger.LogDebug("Threshold for expired submissions: {Threshold}", threshold);

                var expired = await _db.Submissions
                    .Where(s => !s.Claimed && s.CreatedAt < threshold)
                    .ToListAsync();

                _logger.LogInformation("Found {Count} expired submissions to remove", expired.Count);

                if (expired.Any())
                {
                    _db.Submissions.RemoveRange(expired);
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Removed {Count} expired submissions", expired.Count);
                }
                else
                {
                    _logger.LogInformation("No expired submissions found to remove");
                }
            }
            catch (DbException ex)
            {
                _logger.LogError(ex, "Database error occurred during CleanupJob execution");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during CleanupJob execution");
            }

            _logger.LogDebug("CleanupJob finished at {Time}", DateTime.UtcNow);
        }
    }
}
