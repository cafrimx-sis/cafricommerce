using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("ZonasEnvio")]
    public class ZonaEnvio
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Estado { get; set; } = string.Empty; // Ej: "Yucatán", "Nuevo León", "CDMX"

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostoFlete { get; set; } // Ej: 0.00 para local, 350.00 para otra zona

        [Required]
        public int DiasEntregaEstimados { get; set; } // Ej: 3 (días hábiles)
    }
}