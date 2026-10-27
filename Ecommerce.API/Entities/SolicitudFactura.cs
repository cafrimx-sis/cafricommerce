using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("SolicitudesFacturacion")]
    public class SolicitudFactura
    {
        [Key]
        public int Id { get; set; }

        public int? UsuarioId { get; set; }

        [Required]
        [MaxLength(50)]
        public string NumeroOrdenOid { get; set; } = string.Empty; // Folio / Ticket

        [Required]
        [MaxLength(50)]
        public string FechaTicket { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Importe { get; set; }

        [Required]
        [MaxLength(20)]
        public string Rfc { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string RazonSocial { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string CodigoPostalFiscal { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string RegimenFiscal { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FormaPago { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string UsoCfdi { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Correo { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Celular { get; set; } = string.Empty;

        public string? Observaciones { get; set; }

        [Required]
        [MaxLength(50)]
        public string Estatus { get; set; } = "Pendiente"; // Pendiente, Facturada, Rechazada

        public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;
    }
}