using Ecommerce.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdenesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdenesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/ordenes/oxxo
        [HttpPost("oxxo")]
        public async Task<IActionResult> CreateOrderOxxo([FromBody] CheckoutDto solicitud)
        {
            return await ProcesarOrden(solicitud, "OXXO");
        }

        // POST: api/ordenes/bbva
        [HttpPost("bbva")]
        public async Task<IActionResult> CreateOrderBbva([FromBody] CheckoutDto solicitud)
        {
            return await ProcesarOrden(solicitud, "BBVA");
        }

        // Método privado compartido para no repetir lógica de cálculo
        private async Task<IActionResult> ProcesarOrden(CheckoutDto solicitud, string metodoPago)
        {
            try
            {
                int direccionEnvioId = solicitud.DireccionEnvioId;

                // Si no viene un ID válido pero sí los datos del formulario, creamos la dirección al vuelo
                if (direccionEnvioId <= 0 && !string.IsNullOrEmpty(solicitud.Calle))
                {
                    var nuevaDireccion = new DireccionEnvio
                    {
                        UsuarioId = solicitud.UsuarioId,
                        Calle = solicitud.Calle,
                        NumeroExterior = solicitud.NumeroExterior,
                        NumeroInterior = solicitud.NumeroInterior,
                        Colonia = solicitud.Colonia,
                        Ciudad = solicitud.Ciudad,
                        Estado = solicitud.Estado,
                        CodigoPostal = solicitud.CodigoPostal,
                        TelefonoContacto = solicitud.TelefonoContacto
                    };

                    _context.DireccionesEnvio.Add(nuevaDireccion);
                    await _context.SaveChangesAsync();
                    direccionEnvioId = nuevaDireccion.Id;
                }

                var direccion = await _context.DireccionesEnvio.FindAsync(direccionEnvioId);
                if (direccion == null) return BadRequest(new { mensaje = "Dirección inválida o incompleta." });

                var zona = await _context.ZonasEnvio.FirstOrDefaultAsync(z => z.Estado.ToLower() == direccion.Estado.ToLower());
                decimal costoFlete = zona?.CostoFlete ?? 450.00m;

                decimal subtotal = 0;
                var detallesOrden = new List<OrdenDetalle>();

                foreach (var item in solicitud.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.ProductoId);
                    if (producto == null) return BadRequest(new { mensaje = $"Producto {item.ProductoId} no existe." });

                    subtotal += producto.PrecioPublico * item.Cantidad;
                    detallesOrden.Add(new OrdenDetalle
                    {
                        ProductoId = producto.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = producto.PrecioPublico,
                        EsBajoPedido = producto.Stock <= 0
                    });
                }

                decimal iva = subtotal * 0.16m;
                decimal totalDefinitivo = subtotal + iva + costoFlete;

                string referenciaPago = metodoPago == "OXXO"
                    ? "OXXO-" + new Random().Next(10000000, 99999999)
                    : "BBVA-" + new Random().Next(100000000, 999999999);

                var nuevaOrden = new Orden
                {
                    UsuarioId = solicitud.UsuarioId,
                    DireccionEnvioId = direccionEnvioId,
                    Subtotal = subtotal,
                    Iva = iva,
                    CostoFlete = costoFlete,
                    Total = totalDefinitivo,
                    EstadoOrden = $"Esperando Pago {metodoPago}",
                    ReferenciaPago = referenciaPago,
                    MetodoPago = metodoPago
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
                    mensaje = $"Orden {metodoPago} creada exitosamente",
                    referencia = referenciaPago,
                    convenio = metodoPago == "BBVA" ? "1234567" : null,
                    clabe = metodoPago == "BBVA" ? "012180001234567890" : null,
                    ordenId = nuevaOrden.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", error = ex.Message });
            }
        }
    }

    public class CheckoutDto
    {
        public int UsuarioId { get; set; }
        public int DireccionEnvioId { get; set; } = 0;

        // Campos para registrar la dirección si no se pasa un ID existente
        public string? Calle { get; set; }
        public string? NumeroExterior { get; set; }
        public string? NumeroInterior { get; set; }
        public string? Colonia { get; set; }
        public string? Ciudad { get; set; }
        public string? Estado { get; set; }
        public string? CodigoPostal { get; set; }
        public string? TelefonoContacto { get; set; }

        public List<CartItemDto> Items { get; set; } = new();
    }

    public class CartItemDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
    }
}