using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Net;
using System.Net.Mail;
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
        private static readonly TimeSpan PaymentConfirmationWindow = TimeSpan.FromHours(24);

        private readonly ApplicationDbContext _context;
        private readonly ILogger<OrdenesController> _logger;
        private readonly IConfiguration _configuration;

        public OrdenesController(
            ApplicationDbContext context,
            ILogger<OrdenesController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("mis-compras")]
        public async Task<IActionResult> GetMisCompras()
        {
            try
            {
                var userIdClaim = User.FindFirstValue("sub");
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
                {
                    return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
                }

                await MarcarPagosPayPalNoConfirmadosAsync(usuarioId);
                var ordenes = await _context.Ordenes
                    .Where(o => o.UsuarioId == usuarioId)
                    .OrderByDescending(o => o.FechaOrden)
                    .ToListAsync();

                var ordenesIds = ordenes.Select(o => o.Id).ToList();
                var direccionIds = ordenes.Select(o => o.DireccionEnvioId).Distinct().ToList();

                var detalles = await _context.OrdenesDetalles
                    .Where(d => ordenesIds.Contains(d.OrdenId))
                    .ToListAsync();

                var productoIds = detalles.Select(d => d.ProductoId).Distinct().ToList();
                var productos = await _context.Productos
                    .Where(p => productoIds.Contains(p.ProductoId))
                    .ToDictionaryAsync(p => p.ProductoId);

                var direcciones = await _context.DireccionesEnvio
                    .Where(d => direccionIds.Contains(d.Id))
                    .ToDictionaryAsync(d => d.Id);

                var usuario = await _context.Usuarios.FindAsync(usuarioId);

                var resultado = ordenes.Select(o =>
                {
                    direcciones.TryGetValue(o.DireccionEnvioId, out var dir);

                    string direccionTexto = "N/A";
                    if (dir != null)
                    {
                        var ext = string.IsNullOrEmpty(dir.NumeroExterior) ? "" : $" #{dir.NumeroExterior}";
                        var intNum = string.IsNullOrEmpty(dir.NumeroInterior) ? "" : $" Int. {dir.NumeroInterior}";
                        direccionTexto = $"{dir.Calle}{ext}{intNum}, Col. {dir.Colonia}, {dir.Ciudad}, {dir.Estado}, C.P. {dir.CodigoPostal}";
                    }

                    return new
                    {
                        o.Id,
                        o.UsuarioId,
                        o.DireccionEnvioId,
                        o.Subtotal,
                        o.Iva,
                        o.CostoFlete,
                        o.Total,
                        o.EstadoOrden,
                        o.MetodoPago,
                        o.FechaOrden,
                        o.PayPalOrderId,
                        o.Paqueteria,
                        o.NumeroGuia,
                        usuario = usuario == null ? null : new
                        {
                            Nombre = usuario.Nombre ?? "",
                            Email = usuario.Email ?? "",
                            Telefono = usuario.Telefono ?? "",
                            Direccion = direccionTexto
                        },
                        nombreCliente = usuario?.Nombre ?? "N/A",
                        correoCliente = usuario?.Email ?? "N/A",
                        telefonoCliente = usuario?.Telefono ?? "N/A",
                        direccionEnvio = direccionTexto,
                        OrdenesDetalles = detalles.Where(d => d.OrdenId == o.Id).Select(d =>
                        {
                            productos.TryGetValue(d.ProductoId, out var prod);
                            return new
                            {
                                d.Id,
                                d.OrdenId,
                                d.ProductoId,
                                d.Cantidad,
                                d.PrecioUnitario,
                                d.EsBajoPedido,
                                producto = prod == null ? null : new
                                {
                                    nombre = prod.Nombre,
                                    sku = prod.SKU,
                                    descripcion = prod.Descripcion,
                                    categoria = prod.Categoria,
                                    imagen = string.Empty
                                }
                            };
                        }).ToList()
                    };
                });

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener las compras del usuario: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno al obtener el historial de compras." });
            }
        }

        [HttpGet("admin/todas")]
        [Authorize(Roles = "Administrador")] // 🔒 CORREGIDO: Restringido estrictamente al rol de Administrador
        public async Task<IActionResult> GetTodasLasOrdenesAdmin()
        {
            try
            {
                await MarcarPagosPayPalNoConfirmadosAsync();
                var ordenes = await _context.Ordenes
                    .OrderByDescending(o => o.FechaOrden)
                    .ToListAsync();

                var ordenesIds = ordenes.Select(o => o.Id).ToList();
                var usuarioIds = ordenes.Select(o => o.UsuarioId).Distinct().ToList();
                var direccionIds = ordenes.Select(o => o.DireccionEnvioId).Distinct().ToList();

                var detalles = await _context.OrdenesDetalles
                    .Where(d => ordenesIds.Contains(d.OrdenId))
                    .ToListAsync();

                var productoIds = detalles.Select(d => d.ProductoId).Distinct().ToList();
                var productos = await _context.Productos
                    .Where(p => productoIds.Contains(p.ProductoId))
                    .ToDictionaryAsync(p => p.ProductoId);

                var usuarios = await _context.Usuarios
                    .Where(u => usuarioIds.Contains(u.UsuarioId))
                    .ToDictionaryAsync(u => u.UsuarioId);

                var direcciones = await _context.DireccionesEnvio
                    .Where(d => direccionIds.Contains(d.Id))
                    .ToDictionaryAsync(d => d.Id);

                var resultado = ordenes.Select(o =>
                {
                    usuarios.TryGetValue(o.UsuarioId, out var usuario);
                    direcciones.TryGetValue(o.DireccionEnvioId, out var dir);

                    string direccionTexto = "N/A";
                    if (dir != null)
                    {
                        var ext = string.IsNullOrEmpty(dir.NumeroExterior) ? "" : $" #{dir.NumeroExterior}";
                        var intNum = string.IsNullOrEmpty(dir.NumeroInterior) ? "" : $" Int. {dir.NumeroInterior}";
                        direccionTexto = $"{dir.Calle}{ext}{intNum}, Col. {dir.Colonia}, {dir.Ciudad}, {dir.Estado}, C.P. {dir.CodigoPostal}";
                    }

                    return new
                    {
                        o.Id,
                        o.UsuarioId,
                        o.DireccionEnvioId,
                        o.Subtotal,
                        o.Iva,
                        o.CostoFlete,
                        o.Total,
                        o.EstadoOrden,
                        o.MetodoPago,
                        o.FechaOrden,
                        o.PayPalOrderId,
                        o.ReferenciaPago,
                        o.Paqueteria,
                        o.NumeroGuia,
                        usuario = usuario == null ? null : new
                        {
                            Nombre = usuario.Nombre ?? "",
                            Email = usuario.Email ?? "",
                            Telefono = usuario.Telefono ?? "",
                            Direccion = direccionTexto
                        },
                        nombreCliente = usuario?.Nombre ?? "N/A",
                        correoCliente = usuario?.Email ?? "N/A",
                        telefonoCliente = usuario?.Telefono ?? "N/A",
                        direccionEnvio = direccionTexto,
                        OrdenesDetalles = detalles.Where(d => d.OrdenId == o.Id).Select(d =>
                        {
                            productos.TryGetValue(d.ProductoId, out var prod);
                            return new
                            {
                                d.Id,
                                d.OrdenId,
                                d.ProductoId,
                                d.Cantidad,
                                d.PrecioUnitario,
                                d.EsBajoPedido,
                                producto = prod == null ? null : new
                                {
                                    nombre = prod.Nombre,
                                    sku = prod.SKU,
                                    descripcion = prod.Descripcion,
                                    categoria = prod.Categoria,
                                    imagen = string.Empty
                                }
                            };
                        }).ToList()
                    };
                });

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener todas las ordenes para administrador: {ex.Message}");
                return StatusCode(500, new { mensaje = "Error interno al obtener el listado de órdenes." });
            }
        }

        [HttpPut("admin/{id:int}/estado")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarEstadoAdmin(int id, [FromBody] ActualizarEstadoOrdenDto dto)
        {
            var orden = await _context.Ordenes.FindAsync(id);
            if (orden == null)
                return NotFound(new { mensaje = "Orden no encontrada." });

            if (string.IsNullOrWhiteSpace(dto.Estado))
                return BadRequest(new { mensaje = "El estado de la orden es obligatorio." });

            var siguienteEstado = dto.Estado.Trim();
            var transicionValida = (orden.EstadoOrden, siguienteEstado) switch
            {
                ("Pagado", "En preparación") => true,
                ("En preparación", "Enviado") => true,
                ("Enviado", "Entregado") => true,
                _ => false
            };

            if (!transicionValida)
            {
                return Conflict(new
                {
                    mensaje = orden.EstadoOrden is "Pendiente" or "Pendiente Pago PayPal"
                        ? "No se puede avanzar una orden hasta que PayPal confirme el pago."
                        : "La transición de estado solicitada no es válida."
                });
            }

            if (siguienteEstado == "Enviado" &&
                (string.IsNullOrWhiteSpace(dto.Paqueteria) || string.IsNullOrWhiteSpace(dto.NumeroGuia)))
            {
                return BadRequest(new { mensaje = "La paquetería y el número de guía son obligatorios para marcar el pedido como enviado." });
            }

            orden.EstadoOrden = siguienteEstado;
            if (siguienteEstado == "Enviado")
            {
                orden.Paqueteria = dto.Paqueteria!.Trim();
                orden.NumeroGuia = dto.NumeroGuia!.Trim();
            }
            await _context.SaveChangesAsync();

            var notificacionEnviada = true;
            if (siguienteEstado == "Enviado")
            {
                notificacionEnviada = await NotificarEnvioAsync(orden);
            }

            return Ok(new
            {
                mensaje = notificacionEnviada
                    ? "Estado de la orden actualizado."
                    : "El pedido fue marcado como enviado, pero no se pudo enviar el correo de notificación.",
                estadoOrden = orden.EstadoOrden,
                orden.Paqueteria,
                orden.NumeroGuia,
                notificacionEnviada
            });
        }

        private async Task<bool> NotificarEnvioAsync(Orden orden)
        {
            var usuario = await _context.Usuarios
                .Where(u => u.UsuarioId == orden.UsuarioId)
                .Select(u => new { u.Email, u.Nombre })
                .FirstOrDefaultAsync();
            if (usuario == null || string.IsNullOrWhiteSpace(usuario.Email))
            {
                _logger.LogWarning("No se envió la notificación de envío de la orden {OrderId}: el cliente no tiene correo registrado.", orden.Id);
                return false;
            }

            try
            {
                var smtpServer = _configuration["EmailSettings:Server"];
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                var senderName = _configuration["EmailSettings:SenderName"] ?? "CAFRI E-commerce";
                var smtpPassword = _configuration["EmailSettings:Password"];
                if (!int.TryParse(_configuration["EmailSettings:Port"], out var smtpPort) ||
                    string.IsNullOrWhiteSpace(smtpServer) ||
                    string.IsNullOrWhiteSpace(senderEmail) ||
                    string.IsNullOrWhiteSpace(smtpPassword))
                {
                    _logger.LogWarning("No se envió la notificación de envío de la orden {OrderId}: la configuración SMTP está incompleta.", orden.Id);
                    return false;
                }

                using var mensaje = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = $"Tu pedido #{orden.Id} fue enviado",
                    Body = $"Hola {usuario.Nombre},\n\nTu pedido #{orden.Id} ya fue enviado.\n\nPaquetería: {orden.Paqueteria}\nNúmero de guía: {orden.NumeroGuia}\n\nGracias por comprar en CAFRI E-commerce.",
                    IsBodyHtml = false
                };
                mensaje.To.Add(usuario.Email);

                using var clienteSmtp = new SmtpClient(smtpServer, smtpPort)
                {
                    Credentials = new NetworkCredential(senderEmail, smtpPassword),
                    EnableSsl = true
                };
                await clienteSmtp.SendMailAsync(mensaje);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar la notificación de envío de la orden {OrderId}.", orden.Id);
                return false;
            }
        }

        private async Task MarcarPagosPayPalNoConfirmadosAsync(int? usuarioId = null)
        {
            var limiteConfirmacion = DateTime.UtcNow.Subtract(PaymentConfirmationWindow);
            var ordenesExpiradas = _context.Ordenes.Where(orden =>
                orden.PayPalOrderId != null &&
                orden.FechaOrden <= limiteConfirmacion &&
                (orden.EstadoOrden == "Pendiente" || orden.EstadoOrden == "Pendiente Pago PayPal"));

            if (usuarioId.HasValue)
                ordenesExpiradas = ordenesExpiradas.Where(orden => orden.UsuarioId == usuarioId.Value);

            var cantidadActualizada = await ordenesExpiradas.ExecuteUpdateAsync(updates =>
                updates.SetProperty(orden => orden.EstadoOrden, "Pago no completado"));
            if (cantidadActualizada > 0)
                _logger.LogInformation("Se marcaron {OrderCount} órdenes PayPal como pago no completado.", cantidadActualizada);
        }

        [NonAction]
        [HttpPost("paypal")]
        public async Task<IActionResult> CreateOrderPayPal([FromBody] CheckoutDto solicitud)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var userIdClaim = User.FindFirstValue("sub");
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
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = "Dirección inválida o incompleta." });
                }

                var zona = await _context.ZonasEnvio.FirstOrDefaultAsync(z => z.Estado.ToLower() == direccion.Estado.ToLower());
                decimal costoFlete = zona?.CostoFlete ?? 450.00m;

                decimal subtotal = 0;
                var detallesOrden = new List<OrdenDetalle>();

                foreach (var item in solicitud.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.ProductoId);
                    if (producto == null)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { mensaje = $"El producto con ID {item.ProductoId} no existe." });
                    }

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
                    PayPalOrderId = solicitud.PayPalOrderId,
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

                await transaction.CommitAsync();

                return Ok(new
                {
                    mensaje = "Orden creada para PayPal exitosamente",
                    ordenId = nuevaOrden.Id,
                    total = totalDefinitivo
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { mensaje = "Error interno al procesar orden PayPal", error = ex.Message });
            }
        }

        [NonAction]
        [HttpPost("paypal/capturar/{ordenId}")]
        public async Task<IActionResult> CapturarPayPal(int ordenId, [FromBody] PaypalCaptureDto dto)
        {
            var userIdClaim = User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
            }

            var orden = await _context.Ordenes.FindAsync(ordenId);
            if (orden == null) return NotFound(new { mensaje = "Orden no encontrada." });

            // 🔒 CORREGIDO: Evitar vulnerabilidad IDOR validando propiedad o rol de administrador
            var esAdmin = User.IsInRole("Administrador");
            if (orden.UsuarioId != usuarioId && !esAdmin)
            {
                return Forbid();
            }

            orden.EstadoOrden = "Pagado";
            orden.PayPalOrderId = dto.PayPalOrderId ?? orden.PayPalOrderId;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Pago con PayPal registrado y completado con éxito." });
        }

        [NonAction]
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