using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;

[Route("api/paypal")]
[ApiController]
public class PayPalController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;

    public PayPalController(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
    }

    private async Task<string> GetAccessTokenAsync()
    {
        var clientId = _configuration["PayPalSettings:ClientId"];
        var clientSecret = _configuration["PayPalSettings:ClientSecret"];
        var mode = _configuration["PayPalSettings:Mode"] ?? "Sandbox";

        var baseUrl = mode.Equals("Live", StringComparison.OrdinalIgnoreCase)
            ? "https://api-m.paypal.com"
            : "https://api-m.sandbox.paypal.com";

        var authToken = Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/v1/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authToken));
        request.Content = new FormUrlEncodedContent(new[] { new KeyValuePair<string, string>("grant_type", "client_credentials") });

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var jsonResponse = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonResponse);
        return doc.RootElement.GetProperty("access_token").GetString() ?? string.Empty;
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] JsonElement data)
    {
        try
        {
            var accessToken = await GetAccessTokenAsync();
            var mode = _configuration["PayPalSettings:Mode"] ?? "Sandbox";
            var baseUrl = mode.Equals("Live", StringComparison.OrdinalIgnoreCase)
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";

            decimal totalAmount = 0;
            if (data.TryGetProperty("totalAmount", out var totalElement))
            {
                totalAmount = totalElement.GetDecimal();
            }

            // 1. Crear la orden en la API de PayPal
            var orderRequest = new
            {
                intent = "CAPTURE",
                purchase_units = new[]
                {
                    new
                    {
                        amount = new
                        {
                            currency_code = "MXN",
                            value = totalAmount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                        }
                    }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/v2/checkout/orders");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(orderRequest), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return BadRequest(new { mensaje = "Error al crear orden en PayPal", detalle = errorContent });
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            var paypalOrderId = doc.RootElement.GetProperty("id").GetString();

            // 2. Guardar el registro inicial en la BD local con los campos base de la entidad Orden
            int usuarioId = data.TryGetProperty("usuarioId", out var userElem) && userElem.ValueKind == JsonValueKind.Number ? userElem.GetInt32() : 0;

            var nuevaOrden = new Orden
            {
                UsuarioId = usuarioId,
                PayPalOrderId = paypalOrderId,
                EstadoOrden = "Pendiente",
                Total = totalAmount
            };

            _context.Ordenes.Add(nuevaOrden);
            await _context.SaveChangesAsync();

            return Ok(new { id = paypalOrderId });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
        }
    }

    [HttpPost("capture-order")]
    public async Task<IActionResult> CaptureOrder([FromBody] JsonElement data)
    {
        try
        {
            if (!data.TryGetProperty("orderId", out var orderIdElement))
            {
                return BadRequest(new { mensaje = "El ID de la orden es requerido." });
            }

            string paypalOrderId = orderIdElement.GetString() ?? string.Empty;
            var accessToken = await GetAccessTokenAsync();
            var mode = _configuration["PayPalSettings:Mode"] ?? "Sandbox";
            var baseUrl = mode.Equals("Live", StringComparison.OrdinalIgnoreCase)
                ? "https://api-m.paypal.com"
                : "https://api-m.sandbox.paypal.com";

            // 1. Capturar el pago en PayPal
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/v2/checkout/orders/{paypalOrderId}/capture");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent("", Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return BadRequest(new { mensaje = "Error al capturar el pago en PayPal", detalle = errorContent });
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            string status = doc.RootElement.GetProperty("status").GetString() ?? string.Empty;

            if (status == "COMPLETED")
            {
                // 2. Registrar el éxito y actualizar la orden en la base de datos local
                var ordenExistente = await _context.Ordenes.FirstOrDefaultAsync(o => o.PayPalOrderId == paypalOrderId);
                if (ordenExistente != null)
                {
                    ordenExistente.EstadoOrden = "Pagado";
                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, status });
            }

            return BadRequest(new { mensaje = "El pago no se completó correctamente.", status });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
        }
    }
}