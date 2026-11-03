using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;
using Ecommerce.API.Services;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FacturacionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FacturacionController> _logger;
        private readonly ResendEmailSender _emailSender;

        public FacturacionController(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<FacturacionController> logger,
            ResendEmailSender emailSender)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _emailSender = emailSender;
        }

        // POST: api/facturacion/solicitar
        [HttpPost("solicitar")]
        public async Task<IActionResult> SolicitarFactura([FromBody] SolicitudFacturaDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var solicitud = new SolicitudFactura
            {
                NumeroOrdenOid = dto.FolioVenta,
                FechaTicket = dto.FechaTicket,
                Importe = dto.Importe,
                Rfc = dto.Rfc.ToUpper(),
                RazonSocial = dto.RazonSocial,
                CodigoPostalFiscal = dto.CodigoPostalFiscal,
                RegimenFiscal = dto.RegimenFiscal,
                FormaPago = dto.FormaPago,
                UsoCfdi = dto.UsoCfdi,
                Correo = dto.Correo,
                Celular = dto.Celular,
                Observaciones = dto.Observaciones,
                Estatus = "Pendiente",
                FechaSolicitud = DateTime.UtcNow
            };

            _context.SolicitudesFacturacion.Add(solicitud);
            await _context.SaveChangesAsync();

            // Notificación por correo (opcional)
            try
            {
                await EnviarCorreoNotificacionAsync(solicitud, HttpContext.RequestAborted);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar correo de notificación de facturación {SolicitudId}.", solicitud.Id);
            }

            return Ok(new { mensaje = "Solicitud de factura registrada con éxito.", id = solicitud.Id });
        }

        // GET: api/facturacion/pendientes
        [HttpGet("pendientes")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<IEnumerable<SolicitudFactura>>> GetSolicitudes()
        {
            var solicitudes = await _context.SolicitudesFacturacion
                .OrderByDescending(s => s.FechaSolicitud)
                .ToListAsync();

            return Ok(solicitudes);
        }

        // PUT: api/facturacion/estatus/{id}
        [HttpPut("estatus/{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarEstatus(int id, [FromBody] string nuevoEstatus)
        {
            var estatusPermitidos = new[] { "Pendiente", "Facturada", "Rechazada" };
            if (string.IsNullOrWhiteSpace(nuevoEstatus) || !estatusPermitidos.Contains(nuevoEstatus))
                return BadRequest(new { mensaje = "El estatus debe ser Pendiente, Facturada o Rechazada." });

            var solicitud = await _context.SolicitudesFacturacion.FindAsync(id);
            if (solicitud == null)
                return NotFound(new { mensaje = "Solicitud no encontrada." });

            solicitud.Estatus = nuevoEstatus;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Estatus actualizado correctamente." });
        }

        private async Task EnviarCorreoNotificacionAsync(SolicitudFactura s, CancellationToken cancellationToken)
        {
            var correoDestino = _configuration["EmailSettings:AccountingEmail"] ?? s.Correo;
            var textoCorreo = $"Se ha recibido una nueva solicitud de CFDI 4.0:\n\n" +
                       $"• Folio / Ticket: {s.NumeroOrdenOid}\n" +
                       $"• Fecha Ticket: {s.FechaTicket}\n" +
                       $"• Importe: ${s.Importe:N2} MXN\n" +
                       $"• Razón Social: {s.RazonSocial}\n" +
                       $"• RFC: {s.Rfc}\n" +
                       $"• C.P. Fiscal: {s.CodigoPostalFiscal}\n" +
                       $"• Régimen Fiscal: {s.RegimenFiscal}\n" +
                       $"• Forma de Pago: {s.FormaPago}\n" +
                       $"• Uso CFDI: {s.UsoCfdi}\n" +
                       $"• Correo: {s.Correo}\n" +
                       $"• Celular: {s.Celular}\n" +
                       (!string.IsNullOrEmpty(s.Observaciones) ? $"• Observaciones: {s.Observaciones}\n" : "") +
                       $"\nPuedes revisar y gestionar esta solicitud desde el panel de administración.";

            await _emailSender.SendAsync(
                correoDestino,
                $"Nueva Solicitud de Factura - RFC: {s.Rfc} - Ticket: {s.NumeroOrdenOid}",
                textoCorreo,
                cancellationToken: cancellationToken);
        }
    }
}