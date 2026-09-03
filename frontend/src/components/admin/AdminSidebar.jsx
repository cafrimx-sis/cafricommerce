import React from 'react';

export default function AdminSidebar({ adminView, setAdminView }) {
  const menuItems = [
    { id: 'overview', label: '📊 Vista General' },
    { id: 'products', label: '📦 Artículos' },
    { id: 'categories', label: '🏷️ Gestión de Categorías' },
    { id: 'brands', label: '🏷️ Gestión de Marcas' },
    { id: 'users', label: '👥 Control de Usuarios' },
    { id: 'corte', label: '💵 Corte de Caja' }
  ];

  return (
    <aside style={{ width: '260px', backgroundColor: '#2d3748', color: 'white', padding: '20px 0', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {menuItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setAdminView(item.id)} 
            style={{ 
              padding: '12px 20px', 
              textAlign: 'left', 
              background: adminView === item.id ? '#4a5568' : 'none', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '15px',
              transition: 'background 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}