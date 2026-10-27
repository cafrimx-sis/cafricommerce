using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class pruebamigracion1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Marcas_MainMarcaId",
                table: "Productos");

            migrationBuilder.RenameColumn(
                name: "MainMarcaId",
                table: "Productos",
                newName: "MainMarcadId");

            migrationBuilder.RenameIndex(
                name: "IX_Productos_MainMarcaId",
                table: "Productos",
                newName: "IX_Productos_MainMarcadId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Marcas_MainMarcadId",
                table: "Productos",
                column: "MainMarcadId",
                principalTable: "Marcas",
                principalColumn: "MarcaId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Marcas_MainMarcadId",
                table: "Productos");

            migrationBuilder.RenameColumn(
                name: "MainMarcadId",
                table: "Productos",
                newName: "MainMarcaId");

            migrationBuilder.RenameIndex(
                name: "IX_Productos_MainMarcadId",
                table: "Productos",
                newName: "IX_Productos_MainMarcaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Marcas_MainMarcaId",
                table: "Productos",
                column: "MainMarcaId",
                principalTable: "Marcas",
                principalColumn: "MarcaId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
