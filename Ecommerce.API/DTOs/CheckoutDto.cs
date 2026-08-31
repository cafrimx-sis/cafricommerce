namespace Ecommerce.API.DTOs
{
    public class CheckoutDto
    {
        public int DireccionEnvioId { get; set; } = 0;

        public string? Calle { get; set; }
        public string? NumeroExterior { get; set; }
        public string? NumeroInterior { get; set; }
        public string? Colonia { get; set; }
        public string? Ciudad { get; set; }
        public string? Estado { get; set; }
        public string? CodigoPostal { get; set; }
        public string? TelefonoContacto { get; set; }

        public List<CartItemDto> Items { get; set; } = new();
    }
}