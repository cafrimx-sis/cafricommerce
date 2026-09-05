using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Ecommerce.API.Data;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Configuración de PayPal (Mapeo de credenciales desde appsettings.json)
builder.Services.Configure<PayPalSettings>(builder.Configuration.GetSection("PayPalSettings"));

// 3. Servicios básicos
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

// 4. CORS - leer orígenes permitidos desde configuración (appsettings / env)
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options => {
    options.AddPolicy("DefaultCors", p => {
        if (configuredOrigins.Length == 1 && configuredOrigins[0] == "*")
        {
            p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
        else
        {
            p.WithOrigins(configuredOrigins).AllowAnyMethod().AllowAnyHeader();
        }
    });
});

// 5. JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

var app = builder.Build();

// 6. Validación de configuración crítica al arrancar
{
    var config = app.Configuration;
    var missing = new List<string>();
    if (string.IsNullOrWhiteSpace(config["Jwt:Key"])) missing.Add("Jwt:Key");
    if (string.IsNullOrWhiteSpace(config.GetConnectionString("DefaultConnection"))) missing.Add("ConnectionStrings:DefaultConnection");
    if (string.IsNullOrWhiteSpace(config["PayPalSettings:ClientId"])) missing.Add("PayPalSettings:ClientId");
    if (string.IsNullOrWhiteSpace(config["PayPalSettings:ClientSecret"])) missing.Add("PayPalSettings:ClientSecret");

    // Validación CORS: en Production no se permite wildcard ni lista vacía
    var allowedOrigins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    if (app.Environment.IsProduction())
    {
        if (allowedOrigins.Length == 0) missing.Add("Cors:AllowedOrigins (no definido)");
        if (allowedOrigins.Length == 1 && allowedOrigins[0] == "*") missing.Add("Cors:AllowedOrigins (wildcard '*' no permitido en Production)");
    }

    if (missing.Count > 0)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogCritical("Faltan configuraciones obligatorias: {Missing}", string.Join(", ", missing));
        throw new InvalidOperationException("Faltan configuraciones obligatorias: " + string.Join(", ", missing));
    }
}

// 7. Pipeline HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // En producción, forzar HTTPS y HSTS
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // Permite servir imágenes de la carpeta wwwroot
app.UseRouting();
app.UseCors("DefaultCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Clase de configuración para las opciones de PayPal
public class PayPalSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
}