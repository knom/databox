using Microsoft.AspNetCore.Mvc;
using Databox.Models;
using System.Diagnostics;

namespace Databox.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        var requestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier;
        var statusCode = HttpContext.Response.StatusCode;
        
        _logger.LogError("Error page requested. StatusCode: {StatusCode}, RequestId: {RequestId}", statusCode, requestId);
        
        return View(new ErrorViewModel { RequestId = requestId });
    }
}