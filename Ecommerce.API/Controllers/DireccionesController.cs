using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace Ecommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DireccionesController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        // El constructor permite que el sistema inyecte el servicio HttpClient
        public DireccionesController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("buscar-por-cp/{cp}")]
        public async Task<IActionResult> GetColonias(string cp)
        {
            // Reemplaza TU_TOKEN_AQUI por el que te dio Copomex
            var token = "de5dd13d-f703-494b-9650-fdbc2bff0649";
            var url = $"https://api.copomex.com/query/info_cp/{cp}?token={token}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                    return BadRequest("Error al conectar con la API de servicios postales.");

                var content = await response.Content.ReadAsStringAsync();
                return Ok(content);
            }
            catch (System.Exception)
            {
                return StatusCode(500, "Error interno del servidor al consultar el CP.");
            }
        }
    }
}