import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProductCatalog from './components/ProductCatalog';
import ProductDetail from './components/ProductDetail';
import Login from './components/Login';
import Registro from './components/Registro';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CartPage from './components/CartPage';
import PuntoDeVenta from './components/PuntoDeVenta';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser) : null; } 
    catch (e) { return null; }
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    try { return savedCart ? JSON.parse(savedCart) : []; } 
    catch (e) { return []; }
  });

  const [isNavOpen, setIsNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCart([]);
    setIsNavOpen(false);
    navigate('/login');
  };

  const addToCart = (product) => {
    const id = product.productoId || product.id;
    setCart(prev => {
      const existing = prev.find(item => (item.productoId || item.id) === id);
      if (existing) {
        return prev.map(item => 
          (item.productoId || item.id) === id 
            ? { ...item, cantidad: (item.cantidad || 1) + 1 } 
            : item
        );
      }
      return [...prev, { ...product, productoId: id, cantidad: 1 }];
    });
  };

  const updateQuantity = (id, cantidad) => {
    setCart(prev => prev.map(item => 
      item.productoId === id ? { ...item, cantidad } : item
    ));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.productoId !== id));

  const totalItems = cart.reduce((acc, item) => acc + (item.cantidad || 1), 0);

  const userRol = String(user?.rol || user?.Rol || '').toLowerCase();
  const isAdmin = userRol === 'admin' || userRol === 'administrador';

  return (
    <>
      <Toaster position="bottom-right" />

      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          background-color: #1a365d;
          color: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.12);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-sizing: border-box;
        }

        .app-brand {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: white;
          text-decoration: none;
          white-space: nowrap;
        }

        .app-nav {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .nav-link {
          color: #e2e8f0;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-btn-admin {
          padding: 7px 14px;
          background-color: #2b6cb0;
          border-radius: 6px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .nav-btn-admin:hover {
          background-color: #2c5282;
        }

        .nav-btn-pos {
          padding: 7px 14px;
          background-color: #059669;
          border-radius: 6px;
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .nav-btn-pos:hover {
          background-color: #047857;
        }

        .btn-logout {
          padding: 7px 14px;
          background-color: #c53030;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.88rem;
          transition: background-color 0.2s;
        }

        .btn-logout:hover {
          background-color: #9b2c2c;
        }

        .nav-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 1.6rem;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }

        .cart-badge {
          background-color: #e53e3e;
          color: white;
          font-size: 0.75rem;
          font-weight: bold;
          padding: 2px 7px;
          border-radius: 12px;
          margin-left: 2px;
        }

        @media (max-width: 900px) {
          .app-header {
            padding: 12px 18px;
            position: relative;
          }

          .nav-toggle-btn {
            display: block;
          }

          .app-nav {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: #1a365d;
            padding: 18px 24px;
            gap: 16px;
            align-items: stretch;
            box-shadow: 0 8px 16px rgba(0,0,0,0.25);
            border-top: 1px solid rgba(255,255,255,0.1);
            box-sizing: border-box;
          }

          .app-nav.open {
            display: flex;
          }

          .nav-btn-admin,
          .nav-btn-pos,
          .btn-logout {
            text-align: center;
            justify-content: center;
            padding: 10px;
          }

          .user-greeting {
            border-bottom: 1px solid rgba(255,255,255,0.15);
            padding-bottom: 8px;
            text-align: center;
          }
        }
      `}</style>

      <header className="app-header">
        <Link to="/" className="app-brand" onClick={() => setIsNavOpen(false)}>
          CAFRI E-commerce
        </Link>
        
        {/* Botón Hamburguesa para Móvil/Tablet */}
        <button 
          type="button" 
          className="nav-toggle-btn" 
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-label="Abrir menú de navegación"
        >
          {isNavOpen ? '✕' : '☰'}
        </button>

        <nav className={`app-nav ${isNavOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsNavOpen(false)}>
            Catálogo
          </Link>
          
          <Link to="/carrito" className="nav-link" onClick={() => setIsNavOpen(false)}>
            🛒 Carrito {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="nav-btn-admin" onClick={() => setIsNavOpen(false)}>
              ⚙️ Administración
            </Link>
          )}

          {isAdmin && (
            <Link to="/punto-de-venta" className="nav-btn-pos" onClick={() => setIsNavOpen(false)}>
              💵 Venta (POS)
            </Link>
          )}

          {user ? (
            <>
              <span className="user-greeting" style={{ fontSize: '14px', color: '#cbd5e1' }}>
                Hola, <strong>{user.nombre || user.Nombre}</strong>
              </span>
              <button type="button" onClick={handleLogout} className="btn-logout">
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link" onClick={() => setIsNavOpen(false)}>
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </header>

      <main style={{ minHeight: 'calc(100vh - 70px)', boxSizing: 'border-box' }}>
        <Routes>
          <Route path="/" element={<ProductCatalog onAddToCart={addToCart} cart={cart} />} />
          <Route path="/producto/:id" element={<ProductDetail onAddToCart={addToCart} />} />
          <Route path="/carrito" element={
            <CartPage 
              cart={cart} 
              setCart={setCart} 
              removeFromCart={removeFromCart} 
              updateQuantity={updateQuantity} 
              user={user} 
            />
          } />
          <Route path="/login" element={
            <Login onLoginSuccess={(u) => { 
              setUser(u); 
              localStorage.setItem('user', JSON.stringify(u));
              const rol = String(u.rol || u.Rol || '').toLowerCase();
              navigate(rol === 'admin' || rol === 'administrador' ? '/admin' : '/'); 
            }} />
          } />
          <Route path="/registro" element={<Registro />} />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          <Route path="/punto-de-venta" element={
            isAdmin ? <PuntoDeVenta /> : <Navigate to="/" />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default App;