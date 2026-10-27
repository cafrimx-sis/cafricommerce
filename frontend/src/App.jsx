import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import logo from './assets/logo.png';
import ProductCatalog from './components/ProductCatalog';
import ProductDetail from './components/ProductDetail';
import Login from './components/Login';
import Registro from './components/Registro';
import Verificar from './components/Verificar';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CartPage from './components/CartPage';
import MisCompras from './components/MisCompras';
import PuntoDeVenta from './components/PuntoDeVenta';
import ChatWidget from './components/chatbot/ChatWidget'; // 🤖 Importación del Asistente Virtual
import OlvidePassword from './components/auth/OlvidePassword';
import RestablecerPassword from './components/auth/RestablecerPassword';
import SolicitudFactura from './components/SolicitudFactura'; // 📄 Importación de la vista de Solicitud de Factura
import LegalPage from './components/LegalPage';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try { return savedUser ? JSON.parse(savedUser) : null; }
    catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    try { return savedCart ? JSON.parse(savedCart) : []; }
    catch { return []; }
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
  const puedeUsarPos = isAdmin || userRol === 'cajero';

  return (
    <>
      <Toaster position="bottom-right" />

      {/* 💬 Widget Flotante del Asistente Virtual ajustado con zIndex y posición elevada */}
      <ChatWidget user={user} onAddToCart={addToCart} />

      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px clamp(18px, 4vw, 58px);
          background: rgba(144, 205, 232, 0.97);
          color: #0c2946;
          box-shadow: 0 8px 28px rgba(5, 24, 43, 0.12);
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(12, 41, 70, 0.12);
        }

        .app-brand {
          margin: 0;
          text-decoration: none;
          display: block;
          width: 170px;
          height: 64px;
          flex: 0 0 auto;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: transparent;
        }

        .app-brand img {
          position: absolute;
          top: -68px;
          left: 0;
          display: block;
          width: 170px;
          height: 170px;
        }

        .app-nav {
          display: flex;
          gap: clamp(12px, 1.7vw, 24px);
          align-items: center;
        }

        .nav-link {
          color: #123d62;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.88rem;
          transition: color 0.2s ease, transform 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: #071b30;
          transform: translateY(-1px);
        }

        .nav-btn-admin {
          padding: 9px 14px;
          background: linear-gradient(135deg, #17608a, #247fa7);
          border-radius: 10px;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 5px 14px rgba(18, 94, 136, 0.26);
        }

        .nav-btn-admin:hover {
          background: linear-gradient(135deg, #24749a, #3097ba);
          transform: translateY(-2px);
        }

        .nav-btn-pos {
          padding: 9px 14px;
          background: linear-gradient(135deg, #087c70, #12aa91);
          border-radius: 10px;
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 5px 14px rgba(18, 164, 139, 0.22);
        }

        .nav-btn-pos:hover {
          background: linear-gradient(135deg, #0d8e7c, #20c5a2);
          transform: translateY(-2px);
        }

        .btn-logout {
          padding: 8px 13px;
          background: rgba(255,255,255,0.48);
          color: #0c2946;
          border: 1px solid rgba(12, 41, 70, 0.18);
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.85);
          transform: translateY(-1px);
        }

        .nav-toggle-btn {
          display: none;
          background: #123d62;
          border: 1px solid rgba(12, 41, 70, 0.22);
          border-radius: 9px;
          color: white;
          font-size: 1.6rem;
          cursor: pointer;
          padding: 4px 10px;
          line-height: 1;
        }

        .cart-badge {
          display: inline-grid;
          place-items: center;
          min-width: 21px;
          height: 21px;
          background: var(--accent);
          color: var(--brand-950);
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0 5px;
          border-radius: 50px;
          margin-left: 1px;
        }

        .user-greeting {
          color: #244c68 !important;
          white-space: nowrap;
        }

        .user-greeting strong {
          color: #0c2946;
        }

        @media (max-width: 900px) {
          .app-header {
            padding: 11px 18px;
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
            background: rgba(144, 205, 232, 0.99);
            padding: 18px 22px 22px;
            gap: 14px;
            align-items: stretch;
            box-shadow: 0 18px 26px rgba(0,0,0,0.2);
            border-top: 1px solid rgba(12, 41, 70, 0.14);
            box-sizing: border-box;
            backdrop-filter: blur(18px);
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

        @media (max-width: 520px) {
          .app-brand {
            width: 148px;
            height: 56px;
          }
          .app-brand img {
            top: -59px;
            width: 148px;
            height: 148px;
          }
        }
      `}</style>

      <header className="app-header">
        <Link to="/" className="app-brand" onClick={() => setIsNavOpen(false)}>
          <img src={logo} alt="CAFRI" />
        </Link>

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

          {/* 📄 Enlace rápido hacia la Solicitud de Factura */}
          <Link to="/facturacion" className="nav-link" onClick={() => setIsNavOpen(false)}>
            📄 Facturación
          </Link>

          {isAdmin && (
            <Link to="/admin" className="nav-btn-admin" onClick={() => setIsNavOpen(false)}>
              ⚙️ Administración
            </Link>
          )}

          {puedeUsarPos && (
            <Link to="/punto-de-venta" className="nav-btn-pos" onClick={() => setIsNavOpen(false)}>
              💵 Venta (POS)
            </Link>
          )}

          {user ? (
            <>
              <Link to="/mis-compras" className="nav-link" onClick={() => setIsNavOpen(false)}>
                📦 Mis compras
              </Link>
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
          <Route path="/legal/:page" element={<LegalPage />} />
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
          <Route path="/mis-compras" element={
            <ProtectedRoute>
              <MisCompras />
            </ProtectedRoute>
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
          <Route path="/verificar" element={<Verificar />} />

          {/* Rutas de recuperación de contraseña */}
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />

          {/* 📄 Ruta agregada para el formulario de Solicitud de Factura */}
          <Route path="/facturacion" element={<SolicitudFactura />} />

          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          <Route path="/punto-de-venta" element={
            <ProtectedRoute allowedRoles={['Administrador', 'Cajero']}>
              <PuntoDeVenta />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-copyright">
            © {new Date().getFullYear()} CAFRI E-commerce. Todos los derechos reservados.
          </p>
          <nav className="site-footer-links" aria-label="Información legal">
            <Link to="/legal/privacidad">Privacidad</Link>
            <Link to="/legal/terminos">Términos</Link>
            <Link to="/legal/envios">Envíos y devoluciones</Link>
            <Link to="/legal/seguridad">Seguridad</Link>
            <Link to="/legal/cookies">Cookies</Link>
          </nav>
          <p className="site-footer-cookie-note">
            Usamos almacenamiento local para sesión y carrito. PayPal puede usar sus propias tecnologías.
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;