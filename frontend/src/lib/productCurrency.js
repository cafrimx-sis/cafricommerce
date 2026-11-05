export const USD_TO_MXN_RATE = 18.59;
export const EXCHANGE_RATE_REFERENCE_DATE = '5/11/2026';
export const PRODUCT_VAT_RATE = 0.16;

export function getProductCurrency(product) {
  return product?.currency === 'USD' ? 'USD' : 'MXN';
}

export function convertPriceToMXN(amount, currency) {
  const value = Number(amount) || 0;
  return Math.round((currency === 'USD' ? value * USD_TO_MXN_RATE : value) * 100) / 100;
}

export function convertPriceFromMXN(amount, currency) {
  const value = Number(amount) || 0;
  return currency === 'USD'
    ? Math.round((value / USD_TO_MXN_RATE) * 100) / 100
    : value;
}

export function getPriceWithVAT(amount, appliesVAT) {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  return appliesVAT
    ? value + Math.round(value * PRODUCT_VAT_RATE * 100) / 100
    : value;
}

export function formatProductPrice(amount, currency) {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-MX', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}
