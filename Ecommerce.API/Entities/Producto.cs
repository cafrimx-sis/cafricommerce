using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    public class Producto
    {
        public int ProductoId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal PrecioPublico { get; set; }
        public int Stock { get; set; } = 0;
        public bool PermiteBajoPedido { get; set; } = true;
        public bool EsServicio { get; set; } = false;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public string? ImagenUrl { get; set; }

        public int CategoriaId { get; set; }
        public Categoria? Categoria { get; set; }

        public int MainMarcaId { get; set; }

        [ForeignKey("MainMarcaId")]
        public Marca? Marca { get; set; }

        public int? SubCategoriaId { get; set; }
        public SubCategoria? SubCategoria { get; set; } = null!;
    }
}