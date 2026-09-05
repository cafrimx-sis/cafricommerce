namespace Ecommerce.API.DTOs
{
    public class VerificarCodigoDto
    {
        public string Email { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
    }

    public class OlvidePasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class RestablecerPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NuevoPassword { get; set; } = string.Empty;
    }
}