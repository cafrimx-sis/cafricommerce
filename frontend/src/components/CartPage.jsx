import React, { useState } from 'react';
import Cart from './Cart'; 
import Checkout from './Checkout'; 

export default function CartPage({ cart, setCart, removeFromCart, updateQuantity, user }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Aseguramos que cart siempre sea un array de forma segura
  const cartSafe = Array.isArray(cart) ? cart : [];

  // Cálculos financieros correctos (Subtotal, IVA 16%, Flete y Total general)
  const subtotal = cartSafe.reduce((acc, item) => {
    const precioItem = Number(item.precio || item.price || 0);
    const cantidadItem = Number(item.cantidad || 1);
    return acc + (precioItem * cantidadItem);
  }, 0);

  const iva = subtotal * 0.16;
  const flete = subtotal > 0 ? 250 : 0; // Costo de envío estándar o ajustable
  const total = subtotal + iva + flete;

  const clearCart = () => setCart([]);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', boxSizing: 'border-box' }}>
      {!isCheckingOut ? (
        <div>
          {/* Vista 1: Listado y gestión del carrito */}
          <Cart 
            cart={cartSafe} 
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity} 
          />
          
          {cartSafe.length > 0 && (
            <div style={{ 
              marginTop: '25px', 
              background: '#f8fafc', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.95rem' }}>
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.95rem' }}>
                <span>IVA (16%):</span>
                <span>${iva.toLocaleString()} MXN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.95rem' }}>
                <span>Envío / Flete estimado:</span>
                <span>${flete.toLocaleString()} MXN</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#cbd5e1', margin: '5px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>Total a Pagar:</span>
                <span style={{ color: '#004481' }}>${total.toLocaleString()} MXN</span>
              </div>

              <button 
                type="button"
                onClick={() => setIsCheckingOut(true)} 
                style={{
                  marginTop: '10px',
                  padding: '14px 20px', 
                  backgroundColor: '#004481', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  cursor: 'pointer', 
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(0, 68, 129, 0.2)'
                }}
              >
                Continuar compra (Dirección y Envío) →
              </button>
            </div>
          )}
        </div>
      ) : (
        // Vista 2: Flujo completo de Checkout (Dirección, Resumen y Pago BBVA)
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