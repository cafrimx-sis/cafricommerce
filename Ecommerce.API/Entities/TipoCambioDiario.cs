namespace Ecommerce.API.Entities;

public sealed class TipoCambioDiario
{
    public DateOnly Fecha { get; set; }
    public decimal PesosPorDolar { get; set; }
    public DateTime ActualizadoUtc { get; set; }
    public string Fuente { get; set; } = "Banxico";
}
