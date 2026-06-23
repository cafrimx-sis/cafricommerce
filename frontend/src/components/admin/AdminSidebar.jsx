import React from 'react';

export default function AdminSidebar({ adminView, setAdminView }) {
  return (
    <aside style={{ width: '260px', backgroundColor: '#2d3748', color: 'white', padding: '20px 0' }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button 
          onClick={() => setAdminView('overview')} 
          style={{ padding: '12px 20px', textAlign: 'left', background: adminView === 'overview' ? '#4a5568' : 'none', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px' }}
        >
          📊 Vista General
        </button>
        <button 
          onClick={() => setAdminView('products')} 
          style={{ padding: '12px 20px', textAlign: 'left', background: adminView === 'products' ? '#4a5568' : 'none', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px' }}
        >
          📦 CRUD de Artículos
        </button>
        <button 
          onClick={() => setAdminView('users')} 
          style={{ padding: '12px 20px', textAlign: 'left', background: adminView === 'users' ? '#4a5568' : 'none', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px' }}
        >
          👥 Control de Usuarios
        </button>
      </nav>
    </aside>
  );
}