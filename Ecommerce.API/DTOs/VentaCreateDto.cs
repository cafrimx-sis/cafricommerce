namespace Ecommerce.API.DTOs
{
    public class VentaCreateDto
    {
        public string Cliente { get; set; } = "Público General";
        public string MetodoPago { get; set; } = "Efectivo";
        public decimal Total { get; set; }
        public List<ItemVentaDto> Items { get; set; } = new();
    }

    public class ItemVentaDto
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}