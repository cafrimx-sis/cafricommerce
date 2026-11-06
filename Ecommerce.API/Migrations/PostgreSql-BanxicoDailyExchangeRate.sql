BEGIN;

CREATE TABLE IF NOT EXISTS "TiposCambioDiarios" (
    "Fecha" date PRIMARY KEY,
    "PesosPorDolar" numeric(18, 6) NOT NULL,
    "ActualizadoUtc" timestamp with time zone NOT NULL,
    "Fuente" character varying(40) NOT NULL
);

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "__EFMigrationsHistory"
        WHERE "MigrationId" = '20261106150000_AddBanxicoDailyExchangeRate'
    ) THEN
        UPDATE "Productos"
        SET "PrecioPublico" = ROUND("PrecioPublico" / 18.59, 2)
        WHERE "MonedaPrecio" = 'USD';

        INSERT INTO "TiposCambioDiarios" ("Fecha", "PesosPorDolar", "ActualizadoUtc", "Fuente")
        VALUES (DATE '2026-11-05', 18.59, CURRENT_TIMESTAMP, 'Referencia inicial')
        ON CONFLICT ("Fecha") DO NOTHING;

        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        VALUES ('20261106150000_AddBanxicoDailyExchangeRate', '10.0.12');
    END IF;
END
$migration$;

COMMIT;
