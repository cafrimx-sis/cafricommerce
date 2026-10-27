using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Ecommerce.API.Configuration;
using Ecommerce.API.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

var productImageStorage = ProductImageStorageOptions.FromConfiguration(
    builder.Configuration,
    builder.Environment);
Directory.CreateDirectory(productImageStorage.StoragePath);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    var databaseUrl = builder.Configuration["DATABASE_URL"];
    if (!string.IsNullOrWhiteSpace(databaseUrl))
        connectionString = PostgreSqlConnectionStringFactory.FromDatabaseUrl(databaseUrl);
}
var jwtKey = builder.Configuration["Jwt:Key"];
var paypalClientId = builder.Configuration["PayPalSettings:ClientId"];
var paypalClientSecret = builder.Configuration["PayPalSettings:ClientSecret"];
var smtpPassword = builder.Configuration["EmailSettings:Password"];
var smtpPort = builder.Configuration["EmailSettings:Port"];
var paypalMode = builder.Configuration["PayPalSettings:Mode"];
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection or Railway DATABASE_URL must be configured.");
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key must contain at least 32 bytes.");
if (string.IsNullOrWhiteSpace(paypalClientId) || string.IsNullOrWhiteSpace(paypalClientSecret))
    throw new InvalidOperationException("PayPalSettings:ClientId and PayPalSettings:ClientSecret must be configured.");
if (paypalMode is not ("Sandbox" or "Live"))
    throw new InvalidOperationException("PayPalSettings:Mode must be Sandbox or Live.");
if (string.IsNullOrWhiteSpace(smtpPassword) ||
    string.IsNullOrWhiteSpace(builder.Configuration["EmailSettings:Server"]) ||
    string.IsNullOrWhiteSpace(builder.Configuration["EmailSettings:SenderEmail"]) ||
    !int.TryParse(smtpPort, out _))
    throw new InvalidOperationException("EmailSettings server, sender, port, and password must be configured.");
if (string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Issuer"]) ||
    string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Audience"]))
    throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be configured.");
if (allowedOrigins.Length == 0 || allowedOrigins.Any(origin =>
        origin.Contains('*') || !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
        (uri.AbsolutePath != "/" && uri.AbsolutePath.Length > 0) || uri.Query.Length > 0 || uri.Fragment.Length > 0))
    throw new InvalidOperationException("Cors:AllowedOrigins must contain valid, explicit origins.");
if (!builder.Environment.IsDevelopment() && allowedOrigins.Any(origin =>
        !Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
        uri.IsLoopback || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)))
    throw new InvalidOperationException("Production CORS origins must use HTTPS and cannot be localhost.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.Configure<PayPalSettings>(builder.Configuration.GetSection("PayPalSettings"));
builder.Services.AddSingleton(productImageStorage);
builder.Services.AddHostedService<PaypalInventoryReservationCleanupService>();

// 3. Servicios básicos
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 10,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1)
        }));
    options.AddPolicy("chatbot", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            AutoReplenishment = true,
            PermitLimit = 20,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1)
        }));
});

builder.Services.AddCors(options => {
    options.AddPolicy("CorsPolicy", policy => {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "sub",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var subject = context.Principal?.FindFirstValue("sub");
                var role = context.Principal?.FindFirstValue("role");
                if (!int.TryParse(subject, out var usuarioId) || string.IsNullOrWhiteSpace(role))
                {
                    context.Fail("El token no contiene una identidad válida.");
                    return;
                }

                var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var usuario = await dbContext.Usuarios
                    .AsNoTracking()
                    .Where(candidate => candidate.UsuarioId == usuarioId)
                    .Select(candidate => new { candidate.Activo, candidate.Rol })
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);

                if (usuario == null || !usuario.Activo ||
                    !string.Equals(usuario.Rol, role, StringComparison.Ordinal))
                    context.Fail("La cuenta o sus permisos cambiaron. Inicia sesión nuevamente.");
            }
        };
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(productImageStorage.StoragePath),
    RequestPath = "/productos"
});
app.UseStaticFiles();

app.UseRouting();
app.UseRateLimiter();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Clase de configuración para las opciones de PayPal
public class PayPalSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string WebhookId { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
}