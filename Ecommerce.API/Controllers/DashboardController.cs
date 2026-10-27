using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Ecommerce.API.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<DashboardResumenDto>> GetResumen()
        {
            // Fecha de inicio del mes actual para calcular ventas
            var ahoraUtc = DateTime.UtcNow;
            var inicioMes = new DateTime(ahoraUtc.Year, ahoraUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            // Obtenemos los valores de forma eficiente
            var totalUsuarios = await _context.Usuarios.CountAsync();
            var totalProductos = await _context.Productos.CountAsync();
            var stockBajo = await _context.Productos.CountAsync(p => p.Stock < 5);

            var estadosPagados = new[] { "Pagado", "En preparación", "Enviado", "Entregado" };
            var ventasDelMes = await _context.Ordenes
                .Where(p => p.FechaOrden >= inicioMes && estadosPagados.Contains(p.EstadoOrden))
                .SumAsync(p => p.Total);

            // Retornamos el DTO con la información consolidada[cite: 34]
            return Ok(new DashboardResumenDto
            {
                TotalUsuarios = totalUsuarios,
                TotalProductos = totalProductos,
                StockBajo = stockBajo,
                VentasDelMes = ventasDelMes
            });
        }
    }
}