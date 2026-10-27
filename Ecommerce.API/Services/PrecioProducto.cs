using Ecommerce.API.Entities;

namespace Ecommerce.API.Services;

public static class PrecioProducto
{
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
}
