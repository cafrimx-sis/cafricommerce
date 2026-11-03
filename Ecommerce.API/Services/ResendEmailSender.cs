using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Ecommerce.API.Services;

public sealed class ResendEmailSender
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _senderEmail;
    private readonly string _senderName;

    public ResendEmailSender(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["EmailSettings:ResendApiKey"]
            ?? throw new InvalidOperationException("EmailSettings:ResendApiKey must be configured.");
        _senderEmail = configuration["EmailSettings:SenderEmail"]
            ?? throw new InvalidOperationException("EmailSettings:SenderEmail must be configured.");
        _senderName = configuration["EmailSettings:SenderName"] ?? "CAFRI E-commerce";
    }

    public async Task SendAsync(
        string recipient,
        string subject,
        string text,
        string? html = null,
        byte[]? inlineLogo = null,
        CancellationToken cancellationToken = default)
    {
        var attachments = inlineLogo is null
            ? null
            : new[]
            {
                new
                {
                    filename = "cafri-logo.png",
                    content = Convert.ToBase64String(inlineLogo),
                    content_type = "image/png",
                    content_id = "cafri-logo"
                }
            };

        using var request = new HttpRequestMessage(HttpMethod.Post, "emails")
        {
            Content = JsonContent.Create(new
            {
                from = $"{_senderName} <{_senderEmail}>",
                to = new[] { recipient },
                subject,
                text,
                html,
                attachments
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
            return;

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException(
            $"Resend email request failed with status {(int)response.StatusCode}: {responseBody}",
            null,
            response.StatusCode);
    }
}
