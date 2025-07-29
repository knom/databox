using Databox.Data;
using Databox.Models;
using Databox.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Databox.Controllers
{
    public class DataController : Controller
    {
        private readonly DataboxContext _db;
        private readonly EmailService _email;
        private readonly TempFileStorageService _tempFileStorage;
        private readonly ILogger<DataController> _logger;

        public DataController(DataboxContext db, EmailService email, TempFileStorageService tempFileStorage,ILogger<DataController> logger)
        {
            _db = db;
            _email = email;
            _tempFileStorage = tempFileStorage;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Index()
        {
            _logger.LogDebug("View Index returned.");
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Index(string email)
        {
            try
            {
                _logger.LogDebug("POST Index called with email: {Email}", email);

                var submission = new Submission { Email = email };
                _db.Submissions.Add(submission);
                await _db.SaveChangesAsync();

                await _email.SendVerificationMailAsync(email, submission.Code);
                ViewBag.Message = "Check your email for a link to continue.";

                _logger.LogInformation("Submission created and code sent to {Email}", email);

                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in POST Index for email: {Email}", email);
                throw;
            }
        }

        [HttpGet("/Verify")]
        public async Task<IActionResult> Verify(string code)
        {
            try
            {
                _logger.LogDebug("GET Verify called with code: {Code}", code);

                var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Code == code);
                if (submission == null || submission.Claimed)
                {
                    _logger.LogWarning("Invalid or claimed code attempted: {Code}", code);
                    return View("Invalid");
                }

                ViewBag.Code = code;
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GET Verify for code: {Code}", code);
                throw;
            }
        }

        [HttpPost("/Send")]
        public async Task<IActionResult> Send(string code, string message, IList<string> files)
            //List<IFormFile> files not anymore)
        {
            try
            {
                _logger.LogDebug("POST Send called with code: {Code}", code);

                var submission = await _db.Submissions.FirstOrDefaultAsync(s => s.Code == code);
                if (submission == null || submission.Claimed)
                {
                    _logger.LogWarning("Invalid or claimed code attempted in Send: {Code}", code);
                    return View("Invalid");
                }

                var files2 = files.Select(p => _tempFileStorage.GetFile(Guid.Parse(p)));

                await _email.SendDataMailAsync(submission.Email, message, files2);
                _logger.LogInformation("Data sent from {Email} (Code: {Code})", submission.Email, code);

                _db.Submissions.Remove(submission);
                await _db.SaveChangesAsync();
                _logger.LogDebug("Submission removed for code: {Code} - email: {email}", code, submission.Email);

                _logger.LogDebug("Removing temporary files");
                foreach (var guid in files.Select(Guid.Parse))
                {
                    _tempFileStorage.DeleteFile(guid);
                }

                return RedirectToAction("Done");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in POST Send for code: {Code}", code);
                throw;
            }
        }

        public IActionResult Done()
        {
            _logger.LogDebug("View Done returned.");
            return View();
        }

        public IActionResult Invalid()
        {
            _logger.LogDebug("View Invalid returned.");
            return View();
        }

        public IActionResult Privacy()
        {
            _logger.LogDebug("View Privacy returned.");
            return View();
        }
    }
}
