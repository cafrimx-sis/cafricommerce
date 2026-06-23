using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using System.Threading.Tasks;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ACCESO PÚBLICO: Cualquier usuario (incluso no logueado) puede ver el catálogo
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductos()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Select(p => new
                {
                    id = p.ProductoId,
                    sku = p.SKU,
                    name = p.Nombre,
                    categoriaId = p.CategoriaId,
                    category = p.Categoria != null ? p.Categoria.Nombre : "General",
                    price = p.PrecioPublico,
                    description = p.Descripcion,
                    stock = p.Stock,
                    image = $"/productos/{p.SKU}.PNG"
                })
                .ToListAsync();

            return Ok(productos);
        }

        // ACCESO RESTRINGIDO: Solo administradores pueden agregar/modificar
        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> PostProducto([FromBody] object producto)
        {
            // Lógica de creación...
            return Ok();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null) return NotFound();

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}