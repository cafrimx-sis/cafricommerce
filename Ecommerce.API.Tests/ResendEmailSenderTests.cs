using System.Net;
using System.Text.Json;
using Ecommerce.API.Services;
using Microsoft.Extensions.Configuration;

namespace Ecommerce.API.Tests;

public class ResendEmailSenderTests
{
    [Fact]
    public async Task SendAsyncSendsEmailAndInlineLogoThroughHttpsApi()
    {
        HttpRequestMessage? capturedRequest = null;
        string? requestBody = null;
        var handler = new StubHttpMessageHandler(async request =>
        {
            capturedRequest = request;
            requestBody = await request.Content!.ReadAsStringAsync();
            return new HttpResponseMessage(HttpStatusCode.OK);
        });
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.resend.com/")
        };
        var sender = CreateSender(httpClient);

        await sender.SendAsync(
            "customer@example.com",
            "Verify account",
            "Your code is 123456",
            "<p>Your code is 123456</p>",
            [1, 2, 3]);

        Assert.NotNull(capturedRequest);
        Assert.Equal(HttpMethod.Post, capturedRequest.Method);
        Assert.Equal("/emails", capturedRequest.RequestUri!.AbsolutePath);
        Assert.Equal("Bearer", capturedRequest.Headers.Authorization!.Scheme);
        Assert.Equal("res_test_key", capturedRequest.Headers.Authorization.Parameter);

        using var payload = JsonDocument.Parse(requestBody!);
        var root = payload.RootElement;
        Assert.Equal("CAFRI <noreply@example.com>", root.GetProperty("from").GetString());
        Assert.Equal("customer@example.com", root.GetProperty("to")[0].GetString());
        Assert.Equal("Verify account", root.GetProperty("subject").GetString());
        Assert.Equal("Your code is 123456", root.GetProperty("text").GetString());
        Assert.Equal("<p>Your code is 123456</p>", root.GetProperty("html").GetString());
        Assert.Equal("AQID", root.GetProperty("attachments")[0].GetProperty("content").GetString());
        Assert.Equal("cafri-logo", root.GetProperty("attachments")[0].GetProperty("content_id").GetString());
    }

    [Fact]
    public async Task SendAsyncThrowsWhenResendRejectsRequest()
    {
        var handler = new StubHttpMessageHandler(_ =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("{\"message\":\"invalid sender\"}")
            }));
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.resend.com/")
        };
        var sender = CreateSender(httpClient);

        var exception = await Assert.ThrowsAsync<HttpRequestException>(() =>
            sender.SendAsync("customer@example.com", "Subject", "Body"));

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Contains("invalid sender", exception.Message);
    }

    private static ResendEmailSender CreateSender(HttpClient httpClient)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["EmailSettings:ResendApiKey"] = "res_test_key",
                ["EmailSettings:SenderEmail"] = "noreply@example.com",
                ["EmailSettings:SenderName"] = "CAFRI"
            })
            .Build();

        return new ResendEmailSender(httpClient, configuration);
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, Task<HttpResponseMessage>> sendAsync) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) => sendAsync(request);
    }
}
