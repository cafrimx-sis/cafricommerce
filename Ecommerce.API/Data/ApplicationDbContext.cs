using Ecommerce.API.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace Ecommerce.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Definimos las tablas de la Base de Datos
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Marca> Marcas { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<DireccionEnvio> DireccionesEnvio { get; set; }
        public DbSet<ZonaEnvio> ZonasEnvio { get; set; }
        public DbSet<Orden> Ordenes { get; set; }
        public DbSet<OrdenDetalle> OrdenesDetalles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Configuración de Categorías y Subcategorías (Autorreferenciada)
            modelBuilder.Entity<Categoria>()
                .HasOne(c => c.CategoriaPadre)
                .WithMany(c => c.Subcategorias)
                .HasForeignKey(c => c.CategoriaPadreId)
                .OnDelete(DeleteBehavior.Restrict);

            // 2. Configurar el SKU de Producto como único para evitar duplicados
            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.SKU)
                .IsUnique();

            // 3. Definir la precisión para el precio en SQL Server (Evita alertas en la consola)
            modelBuilder.Entity<Producto>()
                .Property(p => p.PrecioPublico)
                .HasColumnType("decimal(18,2)");
        }
    }
}