# Despliegue del frontend en HostGator

Este frontend es una aplicación React/Vite de archivos estáticos. En la
arquitectura prevista, la API ASP.NET Core y PostgreSQL se publican en Railway.
La base PostgreSQL debe recibir los datos de SQL Server mediante una transferencia
controlada antes de cambiar el tráfico. Consulta
[`Ecommerce.API/DEPLOYMENT-RAILWAY.md`](../Ecommerce.API/DEPLOYMENT-RAILWAY.md)
para preparar la API antes de conectar este sitio.

## Preparar los archivos

Desde PowerShell:

```powershell
Set-Location frontend
npm ci
npm run lint
npm run build
```

El resultado se genera en `frontend/dist`. No subas `node_modules` ni el código
fuente: sube **el contenido** de `dist` (incluidos los archivos ocultos como
`.htaccess`) al directorio público del dominio, normalmente `public_html`.
El archivo `.htaccess` proporciona fallback a `index.html` para que funcionen
las rutas de React al recargar una página.

## Configuración posterior a la subida

Edita `public_html/app-config.js` desde el administrador de archivos de
HostGator, o edita `frontend/public/app-config.js` antes de volver a compilar:

```js
window.CAFRI_CONFIG = {
  apiBaseUrl: "https://URL-PUBLICA-DE-LA-API/api",
  paypalClientId: "CLIENT-ID-PUBLICO-DE-PAYPAL"
};
```

`apiBaseUrl` debe ser la URL HTTPS pública de Railway, incluido `/api`. El
identificador de PayPal es público; nunca pongas el secreto de PayPal en este
archivo. La aplicación no inicia en producción si falta la URL HTTPS de la API.
Después de cambiar `app-config.js`, actualiza el parámetro `v` de su etiqueta en
`index.html` (por ejemplo, `?v=2`) y limpia la caché/CDN del hosting si aplica.

En cPanel, activa y verifica SSL para el dominio. Configura también el backend
para permitir en CORS el origen HTTPS exacto del frontend, por ejemplo
`https://www.tudominio.com`, sin ruta ni comodín.

## Moneda e IVA por producto

Cada producto se captura y se muestra en su moneda (MXN o USD). Los precios
USD se convierten a MXN con el tipo de cambio FIX más reciente de Banxico al
calcular órdenes, ventas del Punto de Venta y cargos PayPal. La aplicación
consulta la tasa al iniciar y cada hora; conserva en PostgreSQL la última
observación disponible si Banxico no responde. El frontend muestra la tasa y
fecha recibidas desde la API.

Al marcar **Aplicar IVA del 16%**, el precio capturado se considera antes de
IVA. La tienda lo suma al precio mostrado y la API calcula el impuesto en las
compras y en el Punto de Venta; allí el descuento se aplica antes de calcular
el IVA. Los productos existentes conservan moneda MXN y quedan sin IVA por
defecto. La tasa MXN/USD se obtiene de Banxico en el backend.

## Verificación

1. Abre el dominio y confirma que carga el catálogo sin errores.
2. Navega a una ruta interna y recarga; no debe responder 404 de Apache.
3. Confirma en la consola de red que las peticiones van a la API HTTPS correcta.
4. Comprueba precios en MXN y USD, productos con y sin IVA, carrito mixto,
   Punto de Venta con descuento e IVA, y que PayPal reciba siempre el total
   convertido a MXN.
5. Verifica registro, correo, inicio de sesión y flujos de compra usando PayPal
   Sandbox hasta que el backend, su base PostgreSQL y los datos transferidos, almacenamiento de imágenes,
   correo y webhook estén configurados.

No cambies PayPal a Live ni abras ventas al público hasta completar pruebas
integrales y verificar los datos importados y respaldados, las migraciones
aprobadas y el volumen persistente de imágenes de Railway.
