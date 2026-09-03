using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VentasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Endpoint GET para listar ventas (permite filtrar por sinCorte=true o corteId=X)
        [HttpGet]
        public async Task<IActionResult> GetVentas([FromQuery] bool? sinCorte, [FromQuery] int? corteId)
        {
            var query = _context.Ventas
                .Include(v => v.Detalles)
                .ThenInclude(d => d.Producto)
                .AsQueryable();

            if (sinCorte == true)
            {
                query = query.Where(v => v.CorteId == null);
            }
            else if (corteId.HasValue)
            {
                query = query.Where(v => v.CorteId == corteId.Value);
            }

            var ventas = await query
                .OrderByDescending(v => v.FechaCreacion)
                .Select(v => new {
                    ventaId = v.VentaId,
                    fechaCreacion = v.FechaCreacion,
                    total = v.Total,
                    metodoPago = v.MetodoPago,
                    cliente = v.Cliente,
                    corteId = v.CorteId,
                    detalles = v.Detalles.Select(d => new {
                        detalleVentaId = d.DetalleVentaId,
                        cantidad = d.Cantidad,
                        precioUnitario = d.PrecioUnitario,
                        producto = d.Producto != null ? new
                        {
                            productoId = d.Producto.ProductoId,
                            sku = d.Producto.SKU,
                            nombre = d.Producto.Nombre,
                            precioPublico = d.Producto.PrecioPublico
                        } : null
                    })
                })
                .ToListAsync();

            return Ok(ventas);
        }

        // Endpoint POST para registrar una nueva venta desde el POS
        [HttpPost]
        public async Task<IActionResult> RegistrarVenta([FromBody] VentaCreateDto ventaDto)
        {
            if (ventaDto == null || ventaDto.Items == null || !ventaDto.Items.Any())
            {
                return BadRequest(new { mensaje = "El ticket de venta está vacío o los datos son inválidos." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var nuevaVenta = new Venta
                {
                    FechaCreacion = DateTime.Now,
                    Total = ventaDto.Total,
                    MetodoPago = string.IsNullOrWhiteSpace(ventaDto.MetodoPago) ? "Efectivo" : ventaDto.MetodoPago,
                    Cliente = string.IsNullOrWhiteSpace(ventaDto.Cliente) ? "Público General" : ventaDto.Cliente
                };

                _context.Ventas.Add(nuevaVenta);
                await _context.SaveChangesAsync();

                foreach (var item in ventaDto.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.ProductoId);
                    if (producto == null)
                        return NotFound(new { mensaje = $"Producto con ID {item.ProductoId} no encontrado." });

                    if (producto.Stock < item.Cantidad)
                        return BadRequest(new { mensaje = $"Stock insuficiente para: {producto.Nombre}. Disponibles: {producto.Stock}" });

                    producto.Stock -= item.Cantidad;

                    var detalle = new DetalleVenta
                    {
                        VentaId = nuevaVenta.VentaId,
                        ProductoId = item.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = item.PrecioUnitario
                    };

                    _context.Set<DetalleVenta>().Add(detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { mensaje = "Venta registrada con éxito", ventaId = nuevaVenta.VentaId });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { mensaje = $"Error interno al procesar la venta: {ex.Message}" });
            }
        }
    }
}