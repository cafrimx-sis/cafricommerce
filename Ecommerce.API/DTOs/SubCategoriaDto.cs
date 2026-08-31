namespace Ecommerce.API.DTOs
{
    public class SubCategoriaDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int CategoriaId { get; set; }
    }
}