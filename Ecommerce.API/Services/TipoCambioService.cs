namespace Ecommerce.API.Services;

public sealed record TipoCambioSnapshot(
    decimal PesosPorDolar,
    DateOnly Fecha,
    DateTime ActualizadoUtc,
    string Fuente);

public sealed class TipoCambioService
{
    private TipoCambioSnapshot _actual = new(
        PrecioProducto.TipoCambioUsdAMxn,
        new DateOnly(2026, 11, 5),
        DateTime.SpecifyKind(new DateTime(2026, 11, 5), DateTimeKind.Utc),
        "Referencia inicial");

    public TipoCambioSnapshot Actual => Volatile.Read(ref _actual);

    public void Actualizar(TipoCambioSnapshot tipoCambio)
    {
        if (tipoCambio.PesosPorDolar <= 0)
            throw new ArgumentOutOfRangeException(nameof(tipoCambio), "El tipo de cambio debe ser mayor que cero.");

        Interlocked.Exchange(ref _actual, tipoCambio);
    }
}
