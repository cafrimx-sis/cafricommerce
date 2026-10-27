import { useState } from 'react';
import { Link } from 'react-router-dom';
import Cart from './Cart'; 
import Checkout from './Checkout'; 
import { getCurrentProductPricing } from '../lib/productPricing';

export default function CartPage({ cart, setCart, removeFromCart, updateQuantity, user }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartSafe = Array.isArray(cart) ? cart : [];
  const total = cartSafe.reduce((acc, item) => acc + (getCurrentProductPricing(item).price * (Number(item.cantidad) || 1)), 0);
  const totalItems = cartSafe.reduce((acc, item) => acc + (Number(item.cantidad) || 1), 0);
  const hasStockIssues = cartSafe.some(item => {
    if (item.stock === null || item.stock === undefined || !Number.isFinite(Number(item.stock))) return false;
    return Number(item.stock) < (Number(item.cantidad) || 1);
  });
  const clearCart = () => setCart([]);

  return (
    <div className="cart-page">
      <style>{`
        .cart-page {
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(22px, 4vw, 48px) clamp(14px, 3vw, 28px);
          box-sizing: border-box;
        }
        .cart-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }
        .cart-page-heading h1 {
          margin: 0 0 6px;
          color: #0b2942;
          font-size: clamp(1.7rem, 3vw, 2.35rem);
          font-weight: 800;
          letter-spacing: -0.05em;
        }
        .cart-page-heading p {
          color: #71889a;
          font-size: 0.95rem;
        }
        .cart-page-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(270px, 330px);
          align-items: start;
          gap: 20px;
        }
        .cart-summary {
          position: sticky;
          top: 94px;
          padding: 22px;
          background: rgba(255,255,255,0.97);
          border: 1px solid #e1eaf0;
          border-radius: 18px;
          box-shadow: 0 14px 36px rgba(10,42,67,0.07);
        }
        .cart-summary h2 {
          margin: 0 0 18px;
          color: #0b2942;
          font-size: 1.15rem;
        }
        .cart-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 0;
          color: #61798c;
          border-bottom: 1px solid #edf2f5;
          font-size: 0.9rem;
        }
        .cart-summary-row strong {
          color: #173d56;
        }
        .cart-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          padding: 18px 0 4px;
          color: #0b2942;
          font-weight: 800;
        }
        .cart-summary-total strong {
          color: #0c5474;
          font-size: 1.45rem;
          letter-spacing: -0.04em;
        }
        .cart-summary-note {
          margin: 12px 0 0;
          color: #71889a;
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .cart-continue-link {
          display: inline-flex;
          margin-top: 14px;
          color: #147d89;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
        }
        .cart-continue-link:hover {
          text-decoration: underline;
        }
        .checkout-security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          color: #087b70;
          background: #e7f8f4;
          border: 1px solid #d1eee7;
          border-radius: 9px;
          font-size: 0.78rem;
          font-weight: 800;
          white-space: nowrap;
        }
        .cart-checkout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 16px;
          min-height: 54px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #0d4768, #147da0);
          color: white;
          border: 0;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 10px 23px rgba(18, 91, 132, 0.2);
        }
        .cart-checkout-button:hover {
          background: linear-gradient(135deg, #08796f, #13aa95);
          box-shadow: 0 13px 25px rgba(18, 164, 139, 0.24);
          transform: translateY(-2px);
        }
        .cart-checkout-button:disabled {
          background: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        .cart-stock-warning {
          margin: 12px 0 0;
          color: #9a3412;
          font-size: 0.82rem;
          line-height: 1.5;
        }
        @media (max-width: 600px) {
          .cart-page-heading {
            flex-direction: column;
            align-items: flex-start;
          }
          .cart-page-layout {
            grid-template-columns: 1fr;
          }
          .cart-summary {
            position: static;
          }
        }
      `}</style>

      {!isCheckingOut ? (
        <div>
          <>
            <div className="cart-page-heading">
              <div>
                <h1>Tu carrito</h1>
                <p>Revisa las cantidades y el total antes de continuar.</p>
              </div>
              {cartSafe.length > 0 && (
                <span className="checkout-security-note"><span aria-hidden="true">✦</span> Pago protegido por PayPal</span>
              )}
            </div>
            {cartSafe.length > 0 ? (
              <div className="cart-page-layout">
                <Cart
                  cart={cartSafe}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                />
                <aside className="cart-summary" aria-label="Resumen del pedido">
                  <h2>Resumen del pedido</h2>
                  <div className="cart-summary-row">
                    <span>Productos</span>
                    <strong>{totalItems}</strong>
                  </div>
                  <div className="cart-summary-total">
                    <span>Total</span>
                    <strong>${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</strong>
                  </div>
                  <p className="cart-summary-note">El costo de envío y las opciones de pago se mostrarán en el siguiente paso.</p>
                  {hasStockIssues && (
                    <p className="cart-stock-warning">Ajusta las cantidades al inventario disponible para continuar.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(true)}
                    className="cart-checkout-button"
                    disabled={hasStockIssues}
                  >
                    Continuar al envío y pago <span aria-hidden="true">→</span>
                  </button>
                  <Link to="/" className="cart-continue-link">← Seguir comprando</Link>
                </aside>
              </div>
            ) : (
              <Cart
                cart={cartSafe}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
              />
            )}
          </>
        </div>
      ) : (
        <Checkout 
          cart={cartSafe} 
          total={total} 
          clearCart={clearCart} 
          user={user} 
          onBackToCart={() => setIsCheckingOut(false)} 
        />
      )}
    </div>
  );
}