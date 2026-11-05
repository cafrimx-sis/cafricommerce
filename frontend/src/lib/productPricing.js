import { getPriceWithVAT, PRODUCT_VAT_RATE } from './productCurrency';

export function getCurrentProductPricing(product, now = Date.now()) {
  const originalPrice = Number(product.originalPrice ?? product.precioPublico ?? product.price ?? 0);
  const discountPercentage = Number(product.discountPercentage ?? 0);
  const startsAt = product.offerStartUtc ? Date.parse(product.offerStartUtc) : Number.NaN;
  const endsAt = product.offerEndUtc ? Date.parse(product.offerEndUtc) : Number.NaN;
  const hasOfferPeriod = discountPercentage > 0 &&
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt);
  const offerActive = hasOfferPeriod && startsAt <= now && now < endsAt;
  const price = offerActive
    ? Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100
    : hasOfferPeriod
      ? originalPrice
      : Number(product.price ?? product.precioPublico ?? originalPrice);

  return { offerActive, originalPrice, price, discountPercentage };
}

export function getCustomerProductPrice(product, price) {
  return getPriceWithVAT(price, Boolean(product?.aplicaIva));
}

export function getPosVat(items, discountPercentage = 0) {
  const discountFactor = 1 - Number(discountPercentage || 0) / 100;
  return items.reduce((total, item) => {
    if (!item.aplicaIva) return total;
    const discountedSubtotal = item.precioUnitario * item.cantidad * discountFactor;
    return total + Math.round((discountedSubtotal * PRODUCT_VAT_RATE + Number.EPSILON) * 100) / 100;
  }, 0);
}
