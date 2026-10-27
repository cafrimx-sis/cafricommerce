using Npgsql;

namespace Ecommerce.API.Configuration;

public static class PostgreSqlConnectionStringFactory
{
    public static string FromDatabaseUrl(string databaseUrl)
    {
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var databaseUri) ||
            (databaseUri.Scheme != "postgres" && databaseUri.Scheme != "postgresql") ||
            string.IsNullOrWhiteSpace(databaseUri.Host) ||
            string.IsNullOrWhiteSpace(databaseUri.UserInfo) ||
            string.IsNullOrWhiteSpace(databaseUri.AbsolutePath.Trim('/')) ||
            !string.IsNullOrEmpty(databaseUri.Query) ||
            !string.IsNullOrEmpty(databaseUri.Fragment))
            throw new FormatException("DATABASE_URL must be a PostgreSQL URL with credentials and a database name.");

        var credentials = databaseUri.UserInfo.Split(':', 2);
        if (credentials.Length != 2)
            throw new FormatException("DATABASE_URL must include a username and password.");

        var connection = new NpgsqlConnectionStringBuilder
        {
            Host = databaseUri.Host,
            Port = databaseUri.IsDefaultPort ? 5432 : databaseUri.Port,
            Database = Uri.UnescapeDataString(databaseUri.AbsolutePath.Trim('/')),
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = Uri.UnescapeDataString(credentials[1]),
            SslMode = SslMode.Require,
            Timeout = 15,
            CommandTimeout = 30
        };

        return connection.ConnectionString;
    }
}
