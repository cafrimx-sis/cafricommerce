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
| `EmailSettings__Server` | Servidor SMTP |
| `EmailSettings__Port` | Puerto SMTP |
| `EmailSettings__SenderEmail` | Correo remitente verificado |
| `EmailSettings__SenderName` | Nombre del remitente |
| `EmailSettings__Password` | Credencial SMTP protegida |

No configures simultáneamente `ConnectionStrings__DefaultConnection` con una
cadena SQL Server: esa variable prevalece sobre `DATABASE_URL`. No compartas
credenciales de base de datos en el repositorio ni por chat.

## Esquema y transferencia de datos

La migración activa crea el esquema PostgreSQL desde cero e incluye las tablas
que usa actualmente la API, incluidas las reservas de inventario PayPal. El
historial anterior de SQL Server se conserva en
`Migrations/SqlServerLegacy/` como referencia; no es ejecutable sobre PostgreSQL.

La base de SQL Server existente contiene datos importantes y no se ha leído,
respaldado ni modificado desde este proyecto. La transferencia de datos todavía
no se ha realizado. Antes de cambiar el tráfico:

1. Haz y prueba un respaldo recuperable de SQL Server.
2. Crea una base PostgreSQL vacía y aplica `InitialPostgreSql` como paso de
   mantenimiento independiente. No la apliques sobre una base con datos.
3. Exporta e importa los datos con una herramienta de migración controlada,
   respetando el orden de dependencias y los identificadores. PostgreSQL
   distingue mayúsculas de minúsculas en identificadores entrecomillados; usa
   los nombres exactos de las tablas y columnas definidos en la migración.
4. Convierte los valores de fecha/hora a UTC para columnas `timestamp with time
   zone`; `FechaNacimiento` se almacena como `date`.
5. Reinicia las secuencias/identidades después de importar, valida conteos,
   relaciones, inventario, pedidos y ventas, y ensaya una restauración.
6. Cambia el tráfico solo después de aprobar las validaciones y conserva SQL
   Server y su respaldo hasta confirmar la operación.

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
