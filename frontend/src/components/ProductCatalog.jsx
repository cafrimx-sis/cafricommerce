import React, { useState, useEffect } from 'react';
import api from '../lib/api'; // Asegúrate de que la ruta importe tu api.js centralizado

export default function ProductCatalog({ onAddToCart, cart = [] }) {
  const [products, setProducts] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categorias = ['Todos', 'Aire Acondicionado', 'Paquetes', 'Ventilación'];

  useEffect(() => {
    // Usamos la instancia 'api' para obtener los productos
    api.get('/productos')
      .then(res => { 
        setProducts(res.data); 
        setLoading(false); 
      })
      .catch(err => { 
        setError(err.message); 
        setLoading(false); 
      });
  }, []);

  const filteredProducts = products.filter(p => {
    const coincideBusqueda = (p.name || '').toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    return coincideBusqueda && coincideCat;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando catálogo...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      
      {/* Sidebar Lateral */}
      <aside style={{ width: '250px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: 'fit-content' }}>
        <h3 style={{ marginTop: 0 }}>Categorías</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {categorias.map(cat => (
            <li key={cat} 
                onClick={() => setSelectedCategory(cat)}
                style={{ 
                  padding: '10px', 
                  cursor: 'pointer', 
                  backgroundColor: selectedCategory === cat ? '#ebf8ff' : 'transparent',
                  color: selectedCategory === cat ? '#3182ce' : '#4a5568',
                  borderRadius: '4px',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal'
                }}>
              {cat}
            </li>
          ))}
        </ul>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1 }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar equipos por nombre..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', fontSize: '16px' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProducts.map(product => {
            const itemEnCarrito = cart.find(item => item.id === product.id);
            const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
            const sinStock = cantidadEnCarrito >= product.stock;

            return (
              <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }} />
                <h4 style={{ margin: '10px 0' }}>{product.name}</h4>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>${product.price.toLocaleString()} MXN</p>
                <button 
                  disabled={sinStock}
                  onClick={() => onAddToCart(product)}
                  style={{ 
                    width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer',
                    backgroundColor: sinStock ? '#a0aec0' : '#3182ce', color: 'white' 
                  }}>
                  {sinStock ? 'Sin stock' : 'Agregar al carrito'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}