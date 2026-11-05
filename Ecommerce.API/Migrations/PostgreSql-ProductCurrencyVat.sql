START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105160531_AddProductCurrencyAndVat') THEN
    ALTER TABLE "Productos" ADD "AplicaIva" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105160531_AddProductCurrencyAndVat') THEN
    ALTER TABLE "Productos" ADD "MonedaPrecio" character varying(3) NOT NULL DEFAULT 'MXN';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105160531_AddProductCurrencyAndVat') THEN
    ALTER TABLE "Productos" ADD CONSTRAINT "CK_Productos_MonedaPrecio" CHECK ("MonedaPrecio" IN ('MXN', 'USD'));
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105160531_AddProductCurrencyAndVat') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261105160531_AddProductCurrencyAndVat', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105161536_AddVatToPhysicalSales') THEN
    ALTER TABLE "VentasFisicas" ADD "Iva" numeric(18,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261105161536_AddVatToPhysicalSales') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261105161536_AddVatToPhysicalSales', '10.0.12');
    END IF;
END $EF$;
COMMIT;

