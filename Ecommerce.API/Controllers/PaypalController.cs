using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Net.Http.Headers;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Ecommerce.API.Data;
using Ecommerce.API.DTOs;
using Ecommerce.API.Entities;
using Ecommerce.API.Services;

[Route("api/paypal")]
[ApiController]
[Authorize] // 🔒 Blindado: Exige que el usuario esté autenticado para realizar compras
public class PayPalController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PayPalController> _logger;

    public PayPalController(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context, ILogger<PayPalController> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
        _logger = logger;
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
            throw new HttpRequestException("PayPal no autorizó la solicitud de token.");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonResponse);
        return doc.RootElement.GetProperty("access_token").GetString() ?? string.Empty;
    }

    [HttpPost("create-order")]
    public async Task<IActionResult> CreateOrder([FromBody] CheckoutDto checkout)
    {
        if (!int.TryParse(User.FindFirstValue("sub"), out var usuarioId))
            return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
        if (checkout == null || checkout.Items == null || checkout.Items.Count == 0 ||
            checkout.Items.Any(item => item.ProductoId <= 0 || item.Cantidad <= 0 || item.Cantidad > 1000))
            return BadRequest(new { mensaje = "La orden debe incluir productos con cantidades válidas." });

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var direccionEnvioId = checkout.DireccionEnvioId;
            if (direccionEnvioId <= 0)
            {
                if (string.IsNullOrWhiteSpace(checkout.Calle) ||
                    string.IsNullOrWhiteSpace(checkout.NumeroExterior) ||
                    string.IsNullOrWhiteSpace(checkout.Colonia) ||
                    string.IsNullOrWhiteSpace(checkout.Ciudad) ||
                    string.IsNullOrWhiteSpace(checkout.Estado) ||
                    string.IsNullOrWhiteSpace(checkout.CodigoPostal) ||
                    string.IsNullOrWhiteSpace(checkout.TelefonoContacto))
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = "Completa todos los datos requeridos de envío." });
                }

                var nuevaDireccion = new DireccionEnvio
                {
                    UsuarioId = usuarioId,
                    Calle = checkout.Calle,
                    NumeroExterior = checkout.NumeroExterior,
                    NumeroInterior = checkout.NumeroInterior,
                    Colonia = checkout.Colonia,
                    Ciudad = checkout.Ciudad,
                    Estado = checkout.Estado,
                    CodigoPostal = checkout.CodigoPostal,
                    TelefonoContacto = checkout.TelefonoContacto
                };

                _context.DireccionesEnvio.Add(nuevaDireccion);
                await _context.SaveChangesAsync();
                direccionEnvioId = nuevaDireccion.Id;
            }
            else if (!await _context.DireccionesEnvio.AnyAsync(d => d.Id == direccionEnvioId && d.UsuarioId == usuarioId))
            {
                await transaction.RollbackAsync();
                return NotFound(new { mensaje = "La dirección no existe o no pertenece al usuario autenticado." });
            }

            decimal calculatedTotal = 0;
            var detallesList = new List<OrdenDetalle>();
            var groupedItems = checkout.Items.GroupBy(item => item.ProductoId).Select(group => new
            {
                ProductoId = group.Key,
                Cantidad = group.Sum(item => item.Cantidad)
            }).ToList();
            if (groupedItems.Any(item => item.Cantidad > 1000))
            {
                await transaction.RollbackAsync();
                return BadRequest(new { mensaje = "La cantidad total por producto no puede superar 1000 unidades." });
            }

            foreach (var item in groupedItems)
            {
                var productoDb = await _context.Productos.FindAsync(item.ProductoId);
                if (productoDb == null)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = $"Producto con ID {item.ProductoId} no encontrado." });
                }
                if (productoDb.Stock < item.Cantidad)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = $"Stock insuficiente para el producto: {productoDb.Nombre}." });
                }
                var precioActual = PrecioProducto.ObtenerPrecioActual(productoDb, DateTime.UtcNow);
                if (precioActual <= 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = $"El precio del producto {productoDb.Nombre} no es válido." });
                }

                calculatedTotal += precioActual * item.Cantidad;
                detallesList.Add(new OrdenDetalle
                {
                    ProductoId = productoDb.ProductoId,
                    Cantidad = item.Cantidad,
                    PrecioUnitario = precioActual,
                    EsBajoPedido = false
                });
            }

            if (calculatedTotal <= 0)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { mensaje = "La orden no contiene productos válidos o el total es cero." });
            }
            calculatedTotal = decimal.Round(calculatedTotal, 2, MidpointRounding.AwayFromZero);

            foreach (var item in groupedItems)
            {
                var stockReserved = await _context.Productos
                    .Where(product => product.ProductoId == item.ProductoId && product.Stock >= item.Cantidad)
                    .ExecuteUpdateAsync(updates =>
                        updates.SetProperty(product => product.Stock, product => product.Stock - item.Cantidad));
                if (stockReserved != 1)
                {
                    await transaction.RollbackAsync();
                    return Conflict(new { mensaje = "El inventario cambió mientras preparábamos tu pedido. Actualiza el carrito e inténtalo de nuevo." });
                }
            }

            var accessToken = await GetAccessTokenAsync();
            // 1. Crear la orden en la API de PayPal usando el monto real calculado en el servidor
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
                            value = calculatedTotal.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                        }
                    }
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{GetPayPalBaseUrl()}/v2/checkout/orders");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(orderRequest), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning("PayPal rechazó la creación de una orden.");
                return BadRequest(new { mensaje = "No se pudo crear la orden de pago con PayPal." });
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            var paypalOrderId = doc.RootElement.GetProperty("id").GetString();

            // 2. Guardar el registro inicial en la tabla `Ordenes`
            var nuevaOrden = new Orden
            {
                UsuarioId = usuarioId,
                DireccionEnvioId = direccionEnvioId,
                PayPalOrderId = paypalOrderId,
                EstadoOrden = "Pendiente",
                Subtotal = calculatedTotal,
                Iva = 0,
                CostoFlete = 0,
                Total = calculatedTotal,
                InventarioReservado = true,
                InventarioReservaExpiraUtc = DateTime.UtcNow.AddHours(24)
            };

            _context.Ordenes.Add(nuevaOrden);
            await _context.SaveChangesAsync();

            // 3. Registrar los detalles de la orden
            foreach (var detalle in detallesList)
            {
                detalle.OrdenId = nuevaOrden.Id;
                _context.OrdenesDetalles.Add(detalle);
            }
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(new { id = paypalOrderId });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error al crear una orden de PayPal.");
            return StatusCode(500, new { mensaje = "Error interno del servidor en create-order" });
        }
    }

    [HttpPost("capture-order")]
    public async Task<IActionResult> CaptureOrder([FromBody] JsonElement data)
    {
        if (!int.TryParse(User.FindFirstValue("sub"), out var usuarioId))
            return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
        if (data.ValueKind != JsonValueKind.Object ||
            !data.TryGetProperty("orderId", out var orderIdElement) ||
            orderIdElement.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(orderIdElement.GetString()))
            return BadRequest(new { mensaje = "El ID de la orden es requerido." });

        var paypalOrderId = orderIdElement.GetString()!;
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var order = await _context.Ordenes
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.PayPalOrderId == paypalOrderId && o.UsuarioId == usuarioId);
            if (order == null)
            {
                await transaction.RollbackAsync();
                return NotFound(new { mensaje = "La orden no existe o no pertenece al usuario autenticado." });
            }
            if (order.EstadoOrden is "Pagado" or "En preparación" or "Enviado" or "Entregado")
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, status = "COMPLETED" });
            }

            var ahoraUtc = DateTime.UtcNow;
            var limiteOrdenLegada = ahoraUtc.AddHours(-24);
            var capturaReclamada = await _context.Ordenes
                .Where(candidate => candidate.Id == order.Id &&
                    (candidate.EstadoOrden == "Pendiente" ||
                     candidate.EstadoOrden == "Pendiente Pago PayPal") &&
                    ((candidate.InventarioReservado &&
                      candidate.InventarioReservaExpiraUtc > ahoraUtc) ||
                     (!candidate.InventarioReservaExpiraUtc.HasValue &&
                      candidate.FechaOrden > limiteOrdenLegada)))
                .ExecuteUpdateAsync(updates =>
                    updates.SetProperty(candidate => candidate.EstadoOrden, "Procesando Pago PayPal"));
            if (capturaReclamada != 1)
            {
                var estadoActual = await _context.Ordenes
                    .Where(candidate => candidate.Id == order.Id)
                    .Select(candidate => candidate.EstadoOrden)
                    .SingleOrDefaultAsync();
                if (estadoActual is "Pagado" or "En preparación" or "Enviado" or "Entregado")
                {
                    await transaction.CommitAsync();
                    return Ok(new { success = true, status = "COMPLETED" });
                }

                await transaction.RollbackAsync();
                return Conflict(new { mensaje = "La reserva de inventario venció o la orden ya no puede pagarse. Crea una nueva orden." });
            }

            var accessToken = await GetAccessTokenAsync();
            // 1. Capturar el pago en PayPal
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{GetPayPalBaseUrl()}/v2/checkout/orders/{Uri.EscapeDataString(paypalOrderId)}/capture");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent("", Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                await transaction.RollbackAsync();
                _logger.LogWarning("PayPal rechazó la captura de la orden {PayPalOrderId}.", paypalOrderId);
                return BadRequest(new { mensaje = "PayPal no pudo completar el pago." });
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            string status = doc.RootElement.GetProperty("status").GetString() ?? string.Empty;

            if (status == "COMPLETED")
            {
                if (!TryGetCompletedCaptureAmount(doc.RootElement, out var capturedAmount, out var currency) ||
                    currency != "MXN" || capturedAmount != order.Total)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("El importe capturado por PayPal no coincide con la orden {OrderId}.", order.Id);
                    return Conflict(new { mensaje = "El importe confirmado por PayPal no coincide con el total de la orden." });
                }

                if (!await MarkOrderPaidAsync(order))
                {
                    await transaction.RollbackAsync();
                    _logger.LogError("El pago de PayPal se completó, pero no se pudo descontar el inventario de la orden {OrderId}.", order.Id);
                    return Conflict(new { mensaje = "El pago se completó, pero el inventario cambió. Contacta a soporte." });
                }
                await transaction.CommitAsync();
                return Ok(new { success = true, status });
            }

            await transaction.RollbackAsync();
            return BadRequest(new { mensaje = "El pago no se completó correctamente.", status });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error al capturar una orden de PayPal.");
            return StatusCode(500, new { mensaje = "Error interno del servidor en capture-order" });
        }
    }

    [HttpPost("webhook/paypal")]
    [HttpPost("~/api/ordenes/webhook/paypal")]
    [AllowAnonymous]
    public async Task<IActionResult> RecibirWebhookPayPal([FromBody] JsonElement webhookEvent)
    {
        var webhookId = _configuration["PayPalSettings:WebhookId"];
        if (string.IsNullOrWhiteSpace(webhookId))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { mensaje = "La verificación del webhook de PayPal no está configurada." });

        var transmissionId = Request.Headers["PAYPAL-TRANSMISSION-ID"].FirstOrDefault();
        var transmissionTime = Request.Headers["PAYPAL-TRANSMISSION-TIME"].FirstOrDefault();
        var transmissionSignature = Request.Headers["PAYPAL-TRANSMISSION-SIG"].FirstOrDefault();
        var certUrl = Request.Headers["PAYPAL-CERT-URL"].FirstOrDefault();
        var authAlgorithm = Request.Headers["PAYPAL-AUTH-ALGO"].FirstOrDefault();

        if (new[] { transmissionId, transmissionTime, transmissionSignature, certUrl, authAlgorithm }.Any(string.IsNullOrWhiteSpace))
            return BadRequest(new { mensaje = "Faltan encabezados para verificar la firma del webhook." });

        try
        {
            var accessToken = await GetAccessTokenAsync();
            var verifyRequest = new
            {
                auth_algo = authAlgorithm,
                cert_url = certUrl,
                transmission_id = transmissionId,
                transmission_sig = transmissionSignature,
                transmission_time = transmissionTime,
                webhook_id = webhookId,
                webhook_event = webhookEvent
            };
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{GetPayPalBaseUrl()}/v1/notifications/verify-webhook-signature");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(JsonSerializer.Serialize(verifyRequest), Encoding.UTF8, "application/json");
            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("PayPal no pudo verificar la firma de un webhook.");
                return StatusCode(StatusCodes.Status502BadGateway, new { mensaje = "No se pudo verificar el webhook con PayPal." });
            }

            using var verification = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (verification.RootElement.GetProperty("verification_status").GetString() != "SUCCESS")
                return Unauthorized(new { mensaje = "La firma del webhook no es válida." });

            if (!webhookEvent.TryGetProperty("event_type", out var eventType) ||
                eventType.GetString() != "PAYMENT.CAPTURE.COMPLETED")
                return Ok();

            var resource = webhookEvent.GetProperty("resource");
            var orderId = resource.GetProperty("supplementary_data")
                .GetProperty("related_ids").GetProperty("order_id").GetString();
            if (string.IsNullOrWhiteSpace(orderId) ||
                !TryGetCompletedCaptureAmount(resource, out var capturedAmount, out var currency) ||
                currency != "MXN")
                return BadRequest(new { mensaje = "El evento de pago no contiene una captura válida." });

            var order = await _context.Ordenes.AsNoTracking()
                .FirstOrDefaultAsync(o => o.PayPalOrderId == orderId);
            if (order == null)
                return Ok();
            if (capturedAmount != order.Total)
            {
                _logger.LogError("La captura del webhook PayPal no coincide con la orden {OrderId}.", order.Id);
                return Conflict(new { mensaje = "El importe capturado no coincide con el total de la orden." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            if (!await MarkOrderPaidAsync(order))
            {
                await transaction.RollbackAsync();
                _logger.LogError("Pago recibido por webhook, pero no se pudo descontar el inventario de la orden {OrderId}.", order.Id);
                return Conflict(new { mensaje = "No se pudo actualizar el inventario de la orden." });
            }
            await transaction.CommitAsync();
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando un webhook de PayPal.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { mensaje = "Error al procesar el webhook." });
        }
    }

    private string GetPayPalBaseUrl() =>
        string.Equals(_configuration["PayPalSettings:Mode"], "Live", StringComparison.OrdinalIgnoreCase)
            ? "https://api-m.paypal.com"
            : "https://api-m.sandbox.paypal.com";

    private static bool TryGetCompletedCaptureAmount(JsonElement root, out decimal amount, out string currency)
    {
        amount = 0;
        currency = string.Empty;
        try
        {
            var capture = root.TryGetProperty("purchase_units", out var purchaseUnits)
                ? purchaseUnits[0].GetProperty("payments").GetProperty("captures")[0]
                : root;
            var amountElement = capture.GetProperty("amount");
            currency = amountElement.GetProperty("currency_code").GetString() ?? string.Empty;
            return capture.GetProperty("status").GetString() == "COMPLETED" &&
                   decimal.TryParse(amountElement.GetProperty("value").GetString(),
                       NumberStyles.Number, CultureInfo.InvariantCulture, out amount);
        }
        catch (Exception ex) when (ex is KeyNotFoundException or InvalidOperationException or IndexOutOfRangeException or ArgumentOutOfRangeException)
        {
            return false;
        }
    }

    private async Task<bool> MarkOrderPaidAsync(Orden order)
    {
        var details = await _context.OrdenesDetalles
            .Where(detail => detail.OrdenId == order.Id)
            .AsNoTracking()
            .ToListAsync();
        if (details.Count == 0)
            return false;

        var ahoraUtc = DateTime.UtcNow;
        var transitioned = await _context.Ordenes
            .Where(o => o.Id == order.Id && o.EstadoOrden != "Pagado" &&
                (o.EstadoOrden == "Pendiente" ||
                 o.EstadoOrden == "Pendiente Pago PayPal" ||
                 o.EstadoOrden == "Procesando Pago PayPal" ||
                 (o.EstadoOrden == "Pago no completado" && !o.InventarioReservaExpiraUtc.HasValue)) &&
                ((!o.InventarioReservaExpiraUtc.HasValue && o.FechaOrden > ahoraUtc.AddHours(-24)) ||
                 (o.InventarioReservado && o.InventarioReservaExpiraUtc > ahoraUtc)))
            .ExecuteUpdateAsync(updates => updates
                .SetProperty(o => o.EstadoOrden, "Pagado")
                .SetProperty(o => o.InventarioReservado, false));
        if (transitioned == 0)
            return await _context.Ordenes.AnyAsync(o => o.Id == order.Id &&
                (o.EstadoOrden == "Pagado" || o.EstadoOrden == "En preparación" ||
                 o.EstadoOrden == "Enviado" || o.EstadoOrden == "Entregado"));

        if (order.InventarioReservado)
            return true;

        foreach (var detail in details)
        {
            var stockUpdated = await _context.Productos
                .Where(product => product.ProductoId == detail.ProductoId && product.Stock >= detail.Cantidad)
                .ExecuteUpdateAsync(updates => updates.SetProperty(product => product.Stock, product => product.Stock - detail.Cantidad));
            if (stockUpdated != 1)
                return false;
        }
        return await _context.Ordenes.AnyAsync(o => o.Id == order.Id && o.EstadoOrden == "Pagado");
    }
}