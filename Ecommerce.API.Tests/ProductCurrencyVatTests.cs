using Ecommerce.API.Entities;
using Ecommerce.API.Services;

namespace Ecommerce.API.Tests;

public class ProductCurrencyVatTests
{
    [Fact]
    public void ConvertsUsdProductPricesToMxnUsingFixedRate()
    {
        Assert.Equal(185.90m, PrecioProducto.ConvertirPrecioAMxn(10m, "USD"));
        Assert.Equal(10m, PrecioProducto.ConvertirPrecioDesdeMxn(185.90m, "USD"));
    }

    [Fact]
    public void LeavesMxnProductPricesUnchanged()
    {
        Assert.Equal(100m, PrecioProducto.ConvertirPrecioAMxn(100m, "MXN"));
        Assert.Equal(100m, PrecioProducto.ConvertirPrecioDesdeMxn(100m, "MXN"));
    }

    [Fact]
    public void CalculatesVatOnlyForProductsMarkedAsTaxable()
    {
        var product = new Producto { AplicaIva = true };
        var untaxedProduct = new Producto { AplicaIva = false };

        Assert.Equal(16m, PrecioProducto.ObtenerIva(100m, product));
        Assert.Equal(0m, PrecioProducto.ObtenerIva(100m, untaxedProduct));
    }

    [Fact]
    public void AppliesPosDiscountBeforeCalculatingVat()
    {
        var product = new Producto { AplicaIva = true };

        Assert.Equal(28.80m, PrecioProducto.ObtenerIva(200m, product, 10m));
    }
}
