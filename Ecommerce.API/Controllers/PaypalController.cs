using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;

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

        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadAsStringAsync();
            throw new Exception($"Error al obtener el token de PayPal: {errorDetails}");
        }

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

            if (totalAmount <= 0)
            {
                return BadRequest(new { mensaje = "El monto total de la orden es inválido o no fue provisto." });
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

            // 2. Extraer usuario y dirección de envío
            int usuarioId = data.TryGetProperty("usuarioId", out var userElem) && userElem.ValueKind == JsonValueKind.Number ? userElem.GetInt32() : 0;
            int direccionEnvioId = data.TryGetProperty("direccionEnvioId", out var dirElem) && dirElem.ValueKind == JsonValueKind.Number ? dirElem.GetInt32() : 0;

            if (direccionEnvioId <= 0)
            {
                return BadRequest(new { mensaje = "El ID de la dirección de envío es requerido para procesar la orden." });
            }

            // 3. Guardar el registro inicial en la BD local (`Orden`)[cite: 3]
            var nuevaOrden = new Orden
            {
                UsuarioId = usuarioId,
                DireccionEnvioId = direccionEnvioId,
                PayPalOrderId = paypalOrderId,
                EstadoOrden = "Pendiente",
                Subtotal = totalAmount,
                Iva = 0,
                CostoFlete = 0,
                Total = totalAmount
            };

            _context.Ordenes.Add(nuevaOrden);
            await _context.SaveChangesAsync();

            // 4. Registrar los productos en `OrdenesDetalles` consultando el precio real de la BD[cite: 2, 6]
            if (data.TryGetProperty("items", out var itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var itemElem in itemsElement.EnumerateArray())
                {
                    int productoId = itemElem.TryGetProperty("productoId", out var pId) ? pId.GetInt32() : (itemElem.TryGetProperty("id", out var idElem) ? idElem.GetInt32() : 0);
                    int cantidad = itemElem.TryGetProperty("cantidad", out var cant) ? cant.GetInt32() : 1;

                    if (productoId > 0)
                    {
                        var productoDb = await _context.Productos.FindAsync(productoId);
                        decimal precioReal = productoDb?.PrecioPublico ?? 0;

                        var detalle = new OrdenDetalle
                        {
                            OrdenId = nuevaOrden.Id,
                            ProductoId = productoId,
                            Cantidad = cantidad,
                            PrecioUnitario = precioReal,
                            EsBajoPedido = false
                        };
                        _context.OrdenesDetalles.Add(detalle);
                    }
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { id = paypalOrderId });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error interno del servidor en create-order", error = ex.Message });
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
                // 2. Registrar el éxito, actualizar la orden e INVENTARIO en la base de datos local[cite: 3]
                var ordenExistente = await _context.Ordenes.FirstOrDefaultAsync(o => o.PayPalOrderId == paypalOrderId);

                if (ordenExistente != null)
                {
                    ordenExistente.EstadoOrden = "Pagado";

                    // 3. Consultar los detalles asociados a esta orden[cite: 2, 6]
                    var detallesOrden = await _context.OrdenesDetalles
                        .Where(d => d.OrdenId == ordenExistente.Id)
                        .ToListAsync();

                    // 4. Descontar las cantidades del inventario en la tabla `Productos`[cite: 4]
                    foreach (var detalle in detallesOrden)
                    {
                        var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                        if (producto != null)
                        {
                            producto.Stock -= detalle.Cantidad;
                            if (producto.Stock < 0)
                            {
                                producto.Stock = 0;
                            }
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok(new { success = true, status });
            }

            return BadRequest(new { mensaje = "El pago no se completó correctamente.", status });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error interno del servidor en capture-order", error = ex.Message });
        }
    }
} 