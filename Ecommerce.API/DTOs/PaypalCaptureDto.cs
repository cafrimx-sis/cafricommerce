using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Ecommerce.API.DTOs
{
    public class PaypalCaptureDto
    {
        [Required(ErrorMessage = "El ID de la orden de PayPal es obligatorio[cite: 3].")]
        [JsonPropertyName("paypalOrderId")]
        public string PayPalOrderId { get; set; } = string.Empty;
    }
} 