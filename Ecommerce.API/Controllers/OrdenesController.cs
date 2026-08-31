using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdenesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrdenesController> _logger;

        public OrdenesController(ApplicationDbContext context, ILogger<OrdenesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("paypal")]
        public async Task<IActionResult> CreateOrderPayPal([FromBody] CheckoutDto solicitud)
        {
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
                {
                    return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
                }

                int direccionEnvioId = solicitud.DireccionEnvioId;

                if (direccionEnvioId <= 0 && !string.IsNullOrEmpty(solicitud.Calle))
                {
                    var nuevaDireccion = new DireccionEnvio
                    {
                        UsuarioId = usuarioId,
                        Calle = solicitud.Calle ?? string.Empty,
                        NumeroExterior = solicitud.NumeroExterior ?? string.Empty,
                        NumeroInterior = solicitud.NumeroInterior,
                        Colonia = solicitud.Colonia ?? string.Empty,
                        Ciudad = solicitud.Ciudad ?? string.Empty,
                        Estado = solicitud.Estado ?? string.Empty,
                        CodigoPostal = solicitud.CodigoPostal ?? string.Empty,
                        TelefonoContacto = solicitud.TelefonoContacto ?? string.Empty
                    };

                    _context.DireccionesEnvio.Add(nuevaDireccion);
                    await _context.SaveChangesAsync();
                    direccionEnvioId = nuevaDireccion.Id;
                }

                var direccion = await _context.DireccionesEnvio.FindAsync(direccionEnvioId);
                if (direccion == null)
                {
                    return BadRequest(new { mensaje = "Dirección inválida o incompleta." });
                }

                var zona = await _context.ZonasEnvio.FirstOrDefaultAsync(z => z.Estado.ToLower() == direccion.Estado.ToLower());
                decimal costoFlete = zona?.CostoFlete ?? 450.00m;

                decimal subtotal = 0;
                var detallesOrden = new List<OrdenDetalle>();

                foreach (var item in solicitud.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.ProductoId);
                    if (producto == null) return BadRequest(new { mensaje = $"El producto con ID {item.ProductoId} no existe." });

                    bool esBajoPedido = producto.Stock <= 0;
                    producto.Stock -= item.Cantidad;

                    subtotal += producto.PrecioPublico * item.Cantidad;
                    detallesOrden.Add(new OrdenDetalle
                    {
                        ProductoId = producto.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = producto.PrecioPublico,
                        EsBajoPedido = esBajoPedido
                    });
                }

                decimal iva = subtotal * 0.16m;
                decimal totalDefinitivo = subtotal + iva + costoFlete;

                var nuevaOrden = new Orden
                {
                    UsuarioId = usuarioId,
                    DireccionEnvioId = direccionEnvioId,
                    Subtotal = subtotal,
                    Iva = iva,
                    CostoFlete = costoFlete,
                    Total = totalDefinitivo,
                    EstadoOrden = "Pendiente Pago PayPal",
                    MetodoPago = "PayPal",
                    FechaOrden = DateTime.UtcNow
                };

                _context.Ordenes.Add(nuevaOrden);
                await _context.SaveChangesAsync();

                foreach (var detalle in detallesOrden)
                {
                    detalle.OrdenId = nuevaOrden.Id;
                    _context.OrdenesDetalles.Add(detalle);
                }
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Orden creada para PayPal exitosamente",
                    ordenId = nuevaOrden.Id,
                    total = totalDefinitivo
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al procesar orden PayPal", error = ex.Message });
            }
        }

        [HttpPost("paypal/capturar/{ordenId}")]
        public async Task<IActionResult> CapturarPayPal(int ordenId, [FromBody] PaypalCaptureDto dto)
        {
            var orden = await _context.Ordenes.FindAsync(ordenId);
            if (orden == null) return NotFound(new { mensaje = "Orden no encontrada." });

            orden.EstadoOrden = "Pagado";
            orden.PayPalOrderId = dto.PayPalOrderId;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Pago con PayPal registrado y completado con éxito." });
        }

        [HttpPost("webhook/paypal")]
        [AllowAnonymous]
        public async Task<IActionResult> RecibirWebhookPayPal([FromBody] PayPalWebhookPayload payload)
        {
            try
            {
                if (payload?.EventType == "PAYMENT.CAPTURE.COMPLETED" || payload?.EventType == "CHECKOUT.ORDER.APPROVED")
                {
                    string paypalOrderId = payload.Resource?.Id ?? string.Empty;
                    var orden = await _context.Ordenes.FirstOrDefaultAsync(o => o.PayPalOrderId == paypalOrderId);

                    if (orden != null && orden.EstadoOrden != "Pagado")
                    {
                        orden.EstadoOrden = "Pagado";
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error procesando webhook de PayPal: {ex.Message}");
                return StatusCode(500);
            }
        }
    }
}