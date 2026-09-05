using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(RegistroDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return BadRequest(new { mensaje = "Las contraseñas no coinciden." });

            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email.ToLower().Trim()))
                return BadRequest(new { mensaje = "El correo ya está registrado." });

            var randomCode = new Random().Next(100000, 999999).ToString();

            var nuevoUsuario = new Usuario
            {
                Nombre = dto.Nombre,
                ApellidoPaterno = dto.ApellidoPaterno,
                ApellidoMaterno = dto.ApellidoMaterno,
                FechaNacimiento = dto.FechaNacimiento,
                Direccion = dto.Direccion,
                Email = dto.Email.ToLower().Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Rol = "Cliente",
                Telefono = dto.Telefono,
                CodigoPostal = dto.CodigoPostal,
                Colonia = dto.Colonia,
                Activo = false, // Inactivo hasta verificar su código
                CanalVerificacionPreferido = string.IsNullOrEmpty(dto.CanalPreferido) ? "Email" : dto.CanalPreferido,
                CodigoVerificacion = randomCode,
                CodigoVerificacionExpira = DateTime.UtcNow.AddMinutes(15)
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = $"¡Usuario registrado con éxito! Se ha generado un código de verificación vía {nuevoUsuario.CanalVerificacionPreferido}.",
                canal = nuevoUsuario.CanalVerificacionPreferido,
                codigoGeneradoPruebas = randomCode // Útil para pruebas locales
            });
        }

        [HttpPost("verificar-cuenta")]
        public async Task<IActionResult> VerificarCuenta([FromBody] VerificarCodigoDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado." });

            if (usuario.Activo)
                return BadRequest(new { mensaje = "La cuenta ya ha sido verificada anteriormente." });

            if (usuario.CodigoVerificacion != dto.Codigo || usuario.CodigoVerificacionExpira < DateTime.UtcNow)
                return BadRequest(new { mensaje = "El código de verificación es inválido o ha expirado." });

            usuario.Activo = true;
            usuario.CodigoVerificacion = null;
            usuario.CodigoVerificacionExpira = null;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Cuenta verificada exitosamente! Ya puedes iniciar sesión." });
        }

        [HttpPost("reenviar-codigo")]
        public async Task<IActionResult> ReenviarCodigo([FromBody] OlvidePasswordDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());
            if (usuario == null)
                return NotFound(new { mensaje = "Usuario no encontrado." });

            if (usuario.Activo)
                return BadRequest(new { mensaje = "La cuenta ya ha sido verificada anteriormente." });

            var randomCode = new Random().Next(100000, 999999).ToString();
            usuario.CodigoVerificacion = randomCode;
            usuario.CodigoVerificacionExpira = DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = $"Se ha reenviado un nuevo código de verificación vía {usuario.CanalVerificacionPreferido ?? "Email"}.",
                codigoGeneradoPruebas = randomCode // Útil para pruebas locales
            });
        }

        [HttpPost("olvide-password")]
        public async Task<IActionResult> OlvidePassword([FromBody] OlvidePasswordDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (usuario == null)
                return Ok(new { mensaje = "Si el correo está registrado, se han enviado las instrucciones de recuperación." });

            var tokenRecuperacion = Guid.NewGuid().ToString();
            usuario.TokenRecuperacion = tokenRecuperacion;
            usuario.TokenRecuperacionExpira = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Se han enviado las instrucciones de recuperación a tu correo.",
                tokenPruebas = tokenRecuperacion // Útil para pruebas locales
            });
        }

        [HttpPost("restablecer-password")]
        public async Task<IActionResult> RestablecerPassword([FromBody] RestablecerPasswordDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());
            if (usuario == null || usuario.TokenRecuperacion != dto.Token || usuario.TokenRecuperacionExpira < DateTime.UtcNow)
                return BadRequest(new { mensaje = "El enlace de recuperación es inválido o ha expirado." });

            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevoPassword);
            usuario.TokenRecuperacion = null;
            usuario.TokenRecuperacionExpira = null;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            if (!usuario.Activo)
                return Unauthorized(new { mensaje = "Debes verificar tu cuenta antes de iniciar sesión. Revisa tu código de verificación." });

            string rolParaToken = (usuario.Rol == "Admin" || usuario.Rol == "Administrador") ? "Administrador" : usuario.Rol;

            var tokenHandler = new JwtSecurityTokenHandler();
            var llave = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] {
                    new Claim(ClaimTypes.NameIdentifier, usuario.UsuarioId.ToString()),
                    new Claim("Nombre", $"{usuario.Nombre} {usuario.ApellidoPaterno}"),
                    new Claim(ClaimTypes.Role, rolParaToken)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(llave), SecurityAlgorithms.HmacSha256Signature)
            };

            return Ok(new
            {
                token = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor)),
                nombre = $"{usuario.Nombre} {usuario.ApellidoPaterno}",
                rol = rolParaToken,
                email = usuario.Email,
                telefono = usuario.Telefono,
                direccion = usuario.Direccion
            });
        }

        // ==========================================
        // ENDPOINTS PARA EL PERFIL DEL CLIENTE
        // ==========================================

        [HttpGet("perfil")]
        [Authorize]
        public async Task<IActionResult> GetPerfil()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            return Ok(new
            {
                nombre = usuario.Nombre,
                email = usuario.Email,
                telefono = usuario.Telefono,
                direccion = usuario.Direccion
            });
        }

        [HttpPut("perfil")]
        [Authorize]
        public async Task<IActionResult> ActualizarPerfil([FromBody] ActualizarPerfilDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            usuario.Nombre = dto.Nombre ?? usuario.Nombre;
            usuario.Telefono = dto.Telefono ?? usuario.Telefono;
            usuario.Direccion = dto.Direccion ?? usuario.Direccion;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Perfil actualizado correctamente.",
                usuario = new
                {
                    usuarioId = usuario.UsuarioId,
                    nombre = usuario.Nombre,
                    email = usuario.Email,
                    telefono = usuario.Telefono,
                    direccion = usuario.Direccion,
                    rol = usuario.Rol
                }
            });
        }

        [HttpPut("cambiar-password")]
        [Authorize]
        public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int usuarioId))
            {
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado." });
            }

            var usuario = await _context.Usuarios.FindAsync(usuarioId);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.PasswordHash))
            {
                return BadRequest(new { mensaje = "La contraseña actual es incorrecta." });
            }

            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNuevo);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contraseña actualizada con éxito." });
        }

        // ==========================================
        // ENDPOINTS ADMINISTRATIVOS
        // ==========================================

        [HttpPut("cambiar-rol/{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> CambiarRol(int id, [FromBody] RolDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            if (dto.Rol != "Cliente" && dto.Rol != "Administrador")
                return BadRequest(new { mensaje = "Rol no válido." });

            usuario.Rol = dto.Rol;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = $"Rol actualizado a {dto.Rol} correctamente." });
        }

        [HttpDelete("eliminar/{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario eliminado correctamente." });
        }

        [HttpGet("listar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ListarUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Select(u => new {
                    id = u.UsuarioId,
                    nombre = u.Nombre,
                    apellido = u.ApellidoPaterno,
                    email = u.Email,
                    rol = u.Rol
                })
                .ToListAsync();

            return Ok(usuarios);
        }
    }
}