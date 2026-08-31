import React from 'react';

export default function Overview({ stats }) {
  if (!stats) return <p style={{ padding: '20px', color: '#718096' }}>Cargando estadísticas...</p>;

  // Formato de moneda para las ventas
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(valor || 0);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .overview-title {
          margin-bottom: 20px;
          color: #2d3748;
          font-size: 1.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .stat-card {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          border: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          color: #1a202c;
          word-break: break-word;
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .stat-card {
            padding: 16px;
          }

          .overview-title {
            font-size: 1.3rem;
            margin-bottom: 16px;
          }

          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <h2 className="overview-title">📊 Vista General</h2>
      
      <div className="stats-grid">
        
        {/* Tarjeta: Usuarios */}
        <div className="stat-card" style={{ borderLeft: '5px solid #4a5568' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            👥 Usuarios
          </h3>
          <p className="stat-value">{stats.totalUsuarios ?? 0}</p>
        </div>

        {/* Tarjeta: Productos */}
        <div className="stat-card" style={{ borderLeft: '5px solid #805ad5' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📦 Productos
          </h3>
          <p className="stat-value">{stats.totalProductos ?? 0}</p>
        </div>

        {/* Tarjeta: Ventas del Mes */}
        <div className="stat-card" style={{ borderLeft: '5px solid #3182ce' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💵 Ventas del Mes
          </h3>
          <p className="stat-value" style={{ color: '#2b6cb0' }}>
            {formatearMoneda(stats.ventasDelMes)}
          </p>
        </div>

        {/* Tarjeta: Stock Bajo */}
        <div 
          className="stat-card" 
          style={{ borderLeft: (stats.stockBajo > 0) ? '5px solid #e53e3e' : '5px solid #48bb78' }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚠️ Stock Bajo
          </h3>
          <p 
            className="stat-value" 
            style={{ color: (stats.stockBajo > 0) ? '#c53030' : '#276749' }}
          >
            {stats.stockBajo ?? 0}
          </p>
        </div>
        
      </div>
    </div>
  );
}