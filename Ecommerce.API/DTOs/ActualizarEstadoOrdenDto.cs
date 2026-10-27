using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class ActualizarEstadoOrdenDto
    {
        [Required]
        [StringLength(50)]
        public string Estado { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Paqueteria { get; set; }

        [StringLength(100)]
        public string? NumeroGuia { get; set; }
    }
}
