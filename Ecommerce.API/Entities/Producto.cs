namespace Ecommerce.API.Entities
{
    public class Producto
    {
        public int ProductoId { get; set; }
        public string SKU { get; set; } = string.Empty; // Código único de inventario
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }

        // El precio neto mostrado al público ya incluye el 16% de IVA
        public decimal PrecioPublico { get; set; }

        public int Stock { get; set; } = 0;
        public bool PermiteBajoPedido { get; set; } = true; // Si se agota, permite seguir comprando
        public bool EsServicio { get; set; } = false; // TRUE para Ingeniería, Proyectos o Servicios Integrales
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // 🚀 NUEVA PROPIEDAD: Guarda el nombre o ruta de la foto (ej: "/productos/imagen1.PNG")
        public string? ImagenUrl { get; set; }

        // Llaves foráneas y relaciones
        public int CategoriaId { get; set; }
        public Categoria? Categoria { get; set; }

        public int MainMarcaId { get; set; }
        public Marca? Marca { get; set; }
        public int? SubCategoriaId { get; set; }
        public SubCategoria? SubCategoria { get; set; } = null!;
    }
}