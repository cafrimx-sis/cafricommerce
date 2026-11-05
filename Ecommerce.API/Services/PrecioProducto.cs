using Ecommerce.API.Entities;

namespace Ecommerce.API.Services;

public static class PrecioProducto
{
    public const decimal TipoCambioUsdAMxn = 18.59m;
    public const decimal TasaIva = 0.16m;

    public static bool EsDestacadoActivo(Producto producto, DateTime ahoraUtc) =>
        producto.EsDestacado &&
        producto.DestacadoInicioUtc.HasValue &&
        producto.DestacadoFinUtc.HasValue &&
        producto.DestacadoInicioUtc.Value <= ahoraUtc &&
        producto.DestacadoFinUtc.Value > ahoraUtc;

    public static bool TieneOfertaActiva(Producto producto, DateTime ahoraUtc) =>
        producto.DescuentoPorcentaje > 0 &&
        producto.OfertaInicioUtc.HasValue &&
        producto.OfertaFinUtc.HasValue &&
        producto.OfertaInicioUtc.Value <= ahoraUtc &&
        producto.OfertaFinUtc.Value > ahoraUtc;

    public static decimal ObtenerPrecioActual(Producto producto, DateTime ahoraUtc)
    {
        if (!TieneOfertaActiva(producto, ahoraUtc))
            return producto.PrecioPublico;

        var precio = producto.PrecioPublico * (1 - producto.DescuentoPorcentaje / 100m);
        return decimal.Round(precio, 2, MidpointRounding.AwayFromZero);
    }

    public static decimal ConvertirPrecioAMxn(decimal precio, string moneda) =>
        string.Equals(moneda, "USD", StringComparison.Ordinal)
            ? decimal.Round(precio * TipoCambioUsdAMxn, 2, MidpointRounding.AwayFromZero)
            : precio;

    public static decimal ConvertirPrecioDesdeMxn(decimal precioMxn, string moneda) =>
        string.Equals(moneda, "USD", StringComparison.Ordinal)
            ? decimal.Round(precioMxn / TipoCambioUsdAMxn, 2, MidpointRounding.AwayFromZero)
            : precioMxn;

    public static decimal ObtenerIva(decimal precioBase, Producto producto, decimal descuentoPorcentaje = 0m)
    {
        if (!producto.AplicaIva)
            return 0m;

        var precioConDescuento = precioBase * (1 - descuentoPorcentaje / 100m);
        return decimal.Round(precioConDescuento * TasaIva, 2, MidpointRounding.AwayFromZero);
    }

    public static decimal ObtenerPrecioConIva(decimal precioBase, Producto producto) =>
        precioBase + ObtenerIva(precioBase, producto);
}
