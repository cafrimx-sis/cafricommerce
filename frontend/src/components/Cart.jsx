import React from 'react';

export default function Cart({ cart, removeFromCart, updateQuantity }) {
  const BASE_URL = 'http://localhost:5104';

  if (!cart || cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#4a5568', margin: 0, fontSize: '1.25rem' }}>Tu carrito está vacío</h2>
      </div>
    );
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.cantidad), 0);

  const getImageUrl = (url) => {
    if (!url) return "https://placehold.co/60x60?text=No+Img";
    if (url.startsWith('http')) return url;
    const fileName = url.replace(/^.*[\\\/]/, ''); 
    return `${BASE_URL}/productos/${fileName}`;
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
      <style>{`
        .cart-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #edf2f7;
          gap: 12px;
        }

        .cart-item-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .cart-qty-input {
          width: 55px;
          padding: 6px;
          border-radius: 6px;
          border: 1px solid #cbd5e0;
          text-align: center;
          font-size: 14px;
        }

        .cart-btn-remove {
          background: #fed7d7;
          color: #9b2c2c;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        @media (max-width: 600px) {
          .cart-item-row {
            flex-direction: column;
            align-items: stretch;
          }
          .cart-item-controls {
            justify-content: space-between;
            margin-top: 8px;
            padding-left: 56px;
          }
        }
      `}</style>

      <h2 style={{ color: '#2d3748', margin: '0 0 16px 0', fontSize: '1.4rem' }}>Carrito de Compras</h2>
      
      <div>
        {cart.map(item => (
          <div key={item.productoId} className="cart-item-row">
            <div className="cart-item-info">
              <img 
                src={getImageUrl(item.urlImagen)} 
                alt={item.name} 
                onError={(e) => { e.target.src = "https://placehold.co/60x60?text=Error"; }}
                style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #edf2f7', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.95rem', wordBreak: 'break-word' }}>{item.name}</span>
                <span style={{ color: '#718096', fontSize: '0.85rem' }}>${item.price.toLocaleString()} MXN</span>
              </div>
            </div>
            
            <div className="cart-item-controls">
              <input 
                type="number" 
                min="1"
                value={item.cantidad} 
                onChange={(e) => updateQuantity(item.productoId, parseInt(e.target.value, 10) || 1)}
                className="cart-qty-input"
              />
              <span style={{ fontWeight: '700', color: '#2b6cb0', minWidth: '90px', textAlign: 'right', fontSize: '0.95rem' }}>
                ${(item.price * item.cantidad).toLocaleString()} MXN
              </span>
              <button type="button" className="cart-btn-remove" onClick={() => removeFromCart(item.productoId)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.25rem', fontWeight: '800', color: '#1a202c' }}>
        Total: ${total.toLocaleString()} MXN
      </div>
    </div>
  );
}