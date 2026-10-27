using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net;
using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Cryptography;
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
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, IConfiguration config, ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        [HttpPost("registrar")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Registrar(RegistroDto dto)
        {
            if (dto.Password != dto.ConfirmPassword)
                return BadRequest(new { mensaje = "Las contraseñas no coinciden." });

            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email.ToLower().Trim()))
                return BadRequest(new { mensaje = "El correo ya está registrado." });

            var randomCode = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

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
                Activo = false,
                CanalVerificacionPreferido = string.IsNullOrEmpty(dto.CanalPreferido) ? "Email" : dto.CanalPreferido,
                CodigoVerificacion = randomCode,
                CodigoVerificacionExpira = DateTime.UtcNow.AddMinutes(15)
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            try
            {
                var smtpHost = _config["EmailSettings:Server"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_config["EmailSettings:Port"] ?? "587");
                var senderEmail = _config["EmailSettings:SenderEmail"] ?? "cafrimx@gmail.com";
                var senderName = _config["EmailSettings:SenderName"] ?? "Ecommerce HVACR";
                var password = _config["EmailSettings:Password"] ?? "";
                var nombreUsuario = WebUtility.HtmlEncode(nuevoUsuario.Nombre);
                var htmlCorreo = $"""
                    <!doctype html>
                    <html lang="es">
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <title>Verifica tu cuenta CAFRI</title>
                    </head>
                    <body style="margin:0;padding:0;background-color:#f3f7fa;font-family:Arial,Helvetica,sans-serif;color:#182b3f;">
                      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu código CAFRI vence en 15 minutos.</div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f7fa;padding:32px 12px;">
                        <tr>
                          <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #dfe8ef;border-radius:16px;overflow:hidden;">
                              <tr>
                                <td align="center" style="padding:24px 24px 20px;background-color:#0c2946;">
                                  <img src="cid:cafri-logo" width="170" alt="CAFRI HVACR" style="display:block;width:170px;max-width:100%;height:auto;border:0;">
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:32px 32px 12px;">
                                  <p style="margin:0 0 8px;color:#147d89;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Verificación de cuenta</p>
                                  <h1 style="margin:0 0 14px;color:#071b30;font-size:26px;line-height:1.25;">¡Bienvenido a CAFRI{(string.IsNullOrWhiteSpace(nombreUsuario) ? "" : $", {nombreUsuario}")}!</h1>
                                  <p style="margin:0;color:#52677a;font-size:15px;line-height:1.7;">Usa este código para confirmar tu correo electrónico y activar tu cuenta:</p>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding:18px 32px 22px;">
                                  <div style="display:inline-block;padding:15px 28px;background-color:#eaf7f7;border:1px solid #ccebe7;border-radius:12px;color:#0c5474;font-size:32px;font-weight:bold;letter-spacing:9px;">{randomCode}</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:0 32px 28px;">
                                  <p style="margin:0 0 12px;color:#52677a;font-size:14px;line-height:1.65;"><strong style="color:#173d56;">Importante:</strong> el código vence en 15 minutos. Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
                                  <p style="margin:0;color:#71889a;font-size:13px;line-height:1.6;">Por seguridad, no compartas este código con nadie. El equipo de CAFRI nunca te lo solicitará por teléfono o mensaje.</p>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding:18px 24px;background-color:#f8fafc;border-top:1px solid #e7eef2;">
                                  <p style="margin:0;color:#71889a;font-size:12px;line-height:1.6;">CAFRI E-commerce · Soluciones HVACR<br>Este mensaje se generó automáticamente; no es necesario responder.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                    </html>
                    """;

                var mensaje = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "Código de verificación de tu cuenta - CAFRI",
                    Body = $"CAFRI E-commerce\n\nHola{(string.IsNullOrWhiteSpace(nuevoUsuario.Nombre) ? "" : $" {nuevoUsuario.Nombre}")},\n\nTu código de verificación es: {randomCode}\n\nEl código vence en 15 minutos. No lo compartas con nadie. Si no solicitaste esta cuenta, ignora este mensaje.",
                    IsBodyHtml = false
                };
                mensaje.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(
                    mensaje.Body, Encoding.UTF8, "text/plain"));

                var logoStream = typeof(AuthController).Assembly.GetManifestResourceStream(
                    "Ecommerce.API.EmailAssets.logo.png")
                    ?? throw new InvalidOperationException("No se encontró el logo embebido para el correo de verificación.");
                var vistaHtml = AlternateView.CreateAlternateViewFromString(
                    htmlCorreo, Encoding.UTF8, "text/html");
                vistaHtml.LinkedResources.Add(new LinkedResource(logoStream, "image/png")
                {
                    ContentId = "cafri-logo",
                    TransferEncoding = System.Net.Mime.TransferEncoding.Base64
                });
                mensaje.AlternateViews.Add(vistaHtml);
                mensaje.To.Add(nuevoUsuario.Email);

                using var clienteSmtp = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(senderEmail, password),
                    EnableSsl = true
                };

                await clienteSmtp.SendMailAsync(mensaje);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar el correo de verificación.");
                _context.Usuarios.Remove(nuevoUsuario);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(cleanupException, "No se pudo limpiar una cuenta cuyo correo de verificación falló.");
                }
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { mensaje = "No se pudo enviar el correo de verificación. Intenta registrarte nuevamente más tarde." });
            }

            return Ok(new
            {
                mensaje = $"¡Usuario registrado con éxito! Se ha enviado un código de verificación a {nuevoUsuario.Email}.",
                canal = nuevoUsuario.CanalVerificacionPreferido
            });
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { mensaje = "El correo y la contraseña son obligatorios." });
            }

            var emailLimpiado = dto.Email.ToLower().Trim();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailLimpiado);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            if (!usuario.Activo)
            {
                return BadRequest(new { mensaje = "La cuenta no ha sido verificada. Por favor verifica tu correo." });
            }

            // Generación del token JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("sub", usuario.UsuarioId.ToString()),
                    new Claim("email", usuario.Email),
                    new Claim("role", usuario.Rol)
                }),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new
            {
                mensaje = "¡Inicio de sesión exitoso!",
                token = tokenString,
                usuario = new
                {
                    id = usuario.UsuarioId,
                    nombre = usuario.Nombre,
                    email = usuario.Email,
                    rol = usuario.Rol
                }
            });
        }

        [HttpPost("verificar-cuenta")]
        [EnableRateLimiting("auth")]
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

        [HttpPost("olvide-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> OlvidePassword([FromBody] OlvidePasswordDto dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

            if (usuario == null)
                return Ok(new { mensaje = "Si el correo está registrado, se han enviado las instrucciones de recuperación." });

            var tokenRecuperacion = Guid.NewGuid().ToString();
            usuario.TokenRecuperacion = tokenRecuperacion;
            usuario.TokenRecuperacionExpira = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            try
            {
                var smtpHost = _config["EmailSettings:Server"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_config["EmailSettings:Port"] ?? "587");
                var senderEmail = _config["EmailSettings:SenderEmail"] ?? "cafrimx@gmail.com";
                var senderName = _config["EmailSettings:SenderName"] ?? "CAFRI E-commerce";
                var password = _config["EmailSettings:Password"] ?? "";

                var frontendBaseUrl = _config["Frontend:BaseUrl"]?.TrimEnd('/');
                if (string.IsNullOrWhiteSpace(frontendBaseUrl))
                    throw new InvalidOperationException("Frontend:BaseUrl must be configured.");
                var enlaceRestablecer = $"{frontendBaseUrl}/restablecer-password?email={Uri.EscapeDataString(usuario.Email)}&token={Uri.EscapeDataString(tokenRecuperacion)}";

                var mensaje = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = "Recuperación de contraseña - CAFRI",
                    Body = $@"
                        <h3>Recuperación de Contraseña</h3>
                        <p>Has solicitado restablecer tu contraseña en CAFRI E-commerce.</p>
                        <p>Haz clic en el siguiente enlace para continuar:</p>
                        <a href='{enlaceRestablecer}' style='padding: 10px 15px; background-color: #1a365d; color: white; text-decoration: none; border-radius: 5px; display: inline-block;'>Restablecer Contraseña</a>
                        <p>O copia y pega este token si se requiere: <b style='font-family: monospace;'>{tokenRecuperacion}</b></p>
                        <p>Este enlace expirará en 1 hora.</p>",
                    IsBodyHtml = true
                };
                mensaje.To.Add(usuario.Email);

                using var clienteSmtp = new SmtpClient(smtpHost, smtpPort)
                {
                    Credentials = new NetworkCredential(senderEmail, password),
                    EnableSsl = true
                };

                await clienteSmtp.SendMailAsync(mensaje);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar el correo de recuperación.");
            }

            return Ok(new
            {
                mensaje = "Si el correo está registrado, se han enviado las instrucciones de recuperación."
            });
        }

        [HttpPost("restablecer-password")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> RestablecerPassword([FromBody] RestablecerPasswordDto dto)
        {
            if (dto == null || string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Token) || string.IsNullOrEmpty(dto.NuevoPassword))
            {
                return BadRequest(new { mensaje = "Todos los campos son obligatorios." });
            }

            var emailLimpiado = dto.Email.Replace("?", "").ToLower().Trim();

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == emailLimpiado);

            if (usuario == null)
                return BadRequest(new { mensaje = "El enlace es inválido o ha expirado." });

            if (string.IsNullOrEmpty(usuario.TokenRecuperacion) ||
                usuario.TokenRecuperacion.Trim() != dto.Token.Trim() ||
                usuario.TokenRecuperacionExpira < DateTime.UtcNow)
            {
                return BadRequest(new { mensaje = "El enlace es inválido o ha expirado." });
            }

            usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevoPassword);
            usuario.TokenRecuperacion = null;
            usuario.TokenRecuperacionExpira = null;

            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "¡Contraseña restablecida con éxito! Ya puedes iniciar sesión." });
        }

        [HttpGet("perfil")]
        [Authorize]
        public async Task<IActionResult> GetPerfil()
        {
            var userIdClaim = User.FindFirstValue("sub");
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
            var userIdClaim = User.FindFirstValue("sub");
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
            var userIdClaim = User.FindFirstValue("sub");
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