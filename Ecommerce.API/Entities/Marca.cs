namespace Ecommerce.API.Entities
{
    public class Marca
    {
        public int MarcaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool Activo { get; set; } = true;

        //propiedad de navegacion
        public ICollection<Producto> Productos { get; set; } = new List<Producto>();
    }
}
