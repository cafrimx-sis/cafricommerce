using System.ComponentModel.DataAnnotations;

namespace Ecommerce.API.DTOs;

public sealed class CotizarEnvioDto
{
    [Required]
    [StringLength(100)]
    public string Estado { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    public List<CartItemDto> Items { get; set; } = new();
}
