using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // 🔐 Candados de seguridad
using Ecommerce.API.Data;
using Ecommerce.API.Entities;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")] // Bloqueo global
    public class CategoriasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🌐 PÚBLICO: Ver categorías en React
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            return await _context.Categorias.ToListAsync();
        }

        // 🌐 PÚBLICO: Detalle de una sola categoría
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);

            if (categoria == null) return NotFound(new { mensaje = "La categoría no existe." });

            return categoria;
        }

        // 🚫 PROTEGIDO: Solo el administrador crea categorías
        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria(Categoria categoria)
        {
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.CategoriaId }, categoria);
        }
    }
}