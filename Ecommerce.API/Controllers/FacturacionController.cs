using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;
using System.Net.Mail;
using System.Net;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FacturacionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public FacturacionController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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
                EnviarCorreoNotificacion(solicitud);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error al enviar correo de notificación: " + ex.Message);
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

        private void EnviarCorreoNotificacion(SolicitudFactura s)
        {
            var smtpServer = _configuration["Smtp:Server"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var smtpUser = _configuration["Smtp:User"] ?? "";
            var smtpPass = _configuration["Smtp:Pass"] ?? "";
            var correoDestino = _configuration["Smtp:AccountingEmail"] ?? s.Correo;

            if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass)) return;

            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(smtpUser, "CAFRI Facturación"),
                Subject = $"Nueva Solicitud de Factura - RFC: {s.Rfc} - Ticket: {s.NumeroOrdenOid}",
                Body = $"Se ha recibido una nueva solicitud de CFDI 4.0:\n\n" +
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
                       $"\nPuedes revisar y gestionar esta solicitud desde el panel de administración.",
                IsBodyHtml = false
            };

            mailMessage.To.Add(correoDestino);
            client.Send(mailMessage);
        }
    }
}