using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
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
        private static readonly SemaphoreSlim CatalogLoadLock = new(1, 1);
        private static Dictionary<string, CodigoPostalInfo>? _catalogoCodigosPostales;
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
                if (cp.Length != 5 || cp.Any(character => character < '0' || character > '9'))
                    return BadRequest(new { mensaje = "El código postal debe contener exactamente 5 dígitos." });

                var filePath = Path.Combine(_env.ContentRootPath, "Data", "cp.json");

                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { mensaje = "El archivo cp.json no se encuentra en la carpeta Data del servidor." });
                }

                var catalogo = _catalogoCodigosPostales;
                if (catalogo is null)
                {
                    await CatalogLoadLock.WaitAsync();
                    try
                    {
                        catalogo = _catalogoCodigosPostales;
                        if (catalogo is null)
                        {
                            catalogo = await CargarCatalogoCodigosPostalesAsync(filePath);
                            _catalogoCodigosPostales = catalogo;
                        }
                    }
                    finally
                    {
                        CatalogLoadLock.Release();
                    }
                }

                if (!catalogo.TryGetValue(cp, out var codigoPostal))
                {
                    return NotFound(new { mensaje = "Código postal no encontrado en la base de datos local." });
                }

                return Ok(new
                {
                    response = new
                    {
                        asentamiento = codigoPostal.Asentamientos,
                        municipio = codigoPostal.Municipio,
                        estado = codigoPostal.Estado
                    }
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno al procesar el C.P. local.", error = ex.Message });
            }
        }

        private static async Task<Dictionary<string, CodigoPostalInfo>> CargarCatalogoCodigosPostalesAsync(string filePath)
        {
            var catalogo = new Dictionary<string, CodigoPostalInfo>(StringComparer.Ordinal);

            await using var stream = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 64 * 1024,
                options: FileOptions.Asynchronous | FileOptions.SequentialScan);
            using var reader = new StreamReader(stream);

            var objectDepth = 0;
            string? codigo = null;
            string? asentamiento = null;
            string? municipio = null;
            string? estado = null;
            string? line;

            while ((line = await reader.ReadLineAsync()) is not null)
            {
                if (objectDepth == 2)
                    ReadPostalCodeProperty(line, ref codigo, ref asentamiento, ref municipio, ref estado);

                var insideString = false;
                var escaped = false;
                foreach (var character in line)
                {
                    if (insideString)
                    {
                        if (escaped)
                            escaped = false;
                        else if (character == '\\')
                            escaped = true;
                        else if (character == '"')
                            insideString = false;

                        continue;
                    }

                    if (character == '"')
                    {
                        insideString = true;
                    }
                    else if (character == '{')
                    {
                        objectDepth++;
                        if (objectDepth == 2)
                        {
                            codigo = null;
                            asentamiento = null;
                            municipio = null;
                            estado = null;
                        }
                    }
                    else if (character == '}')
                    {
                        if (objectDepth == 2 && codigo is not null && asentamiento is not null)
                        {
                            if (!catalogo.TryGetValue(codigo, out var codigoPostal))
                            {
                                codigoPostal = new CodigoPostalInfo();
                                catalogo.Add(codigo, codigoPostal);
                            }

                            codigoPostal.Asentamientos.Add(asentamiento);
                            codigoPostal.Municipio ??= municipio;
                            codigoPostal.Estado ??= estado;
                        }

                        objectDepth--;
                    }
                }
            }

            return catalogo;
        }

        private static void ReadPostalCodeProperty(
            string line,
            ref string? codigo,
            ref string? asentamiento,
            ref string? municipio,
            ref string? estado)
        {
            var property = line.Trim();
            if (!property.StartsWith('"'))
                return;

            var separator = property.IndexOf("\":", StringComparison.Ordinal);
            if (separator < 0)
                return;

            var name = property[1..separator];
            var value = property[(separator + 2)..].Trim().TrimEnd(',').Trim();
            if (value.Length == 0)
                return;

            switch (name)
            {
                case "d_codigo":
                    if (value[0] == '"')
                    {
                        var postalCode = JsonSerializer.Deserialize<string>(value);
                        if (!string.IsNullOrWhiteSpace(postalCode) &&
                            int.TryParse(postalCode, out var parsedStringPostalCode))
                        {
                            codigo = parsedStringPostalCode.ToString("D5");
                        }
                    }
                    else if (int.TryParse(value, out var parsedNumericPostalCode))
                    {
                        codigo = parsedNumericPostalCode.ToString("D5");
                    }

                    break;
                case "d_asenta":
                    asentamiento = JsonSerializer.Deserialize<string>(value);
                    break;
                case "D_mnpio":
                    municipio = JsonSerializer.Deserialize<string>(value);
                    break;
                case "d_estado":
                    estado = JsonSerializer.Deserialize<string>(value);
                    break;
            }
        }

        private sealed class CodigoPostalInfo
        {
            public HashSet<string> Asentamientos { get; } = new(StringComparer.Ordinal);
            public string? Municipio { get; set; }
            public string? Estado { get; set; }
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