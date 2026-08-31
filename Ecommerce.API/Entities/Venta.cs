using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("VentasFisicas")]
    public class Venta
    {
        [Key]
        public int VentaId { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [Required]
        [StringLength(50)]
        public string MetodoPago { get; set; } = "Efectivo";

        [Required]
        [StringLength(100)]
        public string Cliente { get; set; } = "Público General";

        public int? CorteId { get; set; }
        public CorteCaja? CorteCaja { get; set; }

        public ICollection<DetalleVenta> Detalles { get; set; } = new List<DetalleVenta>();
    }
}