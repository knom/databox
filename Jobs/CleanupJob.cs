using System.Data.Common;
using Databox.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Databox.Jobs
{
    public class SubmissionCleanupJob : IJob
    {
        private readonly DataboxContext _db;
        private readonly ILogger<SubmissionCleanupJob> _logger;

        public SubmissionCleanupJob(DataboxContext db, ILogger<SubmissionCleanupJob> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogDebug("{job} started at {Time}", nameof(SubmissionCleanupJob), DateTime.UtcNow);

            try
            {
                var threshold = DateTime.UtcNow.AddHours(-48);
                _logger.LogDebug("Threshold for expired submissions: {Threshold}", threshold);

                var expired = _db.Submissions
                    .Where(s => !s.Claimed && s.CreatedAt < threshold)
                    .ToList();

                if (expired.Any())
                {
                    _db.Submissions.RemoveRange(expired);
                    await _db.SaveChangesAsync();
                    _logger.LogInformation("Removed {Count} expired submissions", expired.Count);
                }
                else
                {
                    _logger.LogDebug("No expired submissions found to remove");
                }
            }
            catch (DbException ex)
            {
                _logger.LogError(ex, "Database error occurred during {job} execution", nameof(SubmissionCleanupJob));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred during {job} execution", nameof(SubmissionCleanupJob));
            }

            _logger.LogDebug("{job} finished at {Time}", nameof(SubmissionCleanupJob), DateTime.UtcNow);
        }
    }
}