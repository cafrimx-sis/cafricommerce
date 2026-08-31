using Ecommerce.API.Data;
using Ecommerce.API.Dtos;
using Ecommerce.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProductosController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // 🌐 Listar todos los productos
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProductos()
        {
            var productos = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.SubCategoria)
                .Include(p => p.Marca)
                .Select(p => new {
                    id = p.ProductoId,
                    sku = p.SKU,
                    name = p.Nombre,
                    categoriaId = p.CategoriaId,
                    category = p.Categoria != null ? p.Categoria.Nombre : "General",
                    subCategoriaId = p.SubCategoriaId,
                    subCategory = p.SubCategoria != null ? p.SubCategoria.Nombre : "N/A",
                    mainMarcaId = p.MainMarcaId,
                    brand = p.Marca != null ? p.Marca.Nombre : "N/A",
                    price = p.PrecioPublico,
                    description = p.Descripcion,
                    stock = p.Stock,
                    // 🛠️ Usa ImagenUrl si existe, de lo contrario usa una ruta por defecto
                    image = !string.IsNullOrEmpty(p.ImagenUrl) ? p.ImagenUrl : $"/productos/{p.SKU}.PNG"
                }).ToListAsync();

            return Ok(productos);
        }

        // 🔍 Obtener un solo producto por su ID
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProducto(int id)
        {
            var p = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.SubCategoria)
                .Include(p => p.Marca)
                .FirstOrDefaultAsync(p => p.ProductoId == id);

            if (p == null) return NotFound(new { mensaje = "El producto no existe." });

            var productoDto = new
            {
                id = p.ProductoId,
                sku = p.SKU,
                name = p.Nombre,
                categoriaId = p.CategoriaId,
                category = p.Categoria != null ? p.Categoria.Nombre : "General",
                subCategoriaId = p.SubCategoriaId,
                subCategory = p.SubCategoria != null ? p.SubCategoria.Nombre : "N/A",
                mainMarcaId = p.MainMarcaId,
                brand = p.Marca != null ? p.Marca.Nombre : "N/A",
                price = p.PrecioPublico,
                description = p.Descripcion,
                stock = p.Stock,
                image = !string.IsNullOrEmpty(p.ImagenUrl) ? p.ImagenUrl : $"/productos/{p.SKU}.PNG"
            };

            return Ok(productoDto);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> PostProducto([FromForm] ProductoDto dto, IFormFile? file)
        {
            string? imagePath = null;

            if (file != null && file.Length > 0)
            {
                var extension = Path.GetExtension(file.FileName); // Captura .jpg, .png, etc.
                var folderPath = Path.Combine(_env.WebRootPath, "productos");

                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var fileName = $"{dto.Sku}{extension}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                imagePath = $"/productos/{fileName}";
            }

            var nuevoProducto = new Producto
            {
                SKU = dto.Sku,
                Nombre = dto.Name,
                PrecioPublico = dto.Price,
                Stock = dto.Stock,
                Descripcion = dto.Description ?? "",
                CategoriaId = dto.CategoriaId,
                SubCategoriaId = dto.SubCategoriaId,
                MainMarcaId = dto.MainMarcaId,
                ImagenUrl = imagePath // 👈 Guarda la ruta exacta con la extensión real (.jpg)
            };

            _context.Productos.Add(nuevoProducto);
            await _context.SaveChangesAsync();

            return Ok(nuevoProducto);
        }

        // 🛠️ Soporta tanto POST /api/productos/update/{id} como PUT /api/productos/{id}
        [HttpPost("update/{id}")]
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> PutProducto(int id, [FromForm] ProductoDto dto, IFormFile? file)
        {
            var p = await _context.Productos.FindAsync(id);
            if (p == null) return NotFound();

            p.SKU = dto.Sku;
            p.Nombre = dto.Name;
            p.PrecioPublico = dto.Price;
            p.Stock = dto.Stock;
            p.Descripcion = dto.Description ?? "";
            p.CategoriaId = dto.CategoriaId;
            p.SubCategoriaId = dto.SubCategoriaId;
            p.MainMarcaId = dto.MainMarcaId;

            if (file != null && file.Length > 0)
            {
                var extension = Path.GetExtension(file.FileName);
                var folderPath = Path.Combine(_env.WebRootPath, "productos");

                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var fileName = $"{dto.Sku}{extension}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                p.ImagenUrl = $"/productos/{fileName}"; // 👈 Actualiza la ruta con la nueva extensión si se sube archivo
            }

            await _context.SaveChangesAsync();
            return NoContent();
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