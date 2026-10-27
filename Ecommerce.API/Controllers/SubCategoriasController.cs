using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Ecommerce.API.Data;
using Ecommerce.API.Entities;
using Ecommerce.API.DTOs; // Asegúrate de incluir el namespace de tus DTOs

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class SubCategoriasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubCategoriasController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<SubCategoria>>> GetSubCategorias([FromQuery] int? categoriaId)
        {
            var query = _context.SubCategorias.Include(s => s.Categoria).AsQueryable();

            if (categoriaId.HasValue)
            {
                query = query.Where(s => s.CategoriaId == categoriaId.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<SubCategoria>> GetSubCategoria(int id)
        {
            var subCategoria = await _context.SubCategorias
                .Include(s => s.Categoria)
                .FirstOrDefaultAsync(s => s.SubCategoriaId == id);

            if (subCategoria == null) return NotFound(new { mensaje = "La subcategoría no existe." });

            return subCategoria;
        }

        // 🆕 Crear subcategoría usando DTO
        [HttpPost]
        public async Task<ActionResult<SubCategoria>> PostSubCategoria([FromBody] SubCategoriaDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre) || dto.CategoriaId <= 0)
            {
                return BadRequest(new { mensaje = "Los datos de la subcategoría son inválidos o están incompletos." });
            }

            // Validar que la categoría padre exista
            var categoriaPadre = await _context.Categorias.FindAsync(dto.CategoriaId);
            if (categoriaPadre == null)
            {
                return BadRequest(new { mensaje = "La categoría principal especificada no existe." });
            }

            var nuevaSubCategoria = new SubCategoria
            {
                Nombre = dto.Nombre.Trim(),
                CategoriaId = dto.CategoriaId
            };

            _context.SubCategorias.Add(nuevaSubCategoria);
            await _context.SaveChangesAsync();

            // Recargar para incluir la relación en la respuesta si el cliente la requiere
            await _context.Entry(nuevaSubCategoria).Reference(s => s.Categoria).LoadAsync();

            return CreatedAtAction(nameof(GetSubCategoria), new { id = nuevaSubCategoria.SubCategoriaId }, nuevaSubCategoria);
        }

        // 📝 Actualizar subcategoría usando DTO
        [HttpPost("update/{id}")]
        public async Task<IActionResult> UpdateSubCategoria(int id, [FromBody] SubCategoriaDto dto)
        {
            var subCategoria = await _context.SubCategorias.FindAsync(id);
            if (subCategoria == null) return NotFound(new { mensaje = "La subcategoría no existe." });

            if (dto == null || string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return BadRequest(new { mensaje = "El nombre de la subcategoría es obligatorio." });
            }

            subCategoria.Nombre = dto.Nombre.Trim();

            if (dto.CategoriaId > 0)
            {
                var categoriaPadre = await _context.Categorias.FindAsync(dto.CategoriaId);
                if (categoriaPadre == null)
                {
                    return BadRequest(new { mensaje = "La nueva categoría principal especificada no existe." });
                }
                subCategoria.CategoriaId = dto.CategoriaId;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ❌ Eliminar subcategoría
        [HttpPost("delete/{id}")]
        public async Task<IActionResult> DeleteSubCategoria(int id)
        {
            var subCategoria = await _context.SubCategorias.FindAsync(id);
            if (subCategoria == null) return NotFound(new { mensaje = "La subcategoría no existe." });

            _context.SubCategorias.Remove(subCategoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}