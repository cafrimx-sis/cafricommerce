import React from 'react';

export default function Overview({ stats }) {
  if (!stats) return <p style={{ padding: '20px' }}>Cargando estadísticas...</p>;

  // Formato de moneda para las ventas
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(valor);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📊 Vista General</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        {/* Tarjeta: Usuarios */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Usuarios</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalUsuarios}</p>
        </div>

        {/* Tarjeta: Productos */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Productos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.totalProductos}</p>
        </div>

        {/* Tarjeta: Ventas del Mes */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #3182ce' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Ventas del Mes</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{formatearMoneda(stats.ventasDelMes)}</p>
        </div>

        {/* Tarjeta: Stock Bajo */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: stats.stockBajo > 0 ? '5px solid #e53e3e' : '5px solid #48bb78' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Stock Bajo</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats.stockBajo}</p>
        </div>
        
      </div>
    </div>
  );
}