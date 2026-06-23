using Ecommerce.API.Entities; // Asegúrate de apuntar a tus entidades
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Para incluir consultas a la DB
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Ecommerce.API.Data;


namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaypalController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context; // 👈 Inyectamos la Base de Datos

        public PaypalController(IHttpClientFactory httpClientFactory, IConfiguration configuration, ApplicationDbContext context)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _context = context;
        }

        /// <summary>
        /// 1. ENDPOINT: Crear Orden interna y registrarla en PayPal
        /// </summary>
        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CheckoutDto solicitud)
        {
            try
            {
                // A. Validar la dirección de envío del cliente
                var direccion = await _context.DireccionesEnvio.FindAsync(solicitud.DireccionEnvioId);
                if (direccion == null) return BadRequest(new { mensaje = "La dirección de envío no es válida." });

                // B. Calcular el costo del flete buscando la Zona de Envío por el Estado
                var zona = await _context.ZonasEnvio.FirstOrDefaultAsync(z => z.Estado.ToLower() == direccion.Estado.ToLower());
                decimal costoFlete = zona?.CostoFlete ?? 450.00m; // Tarifa base si no encuentra el estado

                // C. Calcular los costos reales consultando los productos en la Base de Datos (Seguridad)
                decimal subtotal = 0;
                var detallesOrden = new List<OrdenDetalle>();

                foreach (var item in solicitud.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.ProductoId);
                    if (producto == null) return BadRequest(new { mensaje = $"El producto con ID {item.ProductoId} no existe." });

                    decimal precioHistorico = producto.PrecioPublico;
                    // TODO: Aquí puedes aplicar tu regla de "Costo beneficio a técnicos/mayoristas por volumen" si item.Cantidad > X

                    subtotal += precioHistorico * item.Cantidad;

                    detallesOrden.Add(new OrdenDetalle
                    {
                        ProductoId = producto.ProductoId,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = precioHistorico,
                        EsBajoPedido = producto.Stock <= 0 // Si no hay stock físico, nace marcado "Bajo Pedido"
                    });
                }

                // D. Desglose del 16% de IVA sobre el subtotal de los equipos/refacciones
                decimal iva = subtotal * 0.16m;
                decimal totalDefinitivo = subtotal + iva + costoFlete;

                // E. Comunicarse con PayPal para registrar la orden con el monto real verificado
                var token = await GetPayPalAccessTokenAsync();
                var client = _httpClientFactory.CreateClient("PayPalClient");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var orderRequest = new
                {
                    intent = "CAPTURE",
                    purchase_units = new[]
                    {
                        new
                        {
                            amount = new
                            {
                                currency_code = "MXN",
                                value = totalDefinitivo.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
                            },
                            description = "Compra de Equipos y Refacciones HVACR - CAFRI"
                        }
                    },
                    application_context = new
                    {
                        brand_name = "CAFRI E-commerce",
                        landing_page = "LOGIN",
                        user_action = "PAY_NOW",
                        return_url = "http://localhost:5173/pago-exitoso",
                        cancel_url = "http://localhost:5173/pago-cancelado"
                    }
                };

                var jsonBody = JsonSerializer.Serialize(orderRequest);
                var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
                var response = await client.PostAsync("/v2/checkout/orders", content);

                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest(new { mensaje = "Error al conectar con los servidores de PayPal" });
                }

                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);
                var paypalOrderId = doc.RootElement.GetProperty("id").GetString();

                string approveUrl = string.Empty;
                foreach (var link in doc.RootElement.GetProperty("links").EnumerateArray())
                {
                    if (link.GetProperty("rel").GetString() == "approve")
                    {
                        approveUrl = link.GetProperty("href").GetString() ?? string.Empty;
                        break;
                    }
                }

                // F. Guardar la Orden en nuestra Base de Datos en estado "Pendiente" antes de cobrar
                var nuevaOrden = new Orden
                {
                    UsuarioId = solicitud.UsuarioId,
                    DireccionEnvioId = solicitud.DireccionEnvioId,
                    Subtotal = subtotal,
                    Iva = iva,
                    CostoFlete = costoFlete,
                    Total = totalDefinitivo,
                    EstadoOrden = "Pendiente",
                    PayPalOrderId = paypalOrderId
                };

                _context.Ordenes.Add(nuevaOrden);
                await _context.SaveChangesAsync(); // Genera el Id de la Orden

                // Asignar el OrdenId correspondiente a los detalles y guardarlos
                foreach (var detalle in detallesOrden)
                {
                    detalle.OrdenId = nuevaOrden.Id;
                    _context.OrdenesDetalles.Add(detalle);
                }
                await _context.SaveChangesAsync();

                return Ok(new { orderId = paypalOrderId, approveUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", error = ex.Message });
            }
        }

        /// <summary>
        /// 2. ENDPOINT: Capturar el dinero y ajustar el inventario automáticamente
        /// </summary>
        [HttpPost("capture-order/{orderId}")]
        public async Task<IActionResult> CaptureOrder(string orderId)
        {
            try
            {
                // A. Verificar si la orden existe en nuestra Base de Datos
                var ordenInterna = await _context.Ordenes.FirstOrDefaultAsync(o => o.PayPalOrderId == orderId);
                if (ordenInterna == null) return NotFound(new { mensaje = "La orden no fue localizada en el sistema." });

                // B. Solicitar a PayPal la captura de los fondos
                var token = await GetPayPalAccessTokenAsync();
                var client = _httpClientFactory.CreateClient("PayPalClient");
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var content = new StringContent("{}", Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"/v2/checkout/orders/{orderId}/capture", content);

                if (!response.IsSuccessStatusCode) return BadRequest(new { mensaje = "PayPal rechazó la captura de fondos." });

                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);
                var status = doc.RootElement.GetProperty("status").GetString();

                if (status == "COMPLETED")
                {
                    // C. ¡ÉXITO DE PAGO! Cambiar estado de la orden
                    ordenInterna.EstadoOrden = "Pagado";

                    // D. LOGICA DE INVENTARIO: Descontar stock automáticamente
                    var detalles = await _context.OrdenesDetalles.Where(d => d.OrdenId == ordenInterna.Id).ToListAsync();
                    bool contieneBackorder = false;

                    foreach (var detalle in detalles)
                    {
                        var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                        if (producto != null)
                        {
                            // Se resta el stock (puede quedar en números negativos si se vende "Bajo pedido")
                            producto.Stock -= detalle.Cantidad;

                            if (producto.Stock < 0)
                            {
                                detalle.EsBajoPedido = true;
                                contieneBackorder = true;
                            }
                        }
                    }

                    // Si algún producto se quedó sin stock físico, la orden general avisa al Almacenista
                    if (contieneBackorder)
                    {
                        ordenInterna.EstadoOrden = "Bajo Pedido";
                    }

                    await _context.SaveChangesAsync();

                    // TODO: Aquí dispararás en el futuro tu servicio de correos (Liga por Whatsapp)

                    return Ok(new { mensaje = "¡Compra procesada e inventario actualizado!", estado = ordenInterna.EstadoOrden });
                }

                return BadRequest(new { mensaje = "El pago no concluyó en estado COMPLETED.", estado = status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al procesar la captura", error = ex.Message });
            }
        }

        private async Task<string> GetPayPalAccessTokenAsync()
        {
            var client = _httpClientFactory.CreateClient("PayPalClient");
            var clientId = _configuration["PayPal:ClientId"] ?? throw new InvalidOperationException("Falta ClientId.");
            var clientSecret = _configuration["PayPal:ClientSecret"] ?? throw new InvalidOperationException("Falta ClientSecret.");

            var credentialsBytes = Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}");
            var credentialsBase64 = Convert.ToBase64String(credentialsBytes);

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentialsBase64);

            var keyValues = new List<KeyValuePair<string, string>> { new("grant_type", "client_credentials") };
            var requestContent = new FormUrlEncodedContent(keyValues);
            var response = await client.PostAsync("/v1/oauth2/token", requestContent);

            if (!response.IsSuccessStatusCode) throw new Exception("Error de autenticación con PayPal.");

            var jsonResponse = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonResponse);
            return doc.RootElement.GetProperty("access_token").GetString()!;
        }
    }

    // 📦 DTOs limpios y seguros para la comunicación con React
    public class CheckoutDto
    {
        public int UsuarioId { get; set; }
        public int DireccionEnvioId { get; set; }
        public List<CartItemDto> Items { get; set; } = new();
    }

    public class CartItemDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
    }
}