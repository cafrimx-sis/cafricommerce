using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador,Cajero")]
    public class VentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VentasController> _logger;

        public VentasController(ApplicationDbContext context, ILogger<VentasController> logger)
        {
            _context = context;
            _logger = logger;
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
            if (ventaDto.DescuentoPorcentaje < 0 || ventaDto.DescuentoPorcentaje > 100)
                return BadRequest(new { mensaje = "El descuento debe estar entre 0 y 100 por ciento." });
            if (ventaDto.MetodoPago is not ("Efectivo" or "Tarjeta" or "Transferencia"))
                return BadRequest(new { mensaje = "El método de pago no es válido." });
            if (ventaDto.Items.Any(item => item.ProductoId <= 0 || item.Cantidad <= 0 || item.Cantidad > 1000))
                return BadRequest(new { mensaje = "Cada producto debe tener un identificador y una cantidad válida." });

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var productosIds = ventaDto.Items.Select(item => item.ProductoId).Distinct().ToArray();
                var productos = await _context.Productos
                    .Where(producto => productosIds.Contains(producto.ProductoId))
                    .AsNoTracking()
                    .ToDictionaryAsync(producto => producto.ProductoId);

                var faltante = productosIds.FirstOrDefault(productoId => !productos.ContainsKey(productoId));
                if (faltante != 0)
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { mensaje = $"Producto con ID {faltante} no encontrado." });
                }

                decimal subtotal = 0;
                foreach (var item in ventaDto.Items)
                {
                    var producto = productos[item.ProductoId];
                    if (producto.PrecioPublico <= 0)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { mensaje = $"El precio del producto {producto.Nombre} no es válido." });
                    }
                    subtotal += producto.PrecioPublico * item.Cantidad;
                }

                var total = decimal.Round(subtotal * (1 - ventaDto.DescuentoPorcentaje / 100m), 2, MidpointRounding.AwayFromZero);
                if (total <= 0)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { mensaje = "El total de la venta debe ser mayor a cero." });
                }

                var nuevaVenta = new Venta
                {
                    FechaCreacion = DateTime.UtcNow,
                    Total = total,
                    MetodoPago = ventaDto.MetodoPago,
                    Cliente = string.IsNullOrWhiteSpace(ventaDto.Cliente) ? "Público General" : ventaDto.Cliente
                };

                _context.Ventas.Add(nuevaVenta);
                await _context.SaveChangesAsync();

                foreach (var item in ventaDto.Items)
                {
                    var producto = productos[item.ProductoId];
                    var stockActualizado = await _context.Productos
                        .Where(p => p.ProductoId == item.ProductoId && p.Stock >= item.Cantidad)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.Stock, p => p.Stock - item.Cantidad));
                    if (stockActualizado == 0)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { mensaje = $"Stock insuficiente para: {producto.Nombre}." });
                    }

                    var detalle = new DetalleVenta
                    {
                        VentaId = nuevaVenta.VentaId,
                        ProductoId = item.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = producto.PrecioPublico
                    };

                    _context.Set<DetalleVenta>().Add(detalle);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { mensaje = "Venta registrada con éxito", ventaId = nuevaVenta.VentaId, total });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error al procesar una venta del punto de venta.");
                return StatusCode(500, new { mensaje = "Error interno al procesar la venta." });
            }
        }
    }
}