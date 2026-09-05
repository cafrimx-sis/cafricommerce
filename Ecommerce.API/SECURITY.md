Seguridad y gestión de secretos para el proyecto Ecommerce.API

Resumen
- Los secretos (Jwt:Key, credenciales PayPal, ConnectionStrings) han sido removidos de appsettings.json.
- Durante desarrollo use dotnet user-secrets; en producción use variables de entorno o un vault (Azure Key Vault, AWS Secrets Manager, etc.).

Comandos útiles (en la carpeta Ecommerce.API)

1) Inicializar user-secrets (solo para proyectos con UserSecretsId)
   dotnet user-secrets init

2) Guardar secretos en user-secrets (ejemplo PowerShell)
   dotnet user-secrets set "Jwt:Key" "tu-llave-secreta-aqui"
   dotnet user-secrets set "PayPalSettings:ClientId" "tu-client-id"
   dotnet user-secrets set "PayPalSettings:ClientSecret" "tu-client-secret"
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=...;User Id=...;Password=...;"

3) Usar variables de entorno (PowerShell)
   $Env:Jwt__Key = "tu-llave-secreta"
   $Env:PayPalSettings__ClientId = "tu-client-id"
   $Env:PayPalSettings__ClientSecret = "tu-client-secret"
   $Env:ConnectionStrings__DefaultConnection = "Server=...;Database=...;User Id=...;Password=...;"

Notas
- Para que ASP.NET Core lea variables de entorno con estructura, reemplace ':' por '__' (doble guión bajo).
- Nunca comitees secretos al repositorio. Añade reglas en .gitignore si es necesario.
- En despliegue en Azure App Service o contenedores, configura las variables de entorno en la plataforma.

Control de CORS
- Se añadió la configuración Cors:AllowedOrigins en appsettings.json y Program.cs ahora lee los orígenes permitidos desde configuración.
- En Production la aplicación fallará si Cors:AllowedOrigins está vacío o contiene el wildcard "*"; define explícitamente los dominios permitidos.

Cambios aplicados en este repo
- frontend/.env ha sido añadido a .gitignore para evitar fugas accidentales del frontend.
- Program.cs ahora valida al arranque que las siguientes configuraciones existan: Jwt:Key, ConnectionStrings:DefaultConnection, PayPalSettings:ClientId y PayPalSettings:ClientSecret. Si faltan, la aplicación fallará al iniciar para evitar ejecutar en un estado inseguro.

Construcción y actualización de base de datos
- Compilar: dotnet build Ecommerce.API
- Actualizar migraciones en base de datos (asegúrate de tener la cadena de conexión configurada): dotnet ef database update --project Ecommerce.API
