namespace Ecommerce.API.DTOs
{
    public class Pedido
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public decimal Total { get; set; }
        public int UsuarioId { get; set; }
        public List<DetallePedido> Detalles { get; set; } = new();
    }
}