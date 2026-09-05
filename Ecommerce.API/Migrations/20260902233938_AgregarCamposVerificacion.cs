using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecommerce.API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCamposVerificacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Activo",
                table: "Usuarios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CanalVerificacionPreferido",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CodigoVerificacion",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CodigoVerificacionExpira",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TokenRecuperacion",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenRecuperacionExpira",
                table: "Usuarios",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Activo",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CanalVerificacionPreferido",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CodigoVerificacion",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "CodigoVerificacionExpira",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TokenRecuperacion",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "TokenRecuperacionExpira",
                table: "Usuarios");
        }
    }
}
