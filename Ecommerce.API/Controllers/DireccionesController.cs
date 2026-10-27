using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // 🔒 Requiere autenticación por defecto para todo el controlador
    public class DireccionesController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;

        public DireccionesController(IWebHostEnvironment env, ApplicationDbContext context)
        {
            _env = env;
            _context = context;
        }

        [HttpGet("buscar-por-cp/{cp}")]
        [AllowAnonymous] // 🔓 Permitir consulta pública del catálogo de C.P. (cp.json)
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
                                    : prop.GetString() ?? string.Empty;

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

        [HttpPost]
        public async Task<IActionResult> PostDireccion([FromBody] DireccionEnvioDto dto)
        {
            try
            {
                // 🔒 Obtenemos el ID del usuario de forma segura mediante el token JWT
                var userIdClaim = User.FindFirstValue("sub");
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
                {
                    return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
                }

                var nuevaDireccion = new DireccionEnvio
                {
                    UsuarioId = usuarioId, // Asignación segura vinculada al usuario autenticado
                    Calle = dto.Calle ?? string.Empty,
                    NumeroExterior = dto.NumeroExterior ?? string.Empty,
                    NumeroInterior = dto.NumeroInterior,
                    Colonia = dto.Colonia ?? string.Empty,
                    Ciudad = dto.Ciudad ?? string.Empty,
                    Estado = dto.Estado ?? string.Empty,
                    CodigoPostal = dto.CodigoPostal ?? string.Empty,
                    TelefonoContacto = dto.TelefonoContacto ?? string.Empty
                };

                _context.DireccionesEnvio.Add(nuevaDireccion);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = nuevaDireccion.Id,
                    mensaje = "Dirección registrada exitosamente"
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al guardar la dirección en el servidor.", error = ex.Message });
            }
        }
    }

    // DTO actualizado (ya no requiere UsuarioId expuesto en el cliente)
    public class DireccionEnvioDto
    {
        public string Calle { get; set; } = string.Empty;
        public string NumeroExterior { get; set; } = string.Empty;
        public string? NumeroInterior { get; set; }
        public string Colonia { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string CodigoPostal { get; set; } = string.Empty;
        public string TelefonoContacto { get; set; } = string.Empty;
    }
}