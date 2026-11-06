# Desplegar la API en Railway

La arquitectura prevista es:

- Frontend React/Vite publicado en HostGator.
- API ASP.NET Core 10 publicada en Railway.
- Base de datos PostgreSQL administrada por Railway.

La API usa EF Core con Npgsql. La migración `InitialPostgreSql` crea el esquema
en una base PostgreSQL vacía; no copia los datos de SQL Server ni debe ejecutarse
sobre la base de producción existente.

## Crear el servicio

1. Sube el repositorio a GitHub sin incluir secretos, `.env` locales, `bin`,
   `obj` ni `node_modules`.
2. En Railway, crea un proyecto y despliega el repositorio como servicio.
3. Configura el **Root Directory** como `/` y usa el `Dockerfile` de la raíz.
4. Genera un dominio público HTTPS para el servicio de API.
5. Agrega un volumen persistente montado en `/data`. La API guardará las
   imágenes en `/data/productos`.

El contenedor escucha en el puerto asignado por Railway mediante `PORT`.

## Base de datos y variables del servicio API

Agrega PostgreSQL al proyecto de Railway y conecta su variable `DATABASE_URL`
al servicio de la API. La API convierte URLs `postgres://`/`postgresql://` a
una cadena Npgsql y exige TLS. También admite `ConnectionStrings__DefaultConnection`,
que tiene prioridad si está configurada.

Configura estos valores en las variables del servicio de Railway; no los guardes
en el repositorio:

| Variable | Valor |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `DATABASE_URL` | Referencia a la URL PostgreSQL del servicio de Railway |
| `Jwt__Key` | Clave nueva, aleatoria, con al menos 32 bytes |
| `Jwt__Issuer` | Emisor JWT estable, por ejemplo `CafriApi` |
| `Jwt__Audience` | Audiencia JWT estable, por ejemplo `CafriFrontend` |
| `Cors__AllowedOrigins__0` | Origen exacto del frontend, por ejemplo `https://www.tudominio.com` |
| `Frontend__BaseUrl` | URL HTTPS pública del frontend, sin ruta |
| `ProductImages__StoragePath` | `/data/productos` |
| `PayPalSettings__Mode` | `Sandbox` durante las pruebas; `Live` solo tras validarlas |
| `PayPalSettings__ClientId` | Client ID del entorno PayPal seleccionado |
| `PayPalSettings__ClientSecret` | Secreto del entorno PayPal seleccionado |
| `PayPalSettings__WebhookId` | ID del webhook PayPal del mismo entorno |
| `Banxico__Token` | Token privado de la API SIE de Banxico |
| `EmailSettings__ResendApiKey` | Clave API secreta de Resend (`re_...`) |
| `EmailSettings__SenderEmail` | Correo remitente verificado |
| `EmailSettings__SenderName` | Nombre del remitente |
| `EmailSettings__AccountingEmail` | (Opcional) correo para notificaciones de facturación |

El envío de correo usa la API HTTPS de Resend, no SMTP. Railway Hobby/Free
bloquea conexiones SMTP salientes. Crea una clave API en Resend y verifica el
dominio del remitente para enviar a otros destinatarios; `onboarding@resend.dev`
solo sirve para pruebas limitadas a la dirección asociada a Resend. Guarda la
clave únicamente en las variables del servicio Railway y nunca en el frontend.

No configures simultáneamente `ConnectionStrings__DefaultConnection` con una
cadena SQL Server: esa variable prevalece sobre `DATABASE_URL`. No compartas
credenciales de base de datos en el repositorio ni por chat.

La API consulta el tipo de cambio FIX de Banxico (serie `SF43718`) al iniciar y
cada seis horas. Guarda el token SIE solo en `Banxico__Token` en las variables
privadas del servicio Railway. Si Banxico no está disponible, la API conserva
el último tipo de cambio guardado en PostgreSQL; revisa los logs por advertencias
de actualización. La migración inicial conserva la antigua referencia fija de
18.59 hasta recibir una observación oficial; la API expone la fuente y la fecha
para distinguirla de una tasa FIX actualizada.

## Esquema y transferencia de datos

La migración activa crea el esquema PostgreSQL desde cero e incluye las tablas
que usa actualmente la API, incluidas las reservas de inventario PayPal. El
historial anterior de SQL Server se conserva en
`Migrations/SqlServerLegacy/` como referencia; no es ejecutable sobre PostgreSQL.

