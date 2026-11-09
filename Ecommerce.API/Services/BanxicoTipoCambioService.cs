using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Ecommerce.API.Data;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.API.Services;

public sealed class BanxicoTipoCambioService : BackgroundService
{
    private const string SerieFix = "SF43718";
    private const string UrlSerie = "https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno";
    private static readonly TimeSpan IntervaloActualizacion = TimeSpan.FromHours(1);
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly TipoCambioService _tipoCambio;
    private readonly ILogger<BanxicoTipoCambioService> _logger;

    public BanxicoTipoCambioService(
        IHttpClientFactory httpClientFactory,
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        TipoCambioService tipoCambio,
        ILogger<BanxicoTipoCambioService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _tipoCambio = tipoCambio;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(IntervaloActualizacion);

        do
        {
            try
            {
                await CargarTipoCambioAsync(stoppingToken);
                await ActualizarDesdeBanxicoAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "No se pudo actualizar el tipo de cambio de Banxico.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CargarTipoCambioAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var ultimo = await db.TiposCambioDiarios
            .OrderByDescending(tipoCambio => tipoCambio.Fecha)
            .FirstOrDefaultAsync(cancellationToken);

        if (ultimo is not null)
        {
            _tipoCambio.Actualizar(new TipoCambioSnapshot(
                ultimo.PesosPorDolar,
                ultimo.Fecha,
                ultimo.ActualizadoUtc,
                ultimo.Fuente));
        }
    }

    private async Task ActualizarDesdeBanxicoAsync(CancellationToken cancellationToken)
    {
        var token = _configuration["Banxico:Token"];
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Banxico:Token no está configurado; se conservará el último tipo de cambio guardado.");
            return;
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, UrlSerie);
        request.Headers.Add("Bmx-Token", token);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var client = _httpClientFactory.CreateClient("Banxico");
        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "Banxico respondió con estado HTTP {StatusCode}; se conservará el último tipo de cambio guardado.",
                (int)response.StatusCode);
            return;
        }

        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);
        var dato = document.RootElement
            .GetProperty("bmx")
            .GetProperty("series")
            .EnumerateArray()
            .FirstOrDefault(serie => serie.GetProperty("idSerie").GetString() == SerieFix)
            .GetProperty("datos")
            .EnumerateArray()
            .FirstOrDefault();

        if (dato.ValueKind != JsonValueKind.Object ||
            !DateOnly.TryParseExact(
                dato.GetProperty("fecha").GetString(),
                "dd/MM/yyyy",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var fecha) ||
            !decimal.TryParse(
                dato.GetProperty("dato").GetString(),
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var pesosPorDolar) ||
            pesosPorDolar <= 0)
        {
            _logger.LogWarning("La respuesta de la serie {Serie} de Banxico no contiene una observación FIX válida.", SerieFix);
            return;
        }

        var actual = _tipoCambio.Actual;
        if (fecha < actual.Fecha)
        {
            _logger.LogWarning(
                "Banxico devolvió la observación {FechaBanxico}, anterior a la ya guardada {FechaGuardada}; no se reemplazará.",
                fecha,
                actual.Fecha);
            return;
        }

        var actualizadoUtc = DateTime.UtcNow;
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        const string fuente = "Banxico FIX";
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "TiposCambioDiarios" ("Fecha", "PesosPorDolar", "ActualizadoUtc", "Fuente")
            VALUES ({fecha}, {pesosPorDolar}, {actualizadoUtc}, {fuente})
            ON CONFLICT ("Fecha") DO UPDATE
            SET "PesosPorDolar" = EXCLUDED."PesosPorDolar",
                "ActualizadoUtc" = EXCLUDED."ActualizadoUtc",
                "Fuente" = EXCLUDED."Fuente";
            """, cancellationToken);

        _tipoCambio.Actualizar(new TipoCambioSnapshot(
            pesosPorDolar,
            fecha,
            actualizadoUtc,
            fuente));
        _logger.LogInformation(
            "Tipo de cambio Banxico FIX actualizado: {PesosPorDolar} MXN/USD para {Fecha}.",
            pesosPorDolar,
            fecha);
    }
}
