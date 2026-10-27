using Ecommerce.API.Configuration;
using Npgsql;

namespace Ecommerce.API.Tests;

public class PostgreSqlConnectionStringFactoryTests
{
    [Fact]
    public void FromDatabaseUrlDecodesCredentialsAndRequiresTls()
    {
        var connectionString = PostgreSqlConnectionStringFactory.FromDatabaseUrl(
            "postgresql://cafri-user:p%40ss%3Aword@postgres.railway.internal:5433/cafri_db");
        var connection = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("postgres.railway.internal", connection.Host);
        Assert.Equal(5433, connection.Port);
        Assert.Equal("cafri_db", connection.Database);
        Assert.Equal("cafri-user", connection.Username);
        Assert.Equal("p@ss:word", connection.Password);
        Assert.Equal(SslMode.Require, connection.SslMode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("sqlserver://user:password@host/database")]
    [InlineData("postgresql://host/database")]
    [InlineData("postgresql://user:password@host/")]
    [InlineData("postgresql://user:password@host/database?sslmode=disable")]
    public void FromDatabaseUrlRejectsInvalidOrInsecureUrls(string databaseUrl)
    {
        Assert.Throws<FormatException>(() =>
            PostgreSqlConnectionStringFactory.FromDatabaseUrl(databaseUrl));
    }
}
