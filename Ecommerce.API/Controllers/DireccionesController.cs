using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DireccionesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public DireccionesController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpGet("buscar-por-cp/{cp}")]
        public async Task<IActionResult> GetColonias(string cp)
        {
            try
            {
                var filePath = Path.Combine(_env.ContentRootPath, "Data", "cp.json");

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { mensaje = "El archivo cp.json no se encuentra en la carpeta Data del servidor." });
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(filePath);

                // Sanitizamos cualquier variante de NaN o nan de Python/Pandas reemplazándola por null
                jsonContent = Regex.Replace(jsonContent, @"\b[nN][aA][nN]\b", "null", RegexOptions.IgnoreCase);

                using var doc = JsonDocument.Parse(jsonContent);
                var root = doc.RootElement;

                var coincidencias = new List<JsonElement>();

                // Recorremos cada estado del diccionario (ignorando la clave "Nota")
                foreach (var property in root.EnumerateObject())
                {
                    if (property.Name == "Nota") continue;

                    if (property.Value.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in property.Value.EnumerateArray())
                        {
                            if (item.TryGetProperty("d_codigo", out var prop))
                            {
                                string codigoStr = prop.ValueKind == JsonValueKind.Number
                                    ? prop.GetInt32().ToString()
                                    : prop.GetString();

                                if (codigoStr == cp)
                                {
                                    coincidencias.Add(item);
                                }
                            }
                        }
                    }
                }

                if (coincidencias.Count == 0)
                {
                    return NotFound(new { mensaje = "Código postal no encontrado en la base de datos local." });
                }

                var asentamientos = coincidencias
                    .Select(x => x.TryGetProperty("d_asenta", out var asent) ? asent.GetString() : null)
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Distinct()
                    .ToArray();

                var primerElemento = coincidencias.First();
                var municipio = primerElemento.TryGetProperty("D_mnpio", out var mun) ? mun.GetString() : "";
                var estado = primerElemento.TryGetProperty("d_estado", out var est) ? est.GetString() : "";

                return Ok(new
                {
                    response = new
                    {
                        asentamiento = asentamientos,
                        municipio = municipio,
                        estado = estado
                    }
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al procesar el C.P. local.", error = ex.Message });
            }
        }

        // Nuevo endpoint POST para registrar la dirección y solucionar el error 404
        [HttpPost]
        public async Task<IActionResult> PostDireccion([FromBody] DireccionEnvioDto dto)
        {
            try
            {
                // TODO: Aquí debes insertar la dirección en tu base de datos usando tu DbContext de Entity Framework.
                // Ejemplo:
                // var nuevaDireccion = new DireccionEnvio { ... };
                // _context.DireccionesEnvio.Add(nuevaDireccion);
                // await _context.SaveChangesAsync();
                // int idGenerado = nuevaDireccion.Id;

                // De momento devolvemos un ID simulado (ej. 1) para que el flujo de React continúe al paso de PayPal
                int idGenerado = 1;

                return Ok(new
                {
                    id = idGenerado,
                    mensaje = "Dirección registrada exitosamente"
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al guardar la dirección en el servidor.", error = ex.Message });
            }
        }
    }

    // DTO para mapear los campos enviados desde el formulario de React
    public class DireccionEnvioDto
    {
        public int UsuarioId { get; set; }
        public string Calle { get; set; }
        public string NumeroExterior { get; set; }
        public string NumeroInterior { get; set; }
        public string Colonia { get; set; }
        public string Ciudad { get; set; }
        public string Estado { get; set; }
        public string CodigoPostal { get; set; }
        public string TelefonoContacto { get; set; }
    }
}