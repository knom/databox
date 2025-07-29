using Microsoft.Extensions.Logging;

namespace Databox.Services;

public class TempFileStorageService
{
    private readonly string _tempPath = Path.Combine("wwwroot", "uploads", "tmp");
    
    private readonly ILogger<TempFileStorageService> _logger;

    public TempFileStorageService(ILogger<TempFileStorageService> logger)
    {
        Directory.CreateDirectory(_tempPath);
        
        _logger = logger;
    }

    public async Task<Guid> SaveFileAsync(IFormFile file)
    {
        var id = Guid.NewGuid();

        var folderPath = Path.Combine(_tempPath, id.ToString());
        Directory.CreateDirectory(folderPath);

        var filePath = Path.Combine(folderPath, file.FileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return id;
    }

    public void DeleteFile(Guid tempFileGuid)
    {
        var folderPath = Path.Combine(_tempPath, tempFileGuid.ToString());
        if (Directory.Exists(folderPath))
        {
            Directory.Delete(folderPath, true);
            _logger.LogInformation("Reverted and deleted folder for ID: {Id}", tempFileGuid);
        }
        else
        {
            _logger.LogWarning("Attempted to revert non-existent ID: {Id}", tempFileGuid);
            throw new ArgumentOutOfRangeException(nameof(tempFileGuid), "ID not found in temp files");
        }
    }

    public IFormFile GetFile(Guid id)
    {
        var folderPath = Path.Combine(_tempPath, id.ToString());
        if (!Directory.Exists(folderPath))
        {
            _logger.LogWarning("Folder not found for ID: {Id}", id);
            throw new FileNotFoundException($"Folder {folderPath} not found in temp file storage.");
        }

        var filePath = Directory.GetFiles(folderPath).FirstOrDefault();
        if (filePath == null)
        {
            _logger.LogWarning("No file found in folder for ID: {Id}", id);
            throw new FileNotFoundException($"File with id {id} not found in temp file storage {folderPath}.");
        }

        var fileName = Path.GetFileName(filePath);
        _logger.LogDebug("Getting '{FileName}' for ID: {Id}", fileName, id);

        var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);

        return new FormFile(fileStream, 0, fileStream.Length, fileName, fileName);
    }

    public IEnumerable<Guid> GetExpiredFolderIds(DateTime dateTime)
    {
        return Directory.GetDirectories(_tempPath)
            .Where(file => Directory.GetCreationTime(file) <= dateTime) // or use File.GetLastWriteTime(file)
            .Select(p => Guid.Parse(Path.GetFileName(p)));
    }
}