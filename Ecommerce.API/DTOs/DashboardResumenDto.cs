namespace Ecommerce.API.DTOs
{
    public class DashboardResumenDto
    {
        public int TotalUsuarios { get; set; }
        public int TotalProductos { get; set; }
        public int StockBajo { get; set; }
        public decimal VentasDelMes { get; set; }
    }
}