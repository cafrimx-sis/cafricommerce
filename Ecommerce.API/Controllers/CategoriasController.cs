using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // 🔐 Candados de seguridad
using Ecommerce.API.Data;
using Ecommerce.API.Entities;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize(Roles = "Administrador")] // Comentado temporalmente para pruebas
    [AllowAnonymous]
    public class CategoriasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🌐 Ver todas las categorías
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            return await _context.Categorias.ToListAsync();
        }

        // 🌐 Detalle de una sola categoría
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);

            if (categoria == null) return NotFound(new { mensaje = "La categoría no existe." });

            return categoria;
        }

        // 🆕 FALTABA ESTE: Crear una categoría nueva
        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria(Categoria categoria)
        {
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.CategoriaId }, categoria);
        }

        // 📝 Editar categoría existente
        [HttpPost("update/{id}")]
        public async Task<IActionResult> UpdateCategoria(int id, Categoria categoriaActualizada)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound();

            categoria.Nombre = categoriaActualizada.Nombre;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ❌ Eliminar categoría
        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound();

            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}