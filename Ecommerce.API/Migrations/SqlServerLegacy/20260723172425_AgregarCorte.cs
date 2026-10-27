using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCorte : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CortesCaja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaCorte = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FondoInicial = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalEfectivoSistema = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EfectivoContado = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Diferencia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalTarjeta = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalTransferencia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    GranTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalVentas = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CortesCaja", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VentasFisicas",
                columns: table => new
                {
                    VentaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MetodoPago = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Cliente = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CorteId = table.Column<int>(type: "int", nullable: true),
                    CorteCajaId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VentasFisicas", x => x.VentaId);
                    table.ForeignKey(
                        name: "FK_VentasFisicas_CortesCaja_CorteCajaId",
                        column: x => x.CorteCajaId,
                        principalTable: "CortesCaja",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "VentasFisicasDetalles",
                columns: table => new
                {
                    DetalleVentaId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VentaId = table.Column<int>(type: "int", nullable: false),
                    ProductoId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VentasFisicasDetalles", x => x.DetalleVentaId);
                    table.ForeignKey(
                        name: "FK_VentasFisicasDetalles_Productos_ProductoId",
                        column: x => x.ProductoId,
                        principalTable: "Productos",
                        principalColumn: "ProductoId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VentasFisicasDetalles_VentasFisicas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "VentasFisicas",
                        principalColumn: "VentaId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VentasFisicas_CorteCajaId",
                table: "VentasFisicas",
                column: "CorteCajaId");

            migrationBuilder.CreateIndex(
                name: "IX_VentasFisicasDetalles_ProductoId",
                table: "VentasFisicasDetalles",
                column: "ProductoId");

            migrationBuilder.CreateIndex(
                name: "IX_VentasFisicasDetalles_VentaId",
                table: "VentasFisicasDetalles",
                column: "VentaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VentasFisicasDetalles");

            migrationBuilder.DropTable(
                name: "VentasFisicas");

            migrationBuilder.DropTable(
                name: "CortesCaja");
        }
    }
}
