namespace Ecommerce.API.Entities
{
    public class Categoria
    {
        public int CategoriaId { get; set; }
        public string Nombre { get; set; } = string.Empty;

        // Si es NULL es una categoría principal. Si tiene ID, pertenece a una subcategoría.
        public int? CategoriaPadreId { get; set; }
        public bool Activo { get; set; } = true;

        // Propiedades de navegación
        public Categoria? CategoriaPadre { get; set; }
        public ICollection<Categoria> Subcategorias { get; set; } = new List<Categoria>();
        public ICollection<Producto> Productos { get; set; } = new List<Producto>();
    }
}