using System.Data.Common;
using Databox.Data;
using Databox.Services;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Databox.Jobs
{
    public class FileUploadCleanupJob : IJob
    {
        private readonly TempFileStorageService _fileStorageService;
        private readonly ILogger<FileUploadCleanupJob> _logger;

        public FileUploadCleanupJob(TempFileStorageService fileStorageService, ILogger<FileUploadCleanupJob> logger)
        {
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public Task Execute(IJobExecutionContext context)
        {
            _logger.LogDebug("{job} started at {Time}", nameof(FileUploadCleanupJob), DateTime.UtcNow);

            var expiredIds = _fileStorageService.GetExpiredFolderIds(DateTime.UtcNow.AddHours(-1));

            if (expiredIds.Any())
                _logger.LogInformation("Found {Count} expired temporary files to remove", expiredIds.Count());

            foreach (var id in expiredIds)
            {
                _fileStorageService.DeleteFile(id);
                _logger.LogDebug("Removed temporary files with id {id}", id);
            }

            _logger.LogDebug("{job} finished at {Time}", nameof(FileUploadCleanupJob), DateTime.UtcNow);

            return Task.CompletedTask;
        }
    }
}