using System.Globalization;
using System.Text;

namespace Ecommerce.API.Services;

public sealed record CotizacionEnvio(string Zona, decimal CostoMxn, string EstadoDestino);

public sealed class TarifaEnvioService
{
    private static readonly HashSet<string> EstadosNorte =
    [
        "bajacalifornia",
        "bajacaliforniasur",
        "chihuahua",
        "coahuila",
        "durango",
        "nuevoleon",
        "sinaloa",
        "sonora",
        "tamaulipas"
    ];

    private static readonly HashSet<string> EstadosSur =
    [
        "aguascalientes",
        "campeche",
        "chiapas",
        "ciudaddemexico",
        "cdmx",
        "colima",
        "estadodemexico",
        "mexico",
        "edomex",
        "guanajuato",
        "guerrero",
        "hidalgo",
        "jalisco",
        "michoacan",
        "morelos",
        "nayarit",
        "oaxaca",
        "puebla",
        "queretaro",
        "quintanaroo",
        "sanluispotosi",
        "tabasco",
        "tlaxcala",
        "veracruz",
        "yucatan",
        "zacatecas"
    ];

    public bool TryCotizar(string? estado, out CotizacionEnvio? cotizacion)
    {
        var estadoNormalizado = Normalizar(estado);
        if (EstadosNorte.Contains(estadoNormalizado))
        {
            cotizacion = new CotizacionEnvio("Norte", 650m, estado?.Trim() ?? string.Empty);
            return true;
        }

        if (EstadosSur.Contains(estadoNormalizado))
        {
            cotizacion = new CotizacionEnvio("Sur", 450m, estado?.Trim() ?? string.Empty);
            return true;
        }

        cotizacion = null;
        return false;
    }

    private static string Normalizar(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return string.Empty;

        var descompuesto = valor.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var resultado = new StringBuilder(descompuesto.Length);
        foreach (var caracter in descompuesto)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(caracter) == UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsLetterOrDigit(caracter))
                resultado.Append(caracter);
        }

        return resultado.ToString();
    }
}
