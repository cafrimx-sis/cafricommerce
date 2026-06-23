namespace Ecommerce.API.Dtos
{
    public class ProductoDto
    {
        public int Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }

        // 🌟 AGREGAR ESTOS DOS
        public int CategoriaId { get; set; }
        public int MainMarcaId { get; set; }
    }
}