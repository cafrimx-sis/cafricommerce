namespace Ecommerce.API.Entities
{
    public class Usuario
    {
        public int UsuarioId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string ApellidoPaterno { get; set; } = string.Empty;
        public string ApellidoMaterno { get; set; } = string.Empty;
        public DateTime FechaNacimiento { get; set; }
        public string Direccion { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Rol { get; set; } = "Cliente";
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
    }
}