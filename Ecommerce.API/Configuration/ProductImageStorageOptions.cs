namespace Ecommerce.API.Configuration;

public sealed record ProductImageStorageOptions(string StoragePath)
{
    public static ProductImageStorageOptions FromConfiguration(
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var configuredPath = configuration["ProductImages:StoragePath"];
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            if (!environment.IsDevelopment())
            {
                throw new InvalidOperationException(
                    "ProductImages:StoragePath must point to persistent storage outside Development.");
            }

            var webRootPath = environment.WebRootPath
                ?? Path.Combine(environment.ContentRootPath, "wwwroot");
            configuredPath = Path.Combine(webRootPath, "productos");
        }
        else if (!environment.IsDevelopment() && !Path.IsPathFullyQualified(configuredPath))
        {
            throw new InvalidOperationException(
                "ProductImages:StoragePath must be an absolute path in non-Development environments.");
        }

        return new ProductImageStorageOptions(
            Path.GetFullPath(configuredPath, environment.ContentRootPath));
    }
}
