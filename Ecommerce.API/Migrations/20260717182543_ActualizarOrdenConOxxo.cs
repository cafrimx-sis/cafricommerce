using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarOrdenConOxxo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Solo dejamos el cambio de tamaño de la columna que sí falta aplicar
            migrationBuilder.AlterColumn<string>(
                name: "EstadoOrden",
                table: "Ordenes",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revertimos el cambio de tamaño de la columna
            migrationBuilder.AlterColumn<string>(
                name: "EstadoOrden",
                table: "Ordenes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}