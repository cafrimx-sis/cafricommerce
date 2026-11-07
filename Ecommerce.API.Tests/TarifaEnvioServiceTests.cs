using Ecommerce.API.Services;

namespace Ecommerce.API.Tests;

public class TarifaEnvioServiceTests
{
    private readonly TarifaEnvioService _service = new();

    [Theory]
    [InlineData("Baja California", "Norte", 650)]
    [InlineData("Baja California Sur", "Norte", 650)]
    [InlineData("Chihuahua", "Norte", 650)]
    [InlineData("Coahuila", "Norte", 650)]
    [InlineData("Durango", "Norte", 650)]
    [InlineData("Nuevo León", "Norte", 650)]
    [InlineData("Sinaloa", "Norte", 650)]
    [InlineData("Sonora", "Norte", 650)]
    [InlineData("Tamaulipas", "Norte", 650)]
    [InlineData("Aguascalientes", "Sur", 450)]
    [InlineData("Campeche", "Sur", 450)]
    [InlineData("Chiapas", "Sur", 450)]
    [InlineData("Ciudad de México", "Sur", 450)]
    [InlineData("Colima", "Sur", 450)]
    [InlineData("Estado de México", "Sur", 450)]
    [InlineData("Guanajuato", "Sur", 450)]
    [InlineData("Guerrero", "Sur", 450)]
    [InlineData("Hidalgo", "Sur", 450)]
    [InlineData("Jalisco", "Sur", 450)]
    [InlineData("Michoacán", "Sur", 450)]
    [InlineData("Morelos", "Sur", 450)]
    [InlineData("Nayarit", "Sur", 450)]
    [InlineData("Oaxaca", "Sur", 450)]
    [InlineData("Puebla", "Sur", 450)]
    [InlineData("Querétaro", "Sur", 450)]
    [InlineData("Quintana Roo", "Sur", 450)]
    [InlineData("San Luis Potosí", "Sur", 450)]
    [InlineData("Tabasco", "Sur", 450)]
    [InlineData("Tlaxcala", "Sur", 450)]
    [InlineData("Veracruz", "Sur", 450)]
    [InlineData("Yucatán", "Sur", 450)]
    [InlineData("Zacatecas", "Sur", 450)]
    public void CotizaLaTarifaEsperadaPorEstado(string estado, string zona, decimal costo)
    {
        Assert.True(_service.TryCotizar(estado, out var cotizacion));
        Assert.Equal(zona, cotizacion!.Zona);
        Assert.Equal(costo, cotizacion.CostoMxn);
    }

    [Theory]
    [InlineData(" NUEVO LEON ", "Norte")]
    [InlineData("CDMX", "Sur")]
    [InlineData("EdoMex", "Sur")]
    public void AceptaVariantesDeNombre(string estado, string zona)
    {
        Assert.True(_service.TryCotizar(estado, out var cotizacion));
        Assert.Equal(zona, cotizacion!.Zona);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Estado inexistente")]
    public void RechazaEstadosSinZona(string? estado)
    {
        Assert.False(_service.TryCotizar(estado, out var cotizacion));
        Assert.Null(cotizacion);
    }
}
