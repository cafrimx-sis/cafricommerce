-- Repair schema artifacts from the SQL Server-to-PostgreSQL DBeaver import.
-- Run only against the existing Railway database after taking a backup.
-- Imported timestamp values are interpreted as UTC, matching the API's
-- DateTime.UtcNow writes. FechaNacimiento is intentionally reduced to date.
BEGIN;

DO $repair$
DECLARE
    item record;
    actual_type text;
BEGIN
    FOR item IN
        SELECT *
        FROM (VALUES
            ('Categorias', 'Activo'),
            ('Marcas', 'Activo'),
            ('OrdenesDetalles', 'EsBajoPedido'),
            ('Productos', 'PermiteBajoPedido'),
            ('Productos', 'EsServicio'),
            ('Productos', 'EsDestacado'),
            ('Usuarios', 'Activo')
        ) AS columns_to_fix(table_name, column_name)
    LOOP
        SELECT data_type INTO actual_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = item.table_name
          AND column_name = item.column_name;

        IF actual_type = 'bit' THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ALTER COLUMN %I TYPE boolean USING (%I = B''1'')',
                'public', item.table_name, item.column_name, item.column_name);
        ELSIF actual_type IS DISTINCT FROM 'boolean' THEN
            RAISE EXCEPTION 'Unexpected type for %.%: %',
                item.table_name, item.column_name, actual_type;
        END IF;
    END LOOP;

    FOR item IN
        SELECT *
        FROM (VALUES
            ('CortesCaja', 'FechaCorte'),
            ('Ordenes', 'FechaOrden'),
            ('Pedidos', 'Fecha'),
            ('Productos', 'FechaCreacion'),
            ('Productos', 'OfertaFinUtc'),
            ('Productos', 'OfertaInicioUtc'),
            ('Productos', 'DestacadoFinUtc'),
            ('Productos', 'DestacadoInicioUtc'),
            ('SolicitudesFacturacion', 'FechaSolicitud'),
            ('Usuarios', 'FechaRegistro'),
            ('Usuarios', 'CodigoVerificacionExpira'),
            ('Usuarios', 'TokenRecuperacionExpira'),
            ('VentasFisicas', 'FechaCreacion')
        ) AS columns_to_fix(table_name, column_name)
    LOOP
        SELECT data_type INTO actual_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = item.table_name
          AND column_name = item.column_name;

        IF actual_type = 'timestamp without time zone' THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ALTER COLUMN %I TYPE timestamp with time zone USING %I AT TIME ZONE %L',
                'public', item.table_name, item.column_name, item.column_name, 'UTC');
        ELSIF actual_type IS DISTINCT FROM 'timestamp with time zone' THEN
            RAISE EXCEPTION 'Unexpected type for %.%: %',
                item.table_name, item.column_name, actual_type;
        END IF;
    END LOOP;

    SELECT data_type INTO actual_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Usuarios'
      AND column_name = 'FechaNacimiento';

    IF actual_type = 'timestamp without time zone' THEN
        ALTER TABLE public."Usuarios"
            ALTER COLUMN "FechaNacimiento" TYPE date
            USING "FechaNacimiento"::date;
    ELSIF actual_type IS DISTINCT FROM 'date' THEN
        RAISE EXCEPTION 'Unexpected type for Usuarios.FechaNacimiento: %', actual_type;
    END IF;

    SELECT data_type INTO actual_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Ordenes'
      AND column_name = 'InventarioReservado';

    IF actual_type IS NULL THEN
        ALTER TABLE public."Ordenes"
            ADD COLUMN "InventarioReservado" boolean NOT NULL DEFAULT false;
    ELSIF actual_type <> 'boolean' THEN
        RAISE EXCEPTION 'Unexpected type for Ordenes.InventarioReservado: %', actual_type;
    END IF;

    SELECT data_type INTO actual_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Ordenes'
      AND column_name = 'InventarioReservaExpiraUtc';

    IF actual_type IS NULL THEN
        ALTER TABLE public."Ordenes"
            ADD COLUMN "InventarioReservaExpiraUtc" timestamp with time zone;
    ELSIF actual_type <> 'timestamp with time zone' THEN
        RAISE EXCEPTION 'Unexpected type for Ordenes.InventarioReservaExpiraUtc: %', actual_type;
    END IF;
END
$repair$;

COMMIT;
