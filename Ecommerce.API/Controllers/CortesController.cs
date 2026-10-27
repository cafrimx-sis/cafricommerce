using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;
using Ecommerce.API.Entities;
using Ecommerce.API.Data;

namespace Ecommerce.API.Controllers
{
    public class CorteRequestDto
    {
        public decimal FondoInicial { get; set; }
        public decimal EfectivoContado { get; set; }
        public string Observaciones { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador,Cajero")] // 🔒 Blindado: Exige autenticación y roles específicos
    public class CortesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CortesController> _logger;

        public CortesController(ApplicationDbContext context, ILogger<CortesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> RealizarCorte([FromBody] CorteRequestDto dto)
        {
            // 🛡️ Validación defensiva contra montos negativos o manipulación maliciosa
            if (dto.FondoInicial < 0 || dto.EfectivoContado < 0)
            {
                return BadRequest(new { mensaje = "El fondo inicial y el efectivo contado no pueden ser valores negativos." });
            }

            // 🛡️ Uso de transacción obligatoria para operaciones financieras
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var ventasPendientes = await _context.Ventas
                    .Where(v => v.CorteId == null)
                    .ToListAsync();

                if (!ventasPendientes.Any())
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = "No hay ventas pendientes por cortar." });
                }

                decimal totalEfectivoSys = ventasPendientes.Where(v => v.MetodoPago == "Efectivo").Sum(v => v.Total);
                decimal totalTarjeta = ventasPendientes.Where(v => v.MetodoPago == "Tarjeta").Sum(v => v.Total);
                decimal totalTransferencia = ventasPendientes.Where(v => v.MetodoPago == "Transferencia").Sum(v => v.Total);

                decimal efectivoEsperado = totalEfectivoSys + dto.FondoInicial;
                decimal diferencia = dto.EfectivoContado - efectivoEsperado;
                decimal granTotalVentas = ventasPendientes.Sum(v => v.Total);

                var nuevoCorte = new CorteCaja
                {
                    FechaCorte = DateTime.UtcNow,
                    FondoInicial = dto.FondoInicial,
                    TotalEfectivoSistema = totalEfectivoSys,
                    EfectivoContado = dto.EfectivoContado,
                    Diferencia = diferencia,
                    TotalTarjeta = totalTarjeta,
                    TotalTransferencia = totalTransferencia,
                    GranTotal = granTotalVentas,
                    TotalVentas = ventasPendientes.Count,
                    Observaciones = dto.Observaciones ?? string.Empty
                };

                _context.CortesCaja.Add(nuevoCorte);
                await _context.SaveChangesAsync();

                // Asociar las ventas pendientes al nuevo ID de corte
                foreach (var venta in ventasPendientes)
                {
                    venta.CorteId = nuevoCorte.Id;
                }
                await _context.SaveChangesAsync();

                // Confirmar transacción exitosa
                await transaction.CommitAsync();

                return Ok(new { mensaje = "Corte de caja registrado con éxito", corteId = nuevoCorte.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error crítico al procesar el corte de caja.");
                return StatusCode(500, new { mensaje = "Error interno al procesar el corte de caja." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerHistorialCortes()
        {
            try
            {
                // 🚀 Optimización: Se utiliza .Include() para evitar subconsultas inválidas o problemas de rendimiento
                var cortes = await _context.CortesCaja
                    .Include(c => c.Ventas)
                    .OrderByDescending(c => c.FechaCorte)
                    .Select(c => new {
                        id = c.Id,
                        fechaCorte = c.FechaCorte,
                        fondoInicial = c.FondoInicial,
                        totalEfectivoSistema = c.TotalEfectivoSistema,
                        efectivoContado = c.EfectivoContado,
                        diferencia = c.Diferencia,
                        totalTarjeta = c.TotalTarjeta,
                        totalTransferencia = c.TotalTransferencia,
                        granTotal = c.GranTotal,
                        totalVentas = c.TotalVentas,
                        observaciones = c.Observaciones,
                        ventas = c.Ventas.Select(v => new {
                            ventaId = v.VentaId,
                            fechaCreacion = v.FechaCreacion,
                            cliente = v.Cliente,
                            metodoPago = v.MetodoPago,
                            total = v.Total
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(cortes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el historial de cortes.");
                return StatusCode(500, new { mensaje = "Error interno al obtener el historial de cortes." });
            }
        }
    }
}