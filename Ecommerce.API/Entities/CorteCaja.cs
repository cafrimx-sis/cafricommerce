using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    public class CorteCaja
    {
        [Key]
        public int Id { get; set; }
        public DateTime FechaCorte { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal FondoInicial { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalEfectivoSistema { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal EfectivoContado { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Diferencia { get; set; } // Negativo = Faltante, Positivo = Sobrante

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalTarjeta { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalTransferencia { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GranTotal { get; set; }

        public int TotalVentas { get; set; }

        [StringLength(250)]
        public string Observaciones { get; set; } = string.Empty;

        // Propiedad de navegación indispensable para incluir las ventas en el historial y modal
        public ICollection<Venta> Ventas { get; set; } = new List<Venta>();
    }
}