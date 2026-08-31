using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public class CortesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CortesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> RealizarCorte([FromBody] CorteRequestDto dto)
        {
            var ventasPendientes = await _context.Ventas
                .Where(v => v.CorteId == null)
                .ToListAsync();

            if (!ventasPendientes.Any())
            {
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
                FechaCorte = DateTime.Now,
                FondoInicial = dto.FondoInicial,
                TotalEfectivoSistema = totalEfectivoSys,
                EfectivoContado = dto.EfectivoContado,
                Diferencia = diferencia,
                TotalTarjeta = totalTarjeta,
                TotalTransferencia = totalTransferencia,
                GranTotal = granTotalVentas,
                TotalVentas = ventasPendientes.Count,
                Observaciones = dto.Observaciones
            };

            _context.CortesCaja.Add(nuevoCorte);
            await _context.SaveChangesAsync();

            foreach (var venta in ventasPendientes)
            {
                venta.CorteId = nuevoCorte.Id;
            }
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Corte de caja registrado con éxito", corteId = nuevoCorte.Id });
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerHistorialCortes()
        {
            var cortes = await _context.CortesCaja
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
                    // Búsqueda explícita de ventas por ID para evitar fallos de mapeo en EF Core
                    ventas = _context.Ventas
                        .Where(v => v.CorteId == c.Id)
                        .Select(v => new {
                            ventaId = v.VentaId,
                            fechaCreacion = v.FechaCreacion,
                            cliente = v.Cliente,
                            metodoPago = v.MetodoPago,
                            total = v.Total
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(cortes);
        }
    }
}