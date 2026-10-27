using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs
{
    public class SolicitudFacturaDto
    {
        [Required(ErrorMessage = "El folio de venta o ticket es obligatorio.")]
        public string FolioVenta { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fecha del ticket es obligatoria.")]
        public string FechaTicket { get; set; } = string.Empty;

        [Required(ErrorMessage = "El importe total es obligatorio.")]
        [Range(0.01, 1000000.00, ErrorMessage = "El importe debe ser mayor a 0.")]
        public decimal Importe { get; set; }

        [Required(ErrorMessage = "La Razón Social es obligatoria.")]
        public string RazonSocial { get; set; } = string.Empty;

        [Required(ErrorMessage = "El RFC es obligatorio.")]
        [StringLength(13, MinimumLength = 12, ErrorMessage = "El RFC debe tener entre 12 y 13 caracteres.")]
        public string Rfc { get; set; } = string.Empty;

        [Required(ErrorMessage = "El Régimen Fiscal es obligatorio.")]
        public string RegimenFiscal { get; set; } = string.Empty;

        [Required(ErrorMessage = "El Código Postal fiscal es obligatorio.")]
        [StringLength(5, MinimumLength = 5, ErrorMessage = "El C.P. debe ser de 5 dígitos.")]
        public string CodigoPostalFiscal { get; set; } = string.Empty;

        [Required(ErrorMessage = "La forma de pago es obligatoria.")]
        public string FormaPago { get; set; } = string.Empty;

        [Required(ErrorMessage = "El Uso de CFDI es obligatorio.")]
        public string UsoCfdi { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
        public string Correo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El número de celular es obligatorio.")]
        [StringLength(10, MinimumLength = 10, ErrorMessage = "El celular debe ser a 10 dígitos.")]
        public string Celular { get; set; } = string.Empty;

        // Opcional
        public string? Observaciones { get; set; }
    }
}