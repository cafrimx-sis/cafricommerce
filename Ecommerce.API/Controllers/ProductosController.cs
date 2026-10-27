using Ecommerce.API.Data;
using Ecommerce.API.Dtos;
using Ecommerce.API.DTOs;
using Ecommerce.API.Entities;
using Ecommerce.API.Configuration;
using Ecommerce.API.Services;
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
        private readonly string _productImagesPath;

        public ProductosController(
            ApplicationDbContext context,
            ProductImageStorageOptions productImageStorage)
        {
            _context = context;
            _productImagesPath = productImageStorage.StoragePath;
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
                .ToListAsync();

            var ahoraUtc = DateTime.UtcNow;
            return Ok(productos.Select(p => MapProducto(p, ahoraUtc)));
        }

        // 🔍 Obtener un solo producto por su ID numérico o por su SKU
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProducto(string id)
        {
            bool esNumero = int.TryParse(id, out int productoId);

            var p = await _context.Productos
                .Include(p => p.Categoria)
                .Include(p => p.SubCategoria)
                .Include(p => p.Marca)
                .FirstOrDefaultAsync(x => esNumero ? x.ProductoId == productoId : x.SKU == id);

            if (p == null) return NotFound(new { mensaje = "El producto no existe." });

            return Ok(MapProducto(p, DateTime.UtcNow));
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> PostProducto([FromForm] ProductoDto dto, IFormFile? file)
        {
            var errorOferta = ValidarOferta(dto);
            if (errorOferta != null) return BadRequest(new { mensaje = errorOferta });
            var errorDestacado = ValidarDestacado(dto);
            if (errorDestacado != null) return BadRequest(new { mensaje = errorDestacado });

            string? imagePath = null;

            if (file != null && file.Length > 0)
            {
                var extension = Path.GetExtension(file.FileName);
                var folderPath = _productImagesPath;

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
                DescuentoPorcentaje = dto.DescuentoPorcentaje,
                OfertaInicioUtc = dto.OfertaInicioUtc,
                OfertaFinUtc = dto.OfertaFinUtc,
                EsDestacado = dto.EsDestacado,
                DestacadoInicioUtc = dto.EsDestacado ? dto.DestacadoInicioUtc : null,
                DestacadoFinUtc = dto.EsDestacado ? dto.DestacadoFinUtc : null,
                Stock = dto.Stock,
                Descripcion = dto.Description ?? "",
                CategoriaId = dto.CategoriaId,
                SubCategoriaId = dto.SubCategoriaId,
                MainMarcaId = dto.MainMarcaId,
                ImagenUrl = imagePath
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
            var errorOferta = ValidarOferta(dto);
            if (errorOferta != null) return BadRequest(new { mensaje = errorOferta });
            var errorDestacado = ValidarDestacado(dto);
            if (errorDestacado != null) return BadRequest(new { mensaje = errorDestacado });

            var p = await _context.Productos.FindAsync(id);
            if (p == null) return NotFound();

            p.SKU = dto.Sku;
            p.Nombre = dto.Name;
            p.PrecioPublico = dto.Price;
            p.DescuentoPorcentaje = dto.DescuentoPorcentaje;
            p.OfertaInicioUtc = dto.OfertaInicioUtc;
            p.OfertaFinUtc = dto.OfertaFinUtc;
            p.EsDestacado = dto.EsDestacado;
            p.DestacadoInicioUtc = dto.EsDestacado ? dto.DestacadoInicioUtc : null;
            p.DestacadoFinUtc = dto.EsDestacado ? dto.DestacadoFinUtc : null;
            p.Stock = dto.Stock;
            p.Descripcion = dto.Description ?? "";
            p.CategoriaId = dto.CategoriaId;
            p.SubCategoriaId = dto.SubCategoriaId;
            p.MainMarcaId = dto.MainMarcaId;

            if (file != null && file.Length > 0)
            {
                var extension = Path.GetExtension(file.FileName);
                var folderPath = _productImagesPath;

                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var fileName = $"{dto.Sku}{extension}";
                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                p.ImagenUrl = $"/productos/{fileName}";
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

        [HttpPut("oferta")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarOferta([FromBody] ActualizarOfertaProductosDto dto)
        {
            if (dto.ProductIds.Count != dto.ProductIds.Distinct().Count() ||
                dto.ProductIds.Any(id => id <= 0))
                return BadRequest(new { mensaje = "La selección contiene productos inválidos o repetidos." });

            if (dto.DiscountPercentage == 0)
            {
                if (dto.OfferStartUtc.HasValue || dto.OfferEndUtc.HasValue)
                    return BadRequest(new { mensaje = "Quita las fechas de vigencia para eliminar la oferta." });
            }
            else if (!dto.OfferStartUtc.HasValue || !dto.OfferEndUtc.HasValue ||
                     dto.OfferEndUtc <= dto.OfferStartUtc)
            {
                return BadRequest(new { mensaje = "Indica un periodo de oferta válido." });
            }

            var products = await _context.Productos
                .Where(product => dto.ProductIds.Contains(product.ProductoId))
                .ToListAsync();
            if (products.Count != dto.ProductIds.Count)
                return NotFound(new { mensaje = "Uno o más productos seleccionados ya no existen." });
            if (dto.DiscountPercentage > 0 &&
                products.Any(product => product.PrecioPublico <= 0 ||
                    decimal.Round(
                        product.PrecioPublico * (1 - dto.DiscountPercentage / 100m),
                        2,
                        MidpointRounding.AwayFromZero) <= 0))
                return BadRequest(new { mensaje = "La oferta debe dejar un precio mayor que cero para todos los productos." });

            foreach (var product in products)
            {
                product.DescuentoPorcentaje = dto.DiscountPercentage;
                product.OfertaInicioUtc = dto.DiscountPercentage > 0 ? dto.OfferStartUtc : null;
                product.OfertaFinUtc = dto.DiscountPercentage > 0 ? dto.OfferEndUtc : null;
            }

            await _context.SaveChangesAsync();
            return Ok(new { productosActualizados = products.Count });
        }

        private static string? ValidarOferta(ProductoDto dto)
        {
            if (dto.DescuentoPorcentaje is < 0 or > 99.99m)
                return "El descuento debe estar entre 0 y 99.99 por ciento.";

            if (dto.DescuentoPorcentaje == 0)
                return dto.OfertaInicioUtc.HasValue || dto.OfertaFinUtc.HasValue
                    ? "Quita las fechas de vigencia cuando el descuento sea 0."
                    : null;

            if (dto.OfertaInicioUtc is null || dto.OfertaFinUtc is null)
                return "Indica la fecha de inicio y fin de la oferta.";

            if (dto.OfertaFinUtc <= dto.OfertaInicioUtc)
                return "La fecha de fin debe ser posterior a la fecha de inicio.";

            if (dto.Price <= 0)
                return "El precio de lista debe ser mayor que cero para aplicar una oferta.";

            if (decimal.Round(dto.Price * (1 - dto.DescuentoPorcentaje / 100m), 2, MidpointRounding.AwayFromZero) <= 0)
                return "La oferta debe dejar un precio mayor que cero.";

            return null;
        }

        private static string? ValidarDestacado(ProductoDto dto)
        {
            if (!dto.EsDestacado)
                return dto.DestacadoInicioUtc.HasValue || dto.DestacadoFinUtc.HasValue
                    ? "Quita las fechas de vigencia cuando el producto no esté destacado."
                    : null;

            if (!dto.DestacadoInicioUtc.HasValue || !dto.DestacadoFinUtc.HasValue)
                return "Indica la fecha de inicio y fin de la promoción destacada.";

            if (dto.DestacadoFinUtc <= dto.DestacadoInicioUtc)
                return "La fecha de fin del destacado debe ser posterior a la fecha de inicio.";

            return null;
        }

        private static object MapProducto(Producto p, DateTime ahoraUtc)
        {
            var ofertaActiva = PrecioProducto.TieneOfertaActiva(p, ahoraUtc);
            var destacadoActivo = PrecioProducto.EsDestacadoActivo(p, ahoraUtc);
            return new
            {
                id = p.ProductoId,
                sku = p.SKU,
                name = p.Nombre,
                categoriaId = p.CategoriaId,
                category = p.Categoria?.Nombre ?? "General",
                subCategoriaId = p.SubCategoriaId,
                subCategory = p.SubCategoria?.Nombre ?? "N/A",
                mainMarcaId = p.MainMarcaId,
                brand = p.Marca?.Nombre ?? "N/A",
                price = PrecioProducto.ObtenerPrecioActual(p, ahoraUtc),
                originalPrice = p.PrecioPublico,
                discountPercentage = p.DescuentoPorcentaje,
                offerStartUtc = p.OfertaInicioUtc.HasValue
                    ? (DateTime?)DateTime.SpecifyKind(p.OfertaInicioUtc.Value, DateTimeKind.Utc)
                    : null,
                offerEndUtc = p.OfertaFinUtc.HasValue
                    ? (DateTime?)DateTime.SpecifyKind(p.OfertaFinUtc.Value, DateTimeKind.Utc)
                    : null,
                offerActive = ofertaActiva,
                isFeatured = p.EsDestacado,
                featuredActive = destacadoActivo,
                featuredStartUtc = p.DestacadoInicioUtc.HasValue
                    ? (DateTime?)DateTime.SpecifyKind(p.DestacadoInicioUtc.Value, DateTimeKind.Utc)
                    : null,
                featuredEndUtc = p.DestacadoFinUtc.HasValue
                    ? (DateTime?)DateTime.SpecifyKind(p.DestacadoFinUtc.Value, DateTimeKind.Utc)
                    : null,
                description = p.Descripcion,
                stock = p.Stock,
                image = !string.IsNullOrEmpty(p.ImagenUrl) ? p.ImagenUrl : $"/productos/{p.SKU}.PNG"
            };
        }
    }
}