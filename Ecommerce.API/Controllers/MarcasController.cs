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
    public class MarcasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MarcasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🌐 PÚBLICO: Ver marcas en React
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Marca>>> GetMarcas()
        {
            return await _context.Marcas.ToListAsync();
        }

        // 🌐 PÚBLICO: Detalle de una sola marca
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Marca>> GetMarca(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);

            if (marca == null) return NotFound(new { mensaje = "La marca no existe." });

            return marca;
        }

        // 🚫 PROTEGIDO: Solo el administrador añade nuevos fabricantes
        [HttpPost]
        public async Task<ActionResult<Marca>> PostMarca(Marca marca)
        {
            _context.Marcas.Add(marca);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMarca), new { id = marca.MarcaId }, marca);
        }
    }
}