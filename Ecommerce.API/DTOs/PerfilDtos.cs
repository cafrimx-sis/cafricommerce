namespace Ecommerce.API.DTOs
{
    public class ActualizarPerfilDto
    {
        public string? Nombre { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? Ciudad { get; set; }
        public string? Rfc { get; set; }
    }

    public class CambiarPasswordDto
    {
        public string PasswordActual { get; set; } = string.Empty;
        public string PasswordNuevo { get; set; } = string.Empty;
    }
}