using System.Data.Common;
using Databox.Data;
using Databox.Services;
using Microsoft.EntityFrameworkCore;
using Quartz;

namespace Databox.Jobs
{
    public class FileUploadCleanupJob : IJob
    {
        private readonly DataboxContext _db;
        private readonly TempFileStorageService _fileStorageService;
        private readonly ILogger<FileUploadCleanupJob> _logger;

        public FileUploadCleanupJob(TempFileStorageService fileStorageService, ILogger<FileUploadCleanupJob> logger)
        {
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task Execute(IJobExecutionContext context)
        {
            _logger.LogDebug("FileUploadCleanupJob started at {Time}", DateTime.UtcNow);

            var expiredIds = _fileStorageService.GetExpiredFolderIds(DateTime.UtcNow.AddHours(-1));

            _logger.LogInformation("Found {Count} expired temporary files to remove", expiredIds.Count());

            foreach (var id in expiredIds)
            {
                _fileStorageService.DeleteFile(id);
                _logger.LogInformation("Removed temporary files with id {id}", id);
            }

            _logger.LogDebug("FileUploadCleanupJob finished at {Time}", DateTime.UtcNow);
        }
    }
}
