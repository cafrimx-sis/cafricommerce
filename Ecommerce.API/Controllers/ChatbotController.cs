using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Ecommerce.API.DTOs;
using Ecommerce.API.Entities;
using Ecommerce.API.Services;
using Microsoft.AspNetCore.RateLimiting;
using System.Text.RegularExpressions;

namespace Ecommerce.API.Controllers
{
    [Route("api/chatbot")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(
            ApplicationDbContext context,
            ILogger<ChatbotController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("enviar")]
        [EnableRateLimiting("chatbot")]
        public async Task<IActionResult> EnviarMensaje([FromBody] ChatRequestDto request)
        {
            try
            {
                if (request is null)
                    return BadRequest(new { mensaje = "El mensaje es obligatorio." });

                if (request.ProductoId.HasValue)
                {
                    var producto = await _context.Productos
                        .Include(p => p.Categoria)
                        .Include(p => p.Marca)
                        .FirstOrDefaultAsync(p => p.ProductoId == request.ProductoId.Value);

                    if (producto is null)
                    {
                        return Ok(new
                        {
                            respuesta = "No encontré ese producto en el catálogo. Puedes elegir otro de la lista."
                        });
                    }

                    var ahoraUtc = DateTime.UtcNow;
                    var precioActual = PrecioProducto.ObtenerPrecioActual(producto, ahoraUtc);
                    var descripcion = string.IsNullOrWhiteSpace(producto.Descripcion)
                        ? "Aún no hay especificaciones técnicas registradas para este modelo. Consulta con un asesor."
                        : producto.Descripcion;
                    var disponibilidad = producto.Stock > 0
                        ? $"{producto.Stock} unidades disponibles"
                        : "Actualmente sin existencias";
                    var precioLista = producto.DescuentoPorcentaje > 0 &&
                        PrecioProducto.TieneOfertaActiva(producto, ahoraUtc)
                            ? $"Precio de lista: ${producto.PrecioPublico:F2} MXN\n"
                            : string.Empty;

                    return Ok(new
                    {
                        respuesta = $"**{producto.Nombre}**\n\n" +
                            $"Modelo/SKU: {producto.SKU}\n" +
                            $"Marca: {producto.Marca?.Nombre ?? "No especificada"}\n" +
                            $"Categoría: {producto.Categoria?.Nombre ?? "No especificada"}\n" +
                            $"{precioLista}" +
                            $"Precio actual: ${precioActual:F2} MXN\n" +
                            $"Disponibilidad: {disponibilidad}\n\n" +
                            $"{descripcion}\n\n" +
                            "Si necesitas otra especificación, pregunta por un dato concreto o consulta a un asesor."
                    });
                }

                string mensajeOriginal = request.Mensaje?.Trim().ToLowerInvariant() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(mensajeOriginal))
                {
                    return Ok(new { respuesta = "Hola, ¿en qué puedo ayudarte hoy con nuestros equipos de aire acondicionado y refrigeración?" });
                }

                // Limpiar comas de los miles (ej. 4,702 -> 4702)
                string mensaje = Regex.Replace(mensajeOriginal, @"(?<=\d),(?=\d{3})", "");

                // 1. Saludos
                if (mensaje.Contains("hola") || mensaje.Contains("buenos dias") || mensaje.Contains("buenas tardes") || mensaje.Contains("saludos"))
                {
                    return Ok(new { respuesta = "¡Hola! 👋 Soy tu asistente virtual de CAFRI HVACR. ¿Qué equipo de aire acondicionado o refrigeración estás buscando hoy?" });
                }

                // 2. DETECCIÓN DE DIMENSIONES DE ESPACIO (Ej. "cuarto de 4x4")
                var matchDimension = Regex.Match(mensaje, @"(\d+)\s*(?:x|por)\s*(\d+)");
                if (matchDimension.Success && (mensaje.Contains("cuarto") || mensaje.Contains("sala") || mensaje.Contains("recamara") || mensaje.Contains("espacio") || mensaje.Contains("medida") || mensaje.Contains("metro")))
                {
                    if (int.TryParse(matchDimension.Groups[1].Value, out int largo) && int.TryParse(matchDimension.Groups[2].Value, out int ancho))
                    {
                        long area = (long)largo * ancho;

                        int btuSugerido = area <= 12 ? 9000 : (area <= 20 ? 12000 : (area <= 30 ? 18000 : 24000));
                        string btuStr = btuSugerido.ToString();

                        var equiposEspacio = await _context.Productos
                            .Where(p => p.Nombre.ToLower().Contains("minisplit") && (p.Nombre.Contains(btuStr) || (p.Descripcion != null && p.Descripcion.Contains(btuStr))))
                            .OrderBy(p => p.PrecioPublico)
                            .Take(5)
                            .ToListAsync();

                        if (equiposEspacio.Count > 0)
                        {
                            var ahoraUtc = DateTime.UtcNow;
                            var listaEspacio = string.Join("\n\n", equiposEspacio
                                .Select(p => new
                                {
                                    Producto = p,
                                    Precio = PrecioProducto.ObtenerPrecioActual(p, ahoraUtc)
                                })
                                .OrderBy(item => item.Precio)
                                .Select(item => $"🔹 **{item.Producto.Nombre}**\n   💰 ${item.Precio:F2} MXN (Stock: {item.Producto.Stock})\n   [Más información: {item.Producto.Nombre}](chatbot:producto:{item.Producto.ProductoId})"));

                            // Enlace de WhatsApp neutral para asesoría general
                            string linkWspDudas = $"https://wa.me/5219991021232?text={Uri.EscapeDataString($"Hola, estuve consultando opciones en el asistente para mi espacio de {largo}x{ancho}m y me gustaría recibir asesoría y cotización general.")}";

                            return Ok(new
                            {
                                respuesta = $"Para tu espacio de {largo}x{ancho}m ({area} m²), te sugerimos un equipo de **{btuSugerido:N0} BTUs**. Aquí tienes opciones disponibles para evaluar:\n\n{listaEspacio}\n\n💬 ¿Requieres asesoría profesional o cotización? [Contáctanos por WhatsApp]({linkWspDudas})"
                            });
                        }
                    }
                }

                string[] marcasDisponibles = { "mirage", "lg", "midea", "prime", "lennox", "york", "carrier", "aurus", "benelux", "ciac" };
                bool mencionaMarca = marcasDisponibles.Any(m => Regex.IsMatch(mensaje, $@"\b{m}\b"));

                // 3. DETECCIÓN INTELIGENTE
                if (mensaje.Contains("minisplit") || mensaje.Contains("split") || mensaje.Contains("aire") || mensaje.Contains("clima") || mensaje.Contains("piso") || mensaje.Contains("techo") || mensaje.Contains("btu") || mensaje.Contains("tonelada") || mensaje.Contains("modelo") || mensaje.Contains("precio") || mensaje.Contains("costo") || mensaje.Contains("presupuesto") || mensaje.Contains("económico") || mensaje.Contains("economico") || mensaje.Contains("barato") || mencionaMarca || mensaje.Contains("$"))
                {
                    string? marcaSeleccionada = marcasDisponibles.FirstOrDefault(m => Regex.IsMatch(mensaje, $@"\b{m}\b"));

                    var matches = Regex.Matches(mensaje, @"\d+(?:\.\d+)?");
                    decimal? precioMin = null;
                    decimal? precioMax = null;
                    decimal? valorUnico = null;

                    if (matches.Count >= 2 && (mensaje.Contains("entre") || mensaje.Contains(" a ") || mensaje.Contains(" y ")))
                    {
                        if (decimal.TryParse(matches[0].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal min) &&
                            decimal.TryParse(matches[1].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal max))
                        {
                            precioMin = min;
                            precioMax = max;
                        }
                    }
                    else if (matches.Count == 1)
                    {
                        if (decimal.TryParse(matches[0].Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal vNum))
                        {
                            valorUnico = vNum;
                        }
                    }

                    bool esBusquedaPrecioMax = (mensaje.Contains("menor") || mensaje.Contains("menos") || mensaje.Contains("hasta") || mensaje.Contains("maximo")) && valorUnico.HasValue;
                    if (esBusquedaPrecioMax)
                    {
                        precioMax = valorUnico;
                        valorUnico = null;
                    }

                    if ((precioMax.HasValue && precioMax.Value < 1000) || (valorUnico.HasValue && valorUnico.Value < 1000 && !mensaje.Contains("btu") && !mensaje.Contains("tonelada") && !mensaje.Contains("ton")))
                    {
                        return Ok(new
                        {
                            respuesta = "😅 Los equipos de aire acondicionado y refrigeración suelen costar más de $1,000 MXN. ¿Te gustaría que busquemos opciones dentro de algún rango de presupuesto real (por ejemplo, entre $5,000 y $15,000 MXN)?"
                        });
                    }

                    bool buscaPisoTecho = mensaje.Contains("piso") || mensaje.Contains("techo");

                    var query = _context.Productos.Include(p => p.Categoria).AsQueryable();

                    if (!string.IsNullOrEmpty(marcaSeleccionada))
                    {
                        query = query.Where(p => p.Nombre.ToLower().Contains(marcaSeleccionada) || (p.Descripcion != null && p.Descripcion.ToLower().Contains(marcaSeleccionada)));
                    }
                    else if (buscaPisoTecho)
                    {
                        query = query.Where(p => (p.Categoria != null && (p.Categoria.Nombre.ToLower().Contains("piso") || p.Categoria.Nombre.ToLower().Contains("techo"))) ||
                                                 p.Nombre.ToLower().Contains("piso") || p.Nombre.ToLower().Contains("techo"));
                    }
                    else
                    {
                        query = query.Where(p => (p.Categoria != null && p.Categoria.Nombre.ToLower().Contains("minisplit")) ||
                                                 p.Nombre.ToLower().Contains("minisplit") ||
                                                 p.Nombre.ToLower().Contains("split") ||
                                                 (p.Descripcion != null && p.Descripcion.ToLower().Contains("minisplit")));
                    }

                    var equipos = await query
                        .OrderBy(p => p.PrecioPublico)
                        .Take(100)
                        .ToListAsync();

                    int? terminoBusquedaBtu = null;
                    if (valorUnico.HasValue && (mensaje.Contains("btu") || mensaje.Contains("tonelada") || mensaje.Contains("ton") || valorUnico.Value >= 9000))
                    {
                        bool esToneladas = mensaje.Contains("tonelada") || mensaje.Contains("ton");
                        var maximoBtu = esToneladas ? int.MaxValue / 12000m : int.MaxValue;
                        if (valorUnico.Value <= maximoBtu)
                        {
                            terminoBusquedaBtu = esToneladas
                                ? (int)valorUnico.Value * 12000
                                : (int)valorUnico.Value;
                        }

                        if (terminoBusquedaBtu.HasValue)
                        {
                            var btuStr = terminoBusquedaBtu.Value.ToString();
                            var filtradosBtu = equipos.Where(p => p.Nombre.ToLower().Contains(btuStr) ||
                                                                 (p.Descripcion != null && p.Descripcion.ToLower().Contains(btuStr))).ToList();
                            if (filtradosBtu.Count > 0)
                                equipos = filtradosBtu;
                        }
                    }

                    var ahoraPrecioUtc = DateTime.UtcNow;
                    var equiposConPrecio = equipos
                        .Select(p => new
                        {
                            Producto = p,
                            Precio = PrecioProducto.ObtenerPrecioActual(p, ahoraPrecioUtc)
                        })
                        .Where(item =>
                            (!precioMin.HasValue || item.Precio >= precioMin.Value) &&
                            (!precioMax.HasValue || item.Precio <= precioMax.Value) &&
                            (terminoBusquedaBtu.HasValue ||
                             !valorUnico.HasValue ||
                             mensaje.Contains("btu") ||
                             mensaje.Contains("tonelada") ||
                             mensaje.Contains("ton") ||
                             (item.Precio >= valorUnico.Value - 5m && item.Precio <= valorUnico.Value + 5m)))
                        .OrderBy(item => item.Precio)
                        .Take(5)
                        .ToList();

                    string tipoEquipoStr = buscaPisoTecho ? "equipos de piso techo" : "minisplits";
                    if (!string.IsNullOrEmpty(marcaSeleccionada))
                    {
                        tipoEquipoStr = $"equipos marca {marcaSeleccionada.ToUpper()}";
                    }

                    if (equiposConPrecio.Count > 0)
                    {
                        // Listado limpio sin enlaces internos a rutas de productos
                        var lista = string.Join("\n\n", equiposConPrecio.Select(item =>
                            $"🔹 **{item.Producto.Nombre}**\n   💰 ${item.Precio:F2} MXN (Stock: {item.Producto.Stock})\n   [Más información: {item.Producto.Nombre}](chatbot:producto:{item.Producto.ProductoId})"));

                        // Enlace de WhatsApp neutral para asesoría general
                        string linkWspDudas = $"https://wa.me/5219991021232?text={Uri.EscapeDataString($"Hola, estuve consultando opciones de {tipoEquipoStr} en el asistente y me gustaría recibir asesoría profesional y cotización.")}";

                        string mensajeRespuesta;
                        if (precioMin.HasValue && precioMax.HasValue)
                        {
                            mensajeRespuesta = $"Encontré estos modelos de {tipoEquipoStr} entre ${precioMin.Value:N2} y ${precioMax.Value:N2} MXN:\n\n{lista}\n\n💬 ¿Dudas o cotización especial? [Contáctanos por WhatsApp]({linkWspDudas})";
                        }
                        else if (precioMax.HasValue)
                        {
                            mensajeRespuesta = $"Encontré estos modelos de {tipoEquipoStr} por debajo de ${precioMax.Value:N2} MXN:\n\n{lista}\n\n💬 ¿Dudas o cotización especial? [Contáctanos por WhatsApp]({linkWspDudas})";
                        }
                        else if (valorUnico.HasValue && !terminoBusquedaBtu.HasValue)
                        {
                            mensajeRespuesta = $"Encontré este modelo con el precio exacto de ${valorUnico.Value:N2} MXN:\n\n{lista}\n\n💬 ¿Tienes alguna duda? [Escríbenos por WhatsApp]({linkWspDudas})";
                        }
                        else
                        {
                            mensajeRespuesta = $"Aquí tienes los modelos disponibles de {tipoEquipoStr}:\n\n{lista}\n\n💬 ¿Necesitas ayuda con tu elección? [Chatea con un asesor]({linkWspDudas})";
                        }

                        return Ok(new { respuesta = mensajeRespuesta });
                    }
                    else
                    {
                        string linkWspDefault = "https://wa.me/5219991021232?text=" + Uri.EscapeDataString("Hola, busqué equipos en el asistente y me gustaría recibir asesoría.");
                        return Ok(new
                        {
                            respuesta = $"No encontré {tipoEquipoStr} con esas especificaciones exactas.\n\n📞 Comunícate con recepción por WhatsApp:\n[Contactar por WhatsApp]({linkWspDefault})"
                        });
                    }
                }

                // 4. Guía rápida / contacto
                string linkWspGeneral = "https://wa.me/5219991021232?text=" + Uri.EscapeDataString("Hola, tengo dudas sobre el proceso de compra y me gustaría recibir asistencia.");
                if (mensaje.Contains("comprar") || mensaje.Contains("carrito") || mensaje.Contains("pagar") || mensaje.Contains("pedido"))
                {
                    return Ok(new
                    {
                        respuesta = $"Para realizar tu compra, navega por el catálogo y selecciona el equipo de tu preferencia.\n\n👉 ¿Dudas con tu pago o pedido? Escríbenos:\n[Contactar por WhatsApp]({linkWspGeneral})"
                    });
                }

                // 5. Búsqueda general por palabras clave
                if (mensaje.Contains("stock") || mensaje.Contains("tienen") || mensaje.Contains("buscar") || mensaje.Contains("equipo"))
                {
                    var palabras = mensaje.Split(' ');
                    var productos = await _context.Productos
                        .Where(p => palabras.Any(w => w.Length > 3 && p.Nombre.ToLower().Contains(w)))
                        .OrderBy(p => p.PrecioPublico)
                        .Take(3)
                        .ToListAsync();

                    if (productos.Count > 0)
                    {
                        var ahoraUtc = DateTime.UtcNow;
                        var listaProductos = string.Join("\n\n", productos
                            .Select(p => new
                            {
                                Producto = p,
                                Precio = PrecioProducto.ObtenerPrecioActual(p, ahoraUtc)
                            })
                            .OrderBy(item => item.Precio)
                            .Select(item => $"• **{item.Producto.Nombre}** - Precio: ${item.Precio:F2} MXN (Stock: {item.Producto.Stock})\n[Más información: {item.Producto.Nombre}](chatbot:producto:{item.Producto.ProductoId})"));
                        string linkWspDudas = $"https://wa.me/5219991021232?text={Uri.EscapeDataString("Hola, estuve buscando productos en el asistente y me gustaría recibir asesoría y cotización.")}";

                        return Ok(new
                        {
                            respuesta = $"Encontré estos productos relacionados:\n\n{listaProductos}\n\n💬 ¿Necesitas más información? [Chatea con un asesor]({linkWspDudas})"
                        });
                    }
                }

                // 6. Respuesta por defecto
                return Ok(new
                {
                    respuesta = $"Comprendo. Puedo ayudarte a buscar equipos por marca, rango de precio o calcular los BTUs para tus espacios. También puedo buscar opciones según tu presupuesto.\n\n📞 Para proyectos especiales o atención directa, contáctanos:\n[Contactar por WhatsApp]({linkWspGeneral})"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al procesar un mensaje del chatbot.");
                return StatusCode(500, new { mensaje = "No se pudo procesar el mensaje. Intenta de nuevo más tarde." });
            }
        }
    }
}