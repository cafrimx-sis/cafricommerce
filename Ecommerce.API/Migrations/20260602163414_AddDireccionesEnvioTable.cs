using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDireccionesEnvioTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DireccionesEnvio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Calle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    NumeroExterior = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NumeroInterior = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Colonia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Ciudad = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CodigoPostal = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TelefonoContacto = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DireccionesEnvio", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DireccionesEnvio");
        }
    }
}
