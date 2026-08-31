import React, { useState } from 'react';
import Cart from './Cart'; 
import Checkout from './Checkout'; 

export default function CartPage({ cart, setCart, removeFromCart, updateQuantity, user }) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const cartSafe = Array.isArray(cart) ? cart : [];
  const total = cartSafe.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
  const clearCart = () => setCart([]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
      {!isCheckingOut ? (
        <div>
          <Cart 
            cart={cartSafe} 
            removeFromCart={removeFromCart} 
            updateQuantity={updateQuantity} 
          />
          
          {cartSafe.length > 0 && (
            <button 
              type="button"
              onClick={() => setIsCheckingOut(true)} 
              style={{
                marginTop: '20px',
                padding: '14px 20px', 
                backgroundColor: '#004481', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '1rem', 
                cursor: 'pointer', 
                width: '100%',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}
            >
              Continuar compra (Dirección y Envío)
            </button>
          )}
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