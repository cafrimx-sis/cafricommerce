using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("VentasFisicasDetalles")]
    public class DetalleVenta
    {
        [Key]
        public int DetalleVentaId { get; set; }

        [Required]
        public int VentaId { get; set; }
        public Venta Venta { get; set; } = null!;

        [Required]
        public int ProductoId { get; set; }
        public Producto Producto { get; set; } = null!;

        [Required]
        public int Cantidad { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; }
    }
}