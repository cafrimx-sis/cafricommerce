using Ecommerce.API.Entities;
using Ecommerce.API.Services;

namespace Ecommerce.API.Tests;

public class ProductOfferPricingTests
{
    [Fact]
    public void AppliesActivePercentageOfferAndRoundsToCents()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = CreateProduct(999.99m, 15m, now.AddHours(-1), now.AddHours(1));

        Assert.True(PrecioProducto.TieneOfertaActiva(product, now));
        Assert.Equal(849.99m, PrecioProducto.ObtenerPrecioActual(product, now));
    }

    [Fact]
    public void UsesListPriceBeforeOfferStarts()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = CreateProduct(100m, 20m, now.AddHours(1), now.AddDays(1));

        Assert.False(PrecioProducto.TieneOfertaActiva(product, now));
        Assert.Equal(100m, PrecioProducto.ObtenerPrecioActual(product, now));
    }

    [Fact]
    public void UsesListPriceWhenOfferExpires()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = CreateProduct(100m, 20m, now.AddDays(-1), now);

        Assert.False(PrecioProducto.TieneOfertaActiva(product, now));
        Assert.Equal(100m, PrecioProducto.ObtenerPrecioActual(product, now));
    }

    [Fact]
    public void UsesListPriceWhenThereIsNoOffer()
    {
        var product = CreateProduct(100m, 0m, null, null);

        Assert.False(PrecioProducto.TieneOfertaActiva(product, DateTime.UtcNow));
        Assert.Equal(100m, PrecioProducto.ObtenerPrecioActual(product, DateTime.UtcNow));
    }

    [Fact]
    public void TreatsFeaturedProductAsActiveAtStartAndInactiveAtEnd()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = new Producto
        {
            EsDestacado = true,
            DestacadoInicioUtc = now,
            DestacadoFinUtc = now.AddHours(1)
        };

        Assert.True(PrecioProducto.EsDestacadoActivo(product, now));
        Assert.True(PrecioProducto.EsDestacadoActivo(product, now.AddMinutes(59)));
        Assert.False(PrecioProducto.EsDestacadoActivo(product, now.AddHours(1)));
    }

    [Fact]
    public void DoesNotTreatFeaturedProductAsActiveBeforeItsStart()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = new Producto
        {
            EsDestacado = true,
            DestacadoInicioUtc = now.AddMinutes(1),
            DestacadoFinUtc = now.AddHours(1)
        };

        Assert.False(PrecioProducto.EsDestacadoActivo(product, now));
    }

    [Fact]
    public void DoesNotTreatUnselectedProductAsFeatured()
    {
        var now = new DateTime(2026, 10, 21, 12, 0, 0, DateTimeKind.Utc);
        var product = new Producto
        {
            EsDestacado = false,
            DestacadoInicioUtc = now.AddHours(-1),
            DestacadoFinUtc = now.AddHours(1)
        };

        Assert.False(PrecioProducto.EsDestacadoActivo(product, now));
    }

    private static Producto CreateProduct(
        decimal listPrice,
        decimal discountPercentage,
        DateTime? offerStart,
        DateTime? offerEnd) =>
        new()
        {
            PrecioPublico = listPrice,
            DescuentoPorcentaje = discountPercentage,
            OfertaInicioUtc = offerStart,
            OfertaFinUtc = offerEnd
        };
}
