using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class MarcaCreateDto
    {
        [Required(ErrorMessage = "El nombre de la marca es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
        public string Nombre { get; set; } = string.Empty;
    }
}