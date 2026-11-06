using Ecommerce.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261106150000_AddBanxicoDailyExchangeRate")]
    public partial class AddBanxicoDailyExchangeRate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TiposCambioDiarios",
                columns: table => new
                {
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    PesosPorDolar = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: false),
                    ActualizadoUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Fuente = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_TiposCambioDiarios", x => x.Fecha));

            migrationBuilder.Sql("""
                UPDATE "Productos"
                SET "PrecioPublico" = ROUND("PrecioPublico" / 18.59, 2)
                WHERE "MonedaPrecio" = 'USD';
                """);

            migrationBuilder.InsertData(
                table: "TiposCambioDiarios",
                columns: new[] { "Fecha", "PesosPorDolar", "ActualizadoUtc", "Fuente" },
                values: new object[] { new DateOnly(2026, 11, 5), 18.59m, new DateTime(2026, 11, 5, 0, 0, 0, DateTimeKind.Utc), "Referencia inicial" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Productos"
                SET "PrecioPublico" = ROUND("PrecioPublico" * 18.59, 2)
                WHERE "MonedaPrecio" = 'USD';
                """);

            migrationBuilder.DropTable(name: "TiposCambioDiarios");
        }
    }
}
