using System.ComponentModel.DataAnnotations;
using Ecommerce.API.DTOs;

namespace Ecommerce.API.Tests;

public class ChatbotRequestValidationTests
{
    [Fact]
    public void AcceptsMessagesWithinTheConfiguredLimit()
    {
        var request = new ChatRequestDto { Mensaje = new string('a', 500) };

        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            [],
            validateAllProperties: true);

        Assert.True(isValid);
    }

    [Fact]
    public void RejectsMessagesLongerThanTheConfiguredLimit()
    {
        var request = new ChatRequestDto { Mensaje = new string('a', 501) };

        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            [],
            validateAllProperties: true);

        Assert.False(isValid);
    }

    [Fact]
    public void AcceptsAValidProductIdForIndividualChatDetails()
    {
        var request = new ChatRequestDto { ProductoId = 42 };

        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            [],
            validateAllProperties: true);

        Assert.True(isValid);
    }

    [Fact]
    public void RejectsANonPositiveProductIdForIndividualChatDetails()
    {
        var request = new ChatRequestDto { ProductoId = 0 };

        var isValid = Validator.TryValidateObject(
            request,
            new ValidationContext(request),
            [],
            validateAllProperties: true);

        Assert.False(isValid);
    }
}
