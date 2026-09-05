using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class CheckoutDto
    {
        public int DireccionEnvioId { get; set; } = 0;

        [StringLength(150, ErrorMessage = "La calle no puede superar los 150 caracteres.")]
        public string? Calle { get; set; }

        [StringLength(20, ErrorMessage = "El número exterior no puede superar los 20 caracteres.")]
        public string? NumeroExterior { get; set; }

        [StringLength(20, ErrorMessage = "El número interior no puede superar los 20 caracteres.")]
        public string? NumeroInterior { get; set; }

        [StringLength(100, ErrorMessage = "La colonia no puede superar los 100 caracteres.")]
        public string? Colonia { get; set; }

        [StringLength(100, ErrorMessage = "La ciudad no puede superar los 100 caracteres.")]
        public string? Ciudad { get; set; }

        [StringLength(100, ErrorMessage = "El estado no puede superar los 100 caracteres.")]
        public string? Estado { get; set; }

        [RegularExpression(@"^\d{5}$", ErrorMessage = "El código postal debe tener exactamente 5 dígitos.")]
        public string? CodigoPostal { get; set; }

        [Phone(ErrorMessage = "El formato del teléfono de contacto no es válido.")]
        [StringLength(20, ErrorMessage = "El teléfono no puede superar los 20 caracteres.")]
        public string? TelefonoContacto { get; set; }

        [Required(ErrorMessage = "El carrito de compras no puede estar vacío.")]
        public List<CartItemDto> Items { get; set; } = new();
    }
}