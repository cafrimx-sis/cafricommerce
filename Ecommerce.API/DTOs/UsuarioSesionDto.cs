namespace Ecommerce.API.DTOs
{
    public class UsuarioSesionDto
    {
        public int UsuarioId { get; set; }
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Ciudad { get; set; } = string.Empty;
        public string Colonia { get; set; } = string.Empty;
        public string CodigoPostal { get; set; } = string.Empty;
        public string Rfc { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
    }
}
