using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs;

public sealed class ActualizarOfertaProductosDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(500)]
    public List<int> ProductIds { get; set; } = [];

    [Range(typeof(decimal), "0", "99.99")]
    public decimal DiscountPercentage { get; set; }

    public DateTime? OfferStartUtc { get; set; }
    public DateTime? OfferEndUtc { get; set; }
}
