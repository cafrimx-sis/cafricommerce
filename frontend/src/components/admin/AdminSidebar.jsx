import React, { useState } from 'react';

export default function AdminSidebar({ adminView, setAdminView }) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const menuItems = [
    { id: 'overview', label: '📊 Vista General' },
    { id: 'products', label: '📦 Artículos' },
    { id: 'categories', label: '🏷️ Gestión de Categorías' },
    { id: 'brands', label: '🏷️ Gestión de Marcas' },
    { id: 'users', label: '👥 Control de Usuarios' },
    { id: 'corte', label: '💵 Corte de Caja' }
  ];

  const handleSelect = (id) => {
    setAdminView(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: 260px;
          background-color: #2d3748;
          color: white;
          padding: 20px 0;
          min-height: 100vh;
          flex-shrink: 0;
          transition: transform 0.3s ease-in-out;
          z-index: 100;
        }

        .mobile-menu-btn {
          display: none;
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #2b6cb0;
          color: white;
          border: none;
          border-radius: 50%;
          width: 52px;
          height: 52px;
          font-size: 22px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 101;
          align-items: center;
          justify-content: center;
        }

        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 280px;
            transform: translateX(-100%);
            box-shadow: 2px 0 15px rgba(0,0,0,0.4);
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .sidebar-backdrop.open {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0,0,0,0.5);
            z-index: 99;
          }
        }
      `}</style>

      {/* Botón flotante para abrir/cerrar en móviles */}
      <button 
        type="button"
        className="mobile-menu-btn"
        onClick={() => setIsOpenMobile(!isOpenMobile)}
        aria-label="Alternar menú"
      >
        {isOpenMobile ? '✕' : '☰'}
      </button>

      {/* Fondo oscuro al abrir en móviles */}
      <div 
        className={`sidebar-backdrop ${isOpenMobile ? 'open' : ''}`}
        onClick={() => setIsOpenMobile(false)}
      />

      <aside className={`admin-sidebar ${isOpenMobile ? 'open' : ''}`}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {menuItems.map(item => (
            <button 
              type="button"
              key={item.id}
              onClick={() => handleSelect(item.id)} 
              style={{ 
                padding: '14px 20px', 
                textAlign: 'left', 
                background: adminView === item.id ? '#4a5568' : 'none', 
                color: 'white', 
                border: 'none', 
                borderLeft: adminView === item.id ? '4px solid #4299e1' : '4px solid transparent',
                cursor: 'pointer', 
                fontSize: '15px',
                transition: 'all 0.2s',
                display: 'block',
                width: '100%'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}