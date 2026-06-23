using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecommerce.API.Entities
{
    [Table("DireccionesEnvio")] // Define el nombre físico de la tabla en SQL Server
    public class DireccionEnvio
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; } // Llave foránea del cliente

        [Required]
        [StringLength(150)]
        public string Calle { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string NumeroExterior { get; set; } = string.Empty;

        [StringLength(20)]
        public string? NumeroInterior { get; set; }

        [Required]
        [StringLength(100)]
        public string Colonia { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Ciudad { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Estado { get; set; } = string.Empty; // Clave para amarrar con tu Zona de flete

        [Required]
        [StringLength(10)]
        public string CodigoPostal { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string TelefonoContacto { get; set; } = string.Empty;

        // Opcional: Propiedad de navegación por si después necesitas hacer un .Include(d => d.Usuario)
        // [ForeignKey("UsuarioId")]
        // public virtual Usuario? Usuario { get; set; }
    }
}