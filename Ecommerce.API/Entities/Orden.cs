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
        public int UsuarioId { get; set; }

        [Required]
        public int DireccionEnvioId { get; set; }

        public DateTime FechaOrden { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Iva { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoFlete { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [Required]
        [StringLength(50)] // Aumentado de 30 a 50 para mayor seguridad
        public string EstadoOrden { get; set; } = "Pendiente";

        [StringLength(50)]
        public string MetodoPago { get; set; } = "PayPal";

        [StringLength(100)]
        public string? PayPalOrderId { get; set; }

        // --- NUEVOS CAMPOS ---
        [StringLength(50)]
        public string? ReferenciaPago { get; set; } // Agregado para OXXO
    }
}