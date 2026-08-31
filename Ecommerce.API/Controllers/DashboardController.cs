using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Ecommerce.API.DTOs; // Asegúrate de importar tu carpeta DTOs
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
            var inicioMes = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);

            // Obtenemos los valores de forma eficiente
            var totalUsuarios = await _context.Usuarios.CountAsync();
            var totalProductos = await _context.Productos.CountAsync();
            var stockBajo = await _context.Productos.CountAsync(p => p.Stock < 5);

            // Calculamos ventas del mes si la tabla Pedidos existe
            var ventasDelMes = await _context.Pedidos
                .Where(p => p.Fecha >= inicioMes)
                .SumAsync(p => p.Total);

            // Retornamos el DTO
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