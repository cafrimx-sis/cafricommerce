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
                Colonia = dto.Colonia
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "¡Usuario registrado con éxito!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

            // 🌟 TRADUCCIÓN: Aseguramos que el rol en el token sea "Administrador"
            // Esto es necesario porque tus controladores usan [Authorize(Roles = "Administrador")]
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
                rol = rolParaToken
            });
        }

        [HttpPut("cambiar-rol/{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> CambiarRol(int id, [FromBody] RolDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado." });

            // Validamos que el rol sea válido
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