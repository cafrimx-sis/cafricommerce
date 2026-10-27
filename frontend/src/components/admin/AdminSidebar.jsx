import { useState } from 'react';

export default function AdminSidebar({ adminView, setAdminView }) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const menuItems = [
    { id: 'overview', icon: '◫', label: 'Vista general' },
    { id: 'orders', icon: '▤', label: 'Pedidos' },
    { id: 'products', icon: '▦', label: 'Artículos' },
    { id: 'categories', icon: '◇', label: 'Categorías' },
    { id: 'brands', icon: '⬡', label: 'Marcas' },
    { id: 'users', icon: '♙', label: 'Usuarios' },
    { id: 'corte', icon: '$', label: 'Corte de caja' },
    { id: 'facturacion', icon: '▧', label: 'Solicitudes de facturas' }
  ];

  const handleSelect = (id) => {
    setAdminView(id);
    setIsOpenMobile(false);
  };

  const currentItem = menuItems.find(m => m.id === adminView)?.label || 'Menú';

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: 276px;
          min-height: 100vh;
          padding: 24px 14px;
          color: white;
          background:
            radial-gradient(ellipse at 0 0, rgba(18, 184, 166, 0.15), transparent 22rem),
            linear-gradient(180deg, #0c2946, #071b30);
          flex-shrink: 0;
          transition: transform 0.28s ease-in-out;
          z-index: 100;
          box-sizing: border-box;
        }

        .admin-sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 8px 30px;
          padding: 4px 8px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .admin-sidebar-mark {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          place-items: center;
          border: 1px solid rgba(115, 225, 211, 0.45);
          border-radius: 14px;
          color: #b5fff4;
          background: linear-gradient(145deg, rgba(18, 184, 166, 0.26), rgba(23, 96, 138, 0.55));
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
          font-size: 1.3rem;
          font-weight: 800;
        }

        .admin-sidebar-brand strong {
          display: block;
          color: #fff;
          font-size: 1rem;
          letter-spacing: 0.02em;
        }

        .admin-sidebar-brand span {
          display: block;
          margin-top: 4px;
          color: #9db4c8;
          font-size: 0.75rem;
        }

        .admin-sidebar-section {
          margin: 0 12px 11px;
          color: #83a0b8;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .admin-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .admin-menu-item {
          position: relative;
          display: flex;
          width: 100%;
          min-height: 46px;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border: 1px solid transparent;
          border-radius: 12px;
          color: #c4d3df;
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 600;
          transition: color 160ms ease, background 160ms ease, border-color 160ms ease, transform 160ms ease;
        }

        .admin-menu-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.07);
          transform: translateX(2px);
        }

        .admin-menu-item.active {
          border-color: rgba(115, 225, 211, 0.17);
          color: #fff;
          background: linear-gradient(100deg, rgba(18, 184, 166, 0.2), rgba(18, 184, 166, 0.06));
          box-shadow: inset 3px 0 #12b8a6, 0 8px 18px rgba(0, 0, 0, 0.1);
        }

        .admin-menu-icon {
          display: grid;
          width: 29px;
          height: 29px;
          flex: 0 0 29px;
          place-items: center;
          border-radius: 9px;
          color: #a9c1d2;
          background: rgba(255, 255, 255, 0.07);
          font-size: 1rem;
          font-weight: 700;
        }

        .admin-menu-item.active .admin-menu-icon {
          color: #b5fff4;
          background: rgba(18, 184, 166, 0.18);
        }

        .admin-menu-chevron {
          margin-left: auto;
          color: #73e1d3;
          font-size: 1rem;
        }

        .admin-mobile-topbar {
          display: none;
        }

        .sidebar-backdrop {
          display: none;
        }

        @media (max-width: 768px) {
          .admin-mobile-topbar {
            display: flex;
            position: fixed;
            top: 87px;
            left: 0;
            width: 100%;
            height: 55px;
            background: rgba(7, 27, 48, 0.97);
            color: white;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 98;
            box-shadow: 0 8px 24px rgba(7, 27, 48, 0.18);
            box-sizing: border-box;
          }

          .mobile-menu-toggle {
            background: linear-gradient(135deg, #123d62, #17608a);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .admin-sidebar {
            position: fixed;
            top: 142px;
            bottom: 0;
            left: 0;
            height: auto;
            min-height: 0;
            width: 280px;
            transform: translateX(-100%);
            box-shadow: 12px 18px 34px rgba(7, 27, 48, 0.28);
            overflow-y: auto;
            overscroll-behavior-y: contain;
            -webkit-overflow-scrolling: touch;
            padding-top: 20px;
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .sidebar-backdrop.open {
            display: block;
            position: fixed;
            top: 142px;
            bottom: 0;
            left: 0;
            width: 100vw;
            border: 0;
            padding: 0;
            background-color: rgba(7, 27, 48, 0.52);
            z-index: 97;
            cursor: pointer;
          }

          .admin-sidebar-brand {
            margin-bottom: 22px;
          }
        }

        @media (max-width: 520px) {
          .admin-mobile-topbar {
            top: 79px;
          }

          .admin-sidebar {
            top: 134px;
          }

          .sidebar-backdrop.open {
            top: 134px;
          }
        }
      `}</style>

      {/* 📱 Barra superior exclusiva para móviles en el panel admin */}
      <div className="admin-mobile-topbar">
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
          Administración <span style={{ color: '#73e1d3' }}>·</span> {currentItem}
        </span>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          aria-expanded={isOpenMobile}
          aria-controls="admin-navigation"
        >
          {isOpenMobile ? '✕ Cerrar' : '☰ Menú'}
        </button>
      </div>

      <button
        type="button"
        className={`sidebar-backdrop ${isOpenMobile ? 'open' : ''}`}
        onClick={() => setIsOpenMobile(false)}
        aria-label="Cerrar menú de administración"
      />

      <aside id="admin-navigation" className={`admin-sidebar ${isOpenMobile ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-mark" aria-hidden="true">C</div>
          <div>
            <strong>CAFRI</strong>
            <span>Panel de administración</span>
          </div>
        </div>
        <div className="admin-sidebar-section">Espacio de trabajo</div>
        <nav className="admin-sidebar-nav" aria-label="Navegación de administración">
          {menuItems.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`admin-menu-item ${adminView === item.id ? 'active' : ''}`}
              aria-current={adminView === item.id ? 'page' : undefined}
            >
              <span className="admin-menu-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {adminView === item.id && <span className="admin-menu-chevron" aria-hidden="true">›</span>}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}