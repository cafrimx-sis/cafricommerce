using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class ChatRequestDto
    {
        public int? UsuarioId { get; set; }

        [StringLength(500)]
        public string Mensaje { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int? ProductoId { get; set; }
    }

    public class ChatResponseDto
    {
        public string Respuesta { get; set; } = string.Empty;
    }
}