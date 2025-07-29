using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Net.Http.Headers;
using Databox.Services;

namespace Databox.Controllers;

[ApiController]
[Route("[controller]")]
public class FileUploadController : ControllerBase
{
    private readonly ILogger<FileUploadController> _logger;
    private readonly TempFileStorageService _tempFileStorage;

    public FileUploadController(ILogger<FileUploadController> logger, TempFileStorageService tempFileStorage)
    {
        _logger = logger;
        _tempFileStorage = tempFileStorage;
    }

    [HttpPost("process")]
    public async Task<IActionResult> Process()
    {
        var form = await Request.ReadFormAsync();

        if (form == null)
            return BadRequest();

        var file = form.Files.FirstOrDefault();
        if (file == null)
        {
            _logger.LogWarning("No file uploaded.");
            return BadRequest("No file uploaded.");
        }

        // string userCode = form["fileMetadata[userCode]"];
        // _logger.LogInformation("Usercode is {usercode}", userCode);

        Guid tempFileId = await _tempFileStorage.SaveFileAsync(file);

        _logger.LogInformation("File '{FileName}' uploaded by id {id}", file.FileName, tempFileId);

        return Content(tempFileId.ToString(), "text/plain", Encoding.UTF8);
    }

    [HttpDelete("revert")]
    [Consumes("text/plain")]
    public IActionResult Revert([FromBody] string id)
    {
        if (!Guid.TryParse(id, out Guid tempFileGuid))
        {
            return BadRequest("id is not a valid guid");
        }

        try
        {
            _tempFileStorage.DeleteFile(tempFileGuid);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(ex);
        }

        return Ok();
    }

    [HttpGet("restore/{id}")]
    public IActionResult Restore(string id)
    {
        if (!Guid.TryParse(id, out Guid tempFileGuid))
        {
            return BadRequest("id is not a valid guid");
        }

        _logger.LogDebug("Getting temp file {guid}", tempFileGuid);

        var file = _tempFileStorage.GetFile(tempFileGuid);

        _logger.LogInformation("Returning temp file {guid}", tempFileGuid);

        return File(file.OpenReadStream(), file.ContentType, file.FileName);
    }

    [HttpGet("load/{id}")]
    public IActionResult Load(string id)
    {
        if (!Guid.TryParse(id, out Guid tempFileGuid))
        {
            return BadRequest("id is not a valid guid");
        }

        _logger.LogDebug("Getting temp file {guid}", tempFileGuid);

        var file = _tempFileStorage.GetFile(tempFileGuid);

        _logger.LogInformation("Returning temp file {guid}", tempFileGuid);

        return File(file.OpenReadStream(), file.ContentType, file.FileName);
    }

    [HttpGet("fetch")]
    public async Task<IActionResult> Fetch([FromQuery] string url)
    {
        using var client = new HttpClient();
        _logger.LogInformation("Fetching external file from URL: {Url}", url);

        var stream = await client.GetStreamAsync(url);
        var fileName = Path.GetFileName(url);

        Response.Headers.Append("Access-Control-Expose-Headers", "Content-Disposition, Content-Length, X-Content-Transfer-Id");
        Response.Headers.Append("X-Content-Transfer-Id", Guid.NewGuid().ToString());

        return File(stream, "application/octet-stream", fileName);
    }

    [HttpDelete("remove/{id}")]
    public IActionResult Remove(string id)
    {
        if (!Guid.TryParse(id, out Guid tempFileGuid))
        {
            return BadRequest("id is not a valid guid");
        }

        _tempFileStorage.DeleteFile(tempFileGuid);

        _logger.LogInformation("Removed file {guid}", id);

        return Ok();
    }

    // [HttpPost("processchunks")]
    // public IActionResult StartChunkedUpload()
    // {
    //     var transferId = Guid.NewGuid().ToString();
    //     var folderPath = Path.Combine(_tempPath, transferId);
    //     Directory.CreateDirectory(folderPath);

    //     _logger.LogInformation("Started chunked upload. Transfer ID: {TransferId}", transferId);
    //     return Content(transferId, "text/plain", Encoding.UTF8);
    // }

    // [HttpPatch("processchunks/{transferId}")]
    // public async Task<IActionResult> ReceiveChunk(string transferId)
    // {
    //     var uploadName = Request.Headers["Upload-Name"].ToString();
    //     var uploadOffsetStr = Request.Headers["Upload-Offset"].ToString();
    //     var uploadLengthStr = Request.Headers["Upload-Length"].ToString();

    //     if (!long.TryParse(uploadOffsetStr, out var uploadOffset) ||
    //         !long.TryParse(uploadLengthStr, out var uploadLength))
    //     {
    //         _logger.LogError("Chunk upload failed. Invalid headers. Transfer ID: {TransferId}", transferId);
    //         return BadRequest("Missing or invalid headers");
    //     }

    //     var folderPath = Path.Combine(_tempPath, transferId);
    //     Directory.CreateDirectory(folderPath);

    //     var filePath = Path.Combine(folderPath, uploadName);

    //     using var fs = new FileStream(filePath, FileMode.OpenOrCreate, FileAccess.Write, FileShare.None);
    //     fs.Position = uploadOffset;
    //     await Request.Body.CopyToAsync(fs);

    //     _logger.LogInformation("Received chunk for {FileName} at offset {Offset} (Transfer ID: {TransferId})", uploadName, uploadOffset, transferId);
    //     return Ok();
    // }

    // [HttpHead("processchunks/{transferId}")]
    // public IActionResult GetChunkOffset(string transferId)
    // {
    //     var folderPath = Path.Combine(_tempPath, transferId);
    //     if (!Directory.Exists(folderPath))
    //     {
    //         _logger.LogWarning("Chunk offset request failed. Folder not found for ID: {TransferId}", transferId);
    //         return NotFound();
    //     }

    //     var file = Directory.GetFiles(folderPath).FirstOrDefault();
    //     if (file == null)
    //     {
    //         _logger.LogWarning("Chunk offset request failed. No file found in folder for ID: {TransferId}", transferId);
    //         return NotFound();
    //     }

    //     var fileInfo = new FileInfo(file);
    //     Response.Headers["Upload-Offset"] = fileInfo.Length.ToString();
    //     _logger.LogInformation("Chunk offset for {FileName} is {Offset} bytes (Transfer ID: {TransferId})", fileInfo.Name, fileInfo.Length, transferId);

    //     return Ok();
    // }
}

