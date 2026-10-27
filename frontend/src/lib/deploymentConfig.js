const runtimeConfig = window.CAFRI_CONFIG || {};
const configuredApiUrl = runtimeConfig.apiBaseUrl || import.meta.env.VITE_API_BASE_URL;

export const apiBaseUrl = configuredApiUrl || (
  import.meta.env.DEV ? 'http://localhost:5104/api' : ''
);
export const paypalClientId =
  runtimeConfig.paypalClientId || import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

if (!import.meta.env.DEV) {
  if (!apiBaseUrl) {
    throw new Error('Configura apiBaseUrl en app-config.js antes de publicar el frontend.');
  }

  let parsedApiUrl;
  try {
    parsedApiUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error('apiBaseUrl debe ser una URL absoluta válida.');
  }

  if (parsedApiUrl.protocol !== 'https:') {
    throw new Error('apiBaseUrl debe usar HTTPS en producción.');
  }
}