La migración `Migrations/PostgreSql-ProductCurrencyVat.sql` añade moneda por
producto e IVA (incluido el Punto de Venta) a una base Railway existente.
Asegúrate de que ya esté aplicada antes de continuar: añade `MonedaPrecio`
(MXN para los productos existentes), `AplicaIva` (false para los existentes)
y `Iva` en `VentasFisicas` (0 para las ventas existentes), además de registrar
las migraciones.

Para activar la tasa diaria de Banxico, respalda la base y ejecuta una sola vez
`Migrations/PostgreSql-BanxicoDailyExchangeRate.sql` en el mismo Query Tool
antes de desplegar la API y el frontend actualizados. El script crea el historial
de tipos de cambio, registra la migración y convierte los precios USD existentes
de MXN a su importe base en USD usando la tasa anterior de 18.59. Los precios
MXN y los importes históricos de pedidos/ventas no se modifican. Configura
`Banxico__Token` en Railway y confirma en los logs que la API guardó una
observación `Banxico FIX`; el endpoint público
`/api/productos/tipo-cambio` muestra la última tasa y su fecha. No vuelvas a
ejecutar `PostgreSql-Initial.sql` sobre una base existente. Despliega la API
actualizada solo después de aplicar la migración de moneda/IVA si aún faltaba y
la migración de Banxico.

Si la base se creó importando desde SQL Server con DBeaver y el registro falla
por columnas `bit` o faltan campos de reserva, primero confirma que tienes un
respaldo y ejecuta una sola vez
`Migrations/PostgreSql-RepairImportedSqlServerSchema.sql` en Query Tool. El
script valida los tipos y ejecuta los cambios en una transacción: convierte
columnas `bit` a `boolean`, normaliza las fechas importadas como UTC, convierte
`Usuarios.FechaNacimiento` a `date` y agrega los campos de reserva ausentes en
`Ordenes`. Se asume que las marcas de tiempo importadas representan UTC, como
las fechas que guarda la API. Si el script genera una excepción, la transacción
se revierte; no continúes con el despliegue hasta revisar el mensaje.

La base de SQL Server existente contiene datos importantes y no se ha leído,
respaldado ni modificado desde este proyecto. El usuario realizó una
transferencia manual con DBeaver a PostgreSQL; su esquema y la integridad de
los datos todavía deben validarse. Antes de cambiar el tráfico:

1. Haz y prueba un respaldo recuperable de SQL Server.
2. Si preparas una migración nueva, crea una base PostgreSQL vacía y aplica
   `InitialPostgreSql` por separado. No la apliques sobre una base con datos.
3. Si vuelves a transferir datos, usa una herramienta controlada que respete el
   orden de dependencias y los identificadores. PostgreSQL distingue
   mayúsculas de minúsculas en identificadores entrecomillados; usa los nombres
   exactos definidos en la migración.
4. Convierte los valores de fecha/hora a UTC para columnas `timestamp with time
   zone`; `FechaNacimiento` se almacena como `date`.
5. Valida conteos, relaciones, inventario, pedidos y ventas, y ensaya una
   restauración.
6. Cambia el tráfico solo después de aprobar las validaciones y conserva SQL
   Server y sus respaldos hasta confirmar la operación.

No ejecutes `dotnet ef database update` automáticamente al iniciar la API.
No se ha conectado este repositorio a ninguna base real ni se ha aplicado
ninguna migración.

## Conectar HostGator con Railway

Cuando Railway muestre el dominio HTTPS de la API, configura
`frontend/public/app-config.js` antes de compilar/subir, o edita el archivo en
`public_html` después de subir:

```js
window.CAFRI_CONFIG = {
  apiBaseUrl: "https://DOMINIO-PUBLICO-DE-RAILWAY/api",
  paypalClientId: "CLIENT-ID-PUBLICO-DE-PAYPAL"
};
```

Configura `Cors__AllowedOrigins__0` en Railway con el origen exacto de HostGator
(incluyendo `https://`, sin `/api` ni comodín). El ID del cliente PayPal es
público; nunca pongas `PayPalSettings__ClientSecret` en el frontend.

## Pruebas previas a producción

- Confirma que Railway inicia sin errores y que la API puede leer la base.
- Desde HostGator, comprueba catálogo, registro, verificación por correo e inicio
  de sesión.
- Comprueba que los datos importados coincidan con SQL Server antes de habilitar
  escrituras o compras en producción.
- Confirma que una imagen cargada sigue disponible después de un redeploy.
- Prueba inventario y compras únicamente con PayPal Sandbox; confirma también
  el webhook, vencimiento de reservas y recuperación de existencias.
- Revisa el dominio HTTPS, CORS, logs y restauración de ambos respaldos.
- Cambia PayPal a `Live` solo después de aprobar las pruebas integrales.
