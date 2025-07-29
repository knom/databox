using HandlebarsDotNet;

namespace Databox.Services;

public class TemplateService(ILogger<TemplateService> _logger)
{
    public async Task<string> RenderTemplateAsync(string templateFile, object data)
    {
        string filePath = Path.GetFullPath(templateFile);

        _logger.LogDebug("Opening template \"{filepath}\"", filePath);

        try
        {
            _logger.LogInformation("Reading template file: {filepath}", filePath);
            string templatesource = await File.ReadAllTextAsync(filePath);

            _logger.LogDebug("Compiling template: {filepath}", filePath);
            var template = Handlebars.Compile(templatesource);

            _logger.LogDebug("Rendering template: {filepath}", filePath);
            return template(data);
        }
        catch (FileNotFoundException ex)
        {
            _logger.LogError(ex, "Template file not found: {filepath}", filePath);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rendering template: {filepath}", filePath);
            throw;
        }
    }
}