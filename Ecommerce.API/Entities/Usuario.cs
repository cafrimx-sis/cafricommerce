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
        public string Telefono { get; set; } = string.Empty;
        public string CodigoPostal { get; set; } = string.Empty;
        public string Colonia { get; set; } = string.Empty;

        // campos para verificación y recuperación
        public bool Activo { get; set; } = false; // Se activa tras verificar su código/enlace
        public string? CanalVerificacionPreferido { get; set; } = "Email"; // "Email", "SMS", "WhatsApp"
        public string? CodigoVerificacion { get; set; } // Código de 6 dígitos para SMS/WhatsApp
        public DateTime? CodigoVerificacionExpira { get; set; }
        public string? TokenRecuperacion { get; set; } // Token para recuperar contraseña por email
        public DateTime? TokenRecuperacionExpira { get; set; }
    }
}