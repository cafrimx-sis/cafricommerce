namespace Ecommerce.API.Dtos
{
    public class ProductoDto
    {
        public int Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal DescuentoPorcentaje { get; set; }
        public DateTime? OfertaInicioUtc { get; set; }
        public DateTime? OfertaFinUtc { get; set; }
        public bool EsDestacado { get; set; }
        public DateTime? DestacadoInicioUtc { get; set; }
        public DateTime? DestacadoFinUtc { get; set; }
        public int Stock { get; set; }
        public string? Description { get; set; }
        public int CategoriaId { get; set; }
        public int SubCategoriaId { get; set; }
        public int MainMarcaId { get; set; }
    }
}