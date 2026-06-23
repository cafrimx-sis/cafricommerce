using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("Ordenes")]
    public class Orden
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; } // Quién compra

        [Required]
        public int DireccionEnvioId { get; set; } // A dónde se envía

        public DateTime FechaOrden { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; } // Suma de productos antes de impuestos

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Iva { get; set; } // 16% de IVA obligatorio

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoFlete { get; set; } // Costo de envío calculado por la zona

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; } // Subtotal + Iva + Flete (Lo que cobramos en PayPal)

        [Required]
        [StringLength(30)]
        public string EstadoOrden { get; set; } = "Pendiente"; // Pendiente, Pagado, En Almacen, Enviado, Bajo Pedido

        [StringLength(50)]
        public string MetodoPago { get; set; } = "PayPal";

        [StringLength(100)]
        public string? PayPalOrderId { get; set; } // Para rastrear la transacción con los servidores de PayPal
    }
}