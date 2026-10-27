# Security and configuration

## Rotate credentials previously stored in the repository

The previous `appsettings.json` contained a JWT signing key, PayPal credentials,
and an SMTP password. Treat those values as compromised: rotate them with their
providers and do not reuse them. Removing a value from the current file does not
remove it from existing Git history.

## Backend configuration

The API fails during startup unless it receives a PostgreSQL connection string,
a JWT key of at least 32 bytes, PayPal client credentials, a JWT issuer/audience,
and explicit CORS origins. `appsettings.json` contains no deployment secrets.

For local development, set values as .NET user secrets from `Ecommerce.API`:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=cafri;Username=...;Password=..."
dotnet user-secrets set "Jwt:Key" "<new random key of at least 32 bytes>"
dotnet user-secrets set "PayPalSettings:ClientId" "<PayPal client ID>"
dotnet user-secrets set "PayPalSettings:ClientSecret" "<rotated PayPal secret>"
dotnet user-secrets set "EmailSettings:Password" "<rotated SMTP app password>"
dotnet user-secrets set "EmailSettings:Server" "smtp.gmail.com"
dotnet user-secrets set "EmailSettings:Port" "587"
dotnet user-secrets set "EmailSettings:SenderEmail" "<sender address>"
dotnet user-secrets set "PayPalSettings:WebhookId" "<PayPal webhook ID>"
dotnet user-secrets set "Cors:AllowedOrigins:0" "http://localhost:5173"
dotnet user-secrets set "Frontend:BaseUrl" "http://localhost:5173"
```

Set `PayPalSettings:Mode` to `Live` only when production PayPal credentials and
the matching webhook are configured. Configure `Cors:AllowedOrigins` with the
exact frontend origin(s); production origins must use HTTPS and cannot be
localhost. Use environment variables with `__` in place of `:` when deploying,
for example `Jwt__Key` and `PayPalSettings__ClientSecret`.

The webhook endpoint verifies each event signature through PayPal. Configure
the webhook ID in `PayPalSettings:WebhookId` and point PayPal to
`/api/paypal/webhook/paypal` (the former `/api/ordenes/webhook/paypal` path is
also accepted).

Registration, login, account verification, and password recovery are limited
to 10 requests per minute per client IP to reduce brute-force and email abuse.
Authenticated JWTs are checked against the current account status and role on
each request, so deleted, deactivated, or demoted accounts lose access
immediately.
The public chatbot endpoint is limited to 20 requests per minute per client IP,
accepts messages up to 500 characters, and caps product searches before
materializing results. Product cards returned by the chatbot can request
individual product details, including current offer price and stock.

PayPal orders reserve inventory atomically for up to 24 hours. The API releases
expired reservations in the background; apply the
`PaypalInventoryReservations` database migration before deploying this behavior.

## Frontend configuration

Copy `frontend/.env.example` to `frontend/.env.local`, then set
`VITE_API_BASE_URL` and the public `VITE_PAYPAL_CLIENT_ID`. The PayPal client ID
is public browser configuration; never put a PayPal client secret in the
frontend. Vite embeds `VITE_*` values in the built assets.

## Production rollout

Build the frontend with production values (see
`frontend/.env.production.example`). `VITE_API_BASE_URL` must point to the
public HTTPS API URL and `VITE_PAYPAL_CLIENT_ID` must be the client ID for the
same PayPal environment used by the API. Never use a localhost API URL in a
production build.

Configure these API application settings in the hosting provider's secret or
environment configuration, not in source control:

| Setting | Production value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | Production PostgreSQL connection string (overrides `DATABASE_URL`) |
| `Jwt__Key` | New random key of at least 32 bytes |
| `Jwt__Issuer`, `Jwt__Audience` | Stable API/client identifiers |
| `PayPalSettings__Mode` | `Sandbox` for staging; `Live` only after live verification |
| `PayPalSettings__ClientId`, `PayPalSettings__ClientSecret` | Credentials for the selected PayPal environment |
| `PayPalSettings__WebhookId` | Webhook ID registered for the matching environment |
| `EmailSettings__Server`, `EmailSettings__Port`, `EmailSettings__SenderEmail`, `EmailSettings__Password` | Verified production email provider settings |
| `Cors__AllowedOrigins__0` | Exact public frontend origin, including `https://` |
| `Frontend__BaseUrl` | Public frontend origin used in verification and recovery links |
| `ProductImages__StoragePath` | Absolute path on persistent storage mounted for the API |

Railway can provide `DATABASE_URL` instead of
`ConnectionStrings__DefaultConnection`; the API parses PostgreSQL URLs and
requires TLS. Production CORS origins must be HTTPS and cannot be localhost.
Apply database migrations as a separate, backed-up deployment step; do not
automatically run schema changes on every API startup. The active
`InitialPostgreSql` migration is for an empty PostgreSQL database and does not
transfer SQL Server data. Preserve a tested SQL Server backup, import data
separately, validate relationships and identity sequences, and verify a restore
before switching production traffic. The SQL Server migration history is
archived under `Migrations/SqlServerLegacy/` and is not executable on PostgreSQL.
In Development, product images default to
`wwwroot/productos`; other environments require `ProductImages__StoragePath`.
Mount persistent storage at that absolute path before enabling uploads. Hosts
without persistent filesystem volumes need an object-storage integration before
they can safely support product uploads.

Administrators can set a percentage offer or feature a product independently,
each with its own UTC-backed start and end time. Active offers and featured
products appear in the catalog carousel; a featured product may also have an
active offer. The API validates both periods and calculates the discounted unit
price when creating the PayPal order; client-submitted prices are never trusted.
Apply the `ProductOffers` and `FeaturedProducts` database migrations before
deploying these features.

Before switching to live payments, run the end-to-end checklist in staging:
registration and verification, password recovery, product image upload,
PayPal checkout and webhook reconciliation, order status/tracking, email
delivery, inventory updates, and database backup/restore.

## Build and database

```powershell
dotnet build Ecommerce.API
dotnet test Ecommerce.API.Tests
Set-Location Ecommerce.API
dotnet tool restore --tool-manifest dotnet-tools.json
dotnet ef migrations has-pending-model-changes
Set-Location ..\frontend
npm run lint
npm run build
```

`dotnet ef database update` applies migrations to the configured database. Run
it only against a disposable/empty PostgreSQL database or during a separately
approved and backed-up maintenance operation; never use it as an automatic
production startup step.
