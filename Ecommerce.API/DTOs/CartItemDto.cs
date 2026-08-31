using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class CartItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductoId { get; set; }

        [Range(1, int.MaxValue)]
        public int Cantidad { get; set; }
    }
}