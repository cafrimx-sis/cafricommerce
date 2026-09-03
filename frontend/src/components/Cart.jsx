import React from 'react';
import './Cart.css'; 

export default function Cart({ cart, removeFromCart, updateQuantity }) {
  const BASE_URL = 'http://localhost:5104';

  if (!cart || cart.length === 0) {
    return <div className="cart-container" style={{textAlign: 'center'}}><h2>Tu carrito está vacío</h2></div>;
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.cantidad), 0);

  const getImageUrl = (url) => {
    if (!url) return "https://placehold.co/60x60?text=No+Img";
    if (url.startsWith('http')) return url;
    
    const fileName = url.replace(/^.*[\\\/]/, ''); 
    return `${BASE_URL}/productos/${fileName}`;
  };

  return (
    <div className="cart-container">
      <h2>Carrito de Compras</h2>
      <div className="cart-list">
        {cart.map(item => (
          <div key={item.productoId} className="cart-item">
            <div className="item-info">
              <img 
                src={getImageUrl(item.urlImagen)} 
                alt={item.name} 
                className="item-thumbnail" 
                onError={(e) => { e.target.src = "https://placehold.co/60x60?text=Error"; }}
              />
              
              <div className="item-details">
                <span style={{fontWeight: '600'}}>{item.name}</span>
                <span className="item-price">${item.price.toLocaleString()} MXN</span>
              </div>
            </div>
            
            <div className="item-controls">
              <input 
                type="number" min="1"
                value={item.cantidad} 
                onChange={(e) => updateQuantity(item.productoId, parseInt(e.target.value) || 1)}
              />
              <span style={{fontWeight: '600'}}>${(item.price * item.cantidad).toLocaleString()} MXN</span>
              <button className="btn-remove" onClick={() => removeFromCart(item.productoId)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-footer">
        Total: ${total.toLocaleString()} MXN
      </div>
    </div>
  );
}