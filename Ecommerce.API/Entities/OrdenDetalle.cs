using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("OrdenesDetalles")]
    public class OrdenDetalle
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int OrdenId { get; set; } // Amarre con el encabezado

        [Required]
        public int ProductoId { get; set; } // Qué producto compró

        [Required]
        public int Cantidad { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; } // Se guarda el precio del momento de la compra

        [Required]
        public bool EsBajoPedido { get; set; } = false; // TRUE si el producto no tenía stock físico pero se permitió la compra
    }
}