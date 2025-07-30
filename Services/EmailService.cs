using System.Net;
using System.Net.Mail;

namespace Databox.Services;

public class EmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly TemplateService _templateService;
    private readonly string _appBaseUrl;
    private readonly string _emailSmtpServer;
    private readonly int _emailPort;
    private readonly string _emailUsername;
    private readonly string _emailPassword;
    private readonly string _emailFrom;
    private readonly string _verificationEmailSubject;
    private readonly string _verificationEmailTemplate;
    private readonly bool _emailSsl;
    private readonly string _submissionEmailSubject;
    private readonly string _submissionEmailTo;
    private readonly string _submissionEmailTemplate;

    public EmailService(IConfiguration config, TemplateService templateService,
        ILogger<EmailService> logger)
    {
        _logger = logger;
        _templateService = templateService;

        _appBaseUrl = config["App:BaseUrl"] ?? throw new ArgumentException("App:BaseUrl not configured");

        _emailSmtpServer = config["Email:SmtpServer"] ?? throw new ArgumentException("Email:SmtpServer not configured");
        _emailPort = config.GetValue("Email:SmtpPort", 587); // Default to 587 if not configured

        _emailUsername = config["Email:Username"] ?? throw new ArgumentException("Email:Username not configured");
        _emailPassword = config["Email:Password"] ?? throw new ArgumentException("Email:Password not configured");

        _emailFrom = config["Email:From"] ?? _emailUsername ?? throw new ArgumentException("Email:From not configured");

        _verificationEmailSubject = config["Databox:VerificationMail:Subject"] ?? "[DataBox] Your Databox submission";
        _verificationEmailTemplate = config["Databox:VerificationMail:Template"] ?? "templates/verification-email.template";

        _emailSsl = config.GetValue("Email:Ssl", true);

        _submissionEmailSubject = config["Databox:SubmissionMail:Subject"] ?? "[DataBox] New documents Received";
        _submissionEmailTo = config["Databox:SubmissionMail:SendTo"] ?? _emailFrom ?? throw new ArgumentException("Databox:SubmissionMail:SendTo not configured");

        _submissionEmailTemplate = config["Databox:SubmissionMail:Template"] ?? "templates/submission-email.template";
    }

    public async Task SendVerificationMailAsync(string toEmail, string code)
    {
        _logger.LogDebug("Preparing to send verification code to {ToEmail}", toEmail);

        var data = new
        {
            Link = $"{_appBaseUrl.TrimEnd('/')}/verify?code={code}"
        };

        try
        {
            string body = await _templateService.RenderTemplateAsync(_verificationEmailTemplate, data);

            _logger.LogDebug("Sending email to {To} with subject {Subject}", toEmail, _verificationEmailSubject);
            using var client = new SmtpClient(_emailSmtpServer, _emailPort)
            {
                Credentials = new NetworkCredential(_emailUsername, _emailPassword),
                EnableSsl = _emailSsl
            };

            var mail = new MailMessage(_emailFrom, toEmail, _verificationEmailSubject, body)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(mail);

            _logger.LogInformation("Verification code sent to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification code to {ToEmail}", toEmail);
            throw;
        }
    }

    public async Task SendDataMailAsync(string from, string message, IEnumerable<IFormFile> files)
    {
        _logger.LogDebug("Preparing to send data email from {From}", from);
        var data = new
        {
            From = from,
            Files = files,
            Message = message,
            Date = DateTime.Now.ToString("g")
        };

        string body = await _templateService.RenderTemplateAsync(_submissionEmailTemplate, data);

        using var client = new SmtpClient(_emailSmtpServer, _emailPort)
        {
            Credentials = new NetworkCredential(_emailUsername, _emailPassword),
            EnableSsl = _emailSsl
        };

        var mail = new MailMessage
        {
            From = new MailAddress(_emailFrom),
            Subject = _submissionEmailSubject,
            Body = body,
            IsBodyHtml = true
        };

        mail.To.Add(_submissionEmailTo);

        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                ms.Position = 0;
                mail.Attachments.Add(new Attachment(ms, file.FileName));
                _logger.LogDebug("Attached file {FileName} to email", file.FileName);
            }
        }

        try
        {
            await client.SendMailAsync(mail);
            _logger.LogInformation("Data email sent from {From}", from);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send data email from {From}", from);
            throw;
        }
    }
}