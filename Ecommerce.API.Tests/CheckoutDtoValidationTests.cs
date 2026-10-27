using System.ComponentModel.DataAnnotations;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Tests;

public class CheckoutDtoValidationTests
{
    [Theory]
    [InlineData("01000", true)]
    [InlineData("97000", true)]
    [InlineData("9700", false)]
    [InlineData("970000", false)]
    [InlineData("97A00", false)]
    public void PostalCodeMustContainExactlyFiveDigits(string postalCode, bool isValid)
    {
        var dto = new CheckoutDto { CodigoPostal = postalCode };

        Assert.Equal(isValid, IsValid(dto));
    }

    [Theory]
    [InlineData(1, 1, true)]
    [InlineData(0, 1, false)]
    [InlineData(1, 0, false)]
    [InlineData(-1, 3, false)]
    public void CartItemRequiresPositiveProductIdAndQuantity(int productId, int quantity, bool isValid)
    {
        var dto = new CartItemDto { ProductoId = productId, Cantidad = quantity };

        Assert.Equal(isValid, IsValid(dto));
    }

    private static bool IsValid(object instance)
    {
        var validationResults = new List<ValidationResult>();
        return Validator.TryValidateObject(
            instance,
            new ValidationContext(instance),
            validationResults,
            validateAllProperties: true);
    }
}
