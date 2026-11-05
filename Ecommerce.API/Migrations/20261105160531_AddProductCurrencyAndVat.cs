using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCurrencyAndVat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AplicaIva",
                table: "Productos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MonedaPrecio",
                table: "Productos",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "MXN");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Productos_MonedaPrecio",
                table: "Productos",
                sql: "\"MonedaPrecio\" IN ('MXN', 'USD')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Productos_MonedaPrecio",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "AplicaIva",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "MonedaPrecio",
                table: "Productos");
        }
    }
}
