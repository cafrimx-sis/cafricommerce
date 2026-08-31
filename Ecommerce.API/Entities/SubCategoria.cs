namespace Ecommerce.API.Entities
{
    public class SubCategoria
    {
        public int SubCategoriaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        //relacion con la categoria
        public int CategoriaId { get; set; }
        public Categoria Categoria { get; set; } = null!;
    }
}
