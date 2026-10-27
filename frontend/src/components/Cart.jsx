import api from '../lib/api';
import { getCurrentProductPricing } from '../lib/productPricing';
import { Link } from 'react-router-dom';

export default function Cart({ cart, removeFromCart, updateQuantity }) {
  const BASE_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-empty">
        <span aria-hidden="true">🛒</span>
        <h2>Tu carrito está vacío</h2>
        <p>Explora el catálogo y agrega los equipos que necesitas para tu proyecto.</p>
        <Link to="/" className="cart-empty-link">Explorar productos</Link>
        <style>{`
          .cart-empty-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            margin-top: 8px;
            padding: 0 18px;
            color: white;
            background: linear-gradient(135deg, #0d4768, #147da0);
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 800;
            text-decoration: none;
          }
          .cart-empty-link:hover {
            background: linear-gradient(135deg, #08796f, #13aa95);
          }
        `}</style>
      </div>
    );
  }

  const getImageUrl = (url) => {
    if (!url) return "https://placehold.co/60x60?text=No+Img";
    if (url.startsWith('http')) return url;
    const fileName = url.replaceAll('\\', '/').split('/').pop() || '';
    return `${BASE_URL}/productos/${fileName}`;
  };

  return (
    <div className="cart-panel">
      <style>{`
        .cart-panel {
          padding: clamp(14px, 2vw, 22px);
          background: rgba(255,255,255,0.96);
          box-sizing: border-box;
          animation: rise-in 450ms ease both;
        }
        .cart-panel h2 {
          margin: 0 0 6px !important;
          color: #0b2942 !important;
          font-family: "Aptos Display", "Segoe UI", sans-serif;
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          letter-spacing: -0.04em;
        }
        .cart-item-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #edf2f5;
          gap: 12px;
        }

        .cart-item-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
          min-width: 0;
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .cart-quantity-control {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          border: 1px solid #dce7ed;
          border-radius: 10px;
          background: #f8fafb;
        }
        .cart-quantity-control button {
          width: 30px;
          height: 30px;
          color: #12506e;
          background: white;
          border: 1px solid #e3ebef;
          border-radius: 7px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
        }
        .cart-quantity-control button:disabled {
          color: #a8b7c0;
          cursor: not-allowed;
          background: #f1f5f7;
        }
        .cart-quantity-control span {
          min-width: 28px;
          color: #173d56;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .cart-btn-remove {
          background: #fff;
          color: #9f3f3f;
          border: 1px solid #f0dada;
          padding: 7px 9px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }
        .cart-btn-remove:hover {
          background: #fff0f0;
          border-color: #e9bcbc;
        }
        .cart-item-stock {
          margin-top: 5px;
          color: #71889a;
          font-size: 0.76rem;
        }
        .cart-item-stock--unavailable {
          color: #b45309;
          font-weight: 700;
        }
        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 58px 20px;
          background: white;
          border: 1px solid #e1eaf0;
          border-radius: 20px;
          box-shadow: 0 14px 36px rgba(10,42,67,0.06);
          text-align: center;
        }
        .cart-empty > span {
          display: grid;
          place-items: center;
          width: 72px;
          height: 72px;
          margin-bottom: 14px;
          border-radius: 23px;
          background: #e5f8f4;
          font-size: 2rem;
        }
        .cart-empty h2 {
          margin: 0 0 7px;
          color: #15344d;
          font-size: 1.35rem;
        }
        .cart-empty p {
          max-width: 400px;
          color: #71889a;
          line-height: 1.6;
        }

        @media (max-width: 600px) {
          .cart-item-row {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .cart-item-controls {
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="cart-panel">
        {cart.map(item => {
          const pricing = getCurrentProductPricing(item);
          const quantity = Number(item.cantidad) || 1;
          const hasKnownStock = item.stock !== null && item.stock !== undefined && Number.isFinite(Number(item.stock));
          const stock = hasKnownStock ? Number(item.stock) : 0;
          const stockLimitReached = hasKnownStock && quantity >= stock;
          const unavailable = hasKnownStock && stock <= 0;
          const quantityExceedsStock = hasKnownStock && quantity > stock;
          return (
            <div key={item.productoId} className="cart-item-row">
              <div className="cart-item-info">
                <img
                  src={getImageUrl(item.urlImagen)}
                  alt={item.name || 'Producto'}
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/60x60?text=Error"; }}
                  style={{ width: '68px', height: '68px', objectFit: 'contain', borderRadius: '11px', border: '1px solid #e5eef2', background: '#f5f9fa', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontWeight: '700', color: '#2d3748', fontSize: '0.95rem', wordBreak: 'break-word' }}>{item.name || 'Producto'}</span>
                  {item.sku && <span style={{ color: '#71889a', fontSize: '0.76rem', marginTop: '3px' }}>SKU: {item.sku}</span>}
                  {pricing.offerActive && (
                    <span style={{ color: '#8293a0', fontSize: '0.78rem', textDecoration: 'line-through', marginTop: '5px' }}>
                      ${pricing.originalPrice.toLocaleString('es-MX')} MXN
                    </span>
                  )}
                  <span style={{ color: pricing.offerActive ? '#c24135' : '#718096', fontSize: '0.85rem', marginTop: '4px' }}>
                    ${pricing.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN{pricing.offerActive ? ` · ${pricing.discountPercentage}% desc.` : ''}
                  </span>
                  {hasKnownStock && (
                    <span className={`cart-item-stock${unavailable ? ' cart-item-stock--unavailable' : ''}`}>
                      {unavailable
                        ? 'Sin existencias; elimina el producto para continuar.'
                        : quantityExceedsStock
                          ? `Solo hay ${stock} disponible${stock === 1 ? '' : 's'}; reduce la cantidad.`
                          : `${stock} disponible${stock === 1 ? '' : 's'}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="cart-item-controls">
                <div className="cart-quantity-control" aria-label={`Cantidad de ${item.name || 'producto'}`}>
                  <button
                    type="button"
                    aria-label={`Quitar una unidad de ${item.name || 'producto'}`}
                    disabled={quantity <= 1}
                    onClick={() => updateQuantity(item.productoId, quantity - 1)}
                  >−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label={`Agregar una unidad de ${item.name || 'producto'}`}
                    disabled={stockLimitReached || unavailable}
                    onClick={() => updateQuantity(item.productoId, quantity + 1)}
                  >+</button>
                </div>
                <span style={{ fontWeight: '800', color: '#0c5474', minWidth: '100px', textAlign: 'right', fontSize: '0.9rem' }}>
                  ${(pricing.price * quantity).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                </span>
                <button
                  type="button"
                  className="cart-btn-remove"
                  aria-label={`Eliminar ${item.name || 'producto'} del carrito`}
                  onClick={() => removeFromCart(item.productoId)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}