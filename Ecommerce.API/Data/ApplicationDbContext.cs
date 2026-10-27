using Ecommerce.API.DTOs;
using Ecommerce.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Producto> Productos { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<SubCategoria> SubCategorias { get; set; }
        public DbSet<Marca> Marcas { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<DireccionEnvio> DireccionesEnvio { get; set; }
        public DbSet<ZonaEnvio> ZonasEnvio { get; set; }
        public DbSet<Orden> Ordenes { get; set; }
        public DbSet<OrdenDetalle> OrdenesDetalles { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallePedidos { get; set; }
        public DbSet<Venta> Ventas { get; set; }
        public DbSet<DetalleVenta> DetalleVentas { get; set; }
        public DbSet<CorteCaja> CortesCaja { get; set; }
        public DbSet<SolicitudFactura> SolicitudesFacturacion { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relación de Categorías (Autoreferencia jerárquica)
            modelBuilder.Entity<Categoria>()
                .HasOne(c => c.CategoriaPadre)
                .WithMany(c => c.Subcategorias)
                .HasForeignKey(c => c.CategoriaPadreId)
                .OnDelete(DeleteBehavior.Restrict);

            // Producto - Configuración de SubCategoría (Evita ciclos de borrado en cascada)
            modelBuilder.Entity<Producto>()
                .HasOne(p => p.SubCategoria)
                .WithMany()
                .HasForeignKey(p => p.SubCategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Índice único para SKU de producto
            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.SKU)
                .IsUnique();

            // Precisión monetaria para precios de productos
            modelBuilder.Entity<Producto>()
                .Property(p => p.PrecioPublico)
                .HasPrecision(18, 2);
            modelBuilder.Entity<Producto>()
                .Property(p => p.DescuentoPorcentaje)
                .HasPrecision(5, 2);

            // Mapeo explícito para la columna con variante ortográfica en SQL
            modelBuilder.Entity<Producto>()
                .Property(p => p.MainMarcaId)
                .HasColumnName("MainMarcadId");

            modelBuilder.Entity<Usuario>()
                .Property(user => user.FechaNacimiento)
                .HasColumnType("date");

            // Mapeo explícito para las tablas físicas de Ventas
            modelBuilder.Entity<Venta>().ToTable("VentasFisicas");
            modelBuilder.Entity<DetalleVenta>().ToTable("VentasFisicasDetalles");

            // Precisión monetaria para Pedidos y Detalles
            modelBuilder.Entity<Pedido>()
                .Property(p => p.Total)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DetallePedido>()
                .Property(p => p.PrecioUnitario)
                .HasPrecision(18, 2);
        }
    }
}