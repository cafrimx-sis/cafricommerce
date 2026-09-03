import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProductCatalog from './components/ProductCatalog';
import Login from './components/Login';
import Registro from './components/Registro';
import VerificarCuenta from './components/VerificarCuenta';
import OlvidePassword from './components/OlvidePassword';
import RestablecerPassword from './components/RestablecerPassword';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CartPage from './components/CartPage';
import PuntoDeVenta from './components/PuntoDeVenta';
import MisCompras from './components/MisCompras';
import UserProfile from './components/UserProfile';

function persistSession(userPayload) {
  const { token, ...userData } = userPayload || {};
  if (token) localStorage.setItem('token', String(token).replace(/['"]+/g, ''));
  const normalized = {
    ...userData,
    usuarioId: userData.usuarioId || userData.UsuarioId || userData.id || userData.Id,
    id: userData.id || userData.Id || userData.usuarioId || userData.UsuarioId,
  };
  localStorage.setItem('user', JSON.stringify(normalized));
  return normalized;
}

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

  const navigate = useNavigate();
  const location = useLocation();
  
  // Ocultar el header principal en las páginas de autenticación
  const isAuthPage = ['/login', '/registro', '/verificar-cuenta', '/olvide-password', '/restablecer-password'].includes(location.pathname);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleLoginSuccess = (payload) => {
    const userData = persistSession(payload);
    setUser(userData);
    const rol = String(userData.rol || userData.Rol || '').toLowerCase();
    navigate(rol === 'admin' || rol === 'administrador' ? '/admin' : '/', { replace: true });
  };

  const handleUserUpdated = (updated) => {
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    const merged = persistSession({ ...current, ...updated, token: undefined });
    setUser(merged);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
  const homeForUser = isAdmin ? '/admin' : '/';

  return (
    <>
      <Toaster position="bottom-right" />

      {!isAuthPage && (
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '15px 40px', backgroundColor: '#1a365d', color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>CAFRI E-commerce</h1>
        
        <nav style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Catálogo</Link>
          
          {user && !isAdmin && (
            <>
              <Link to="/mis-compras" style={{ color: 'white', textDecoration: 'none' }}>
                Mis Compras
              </Link>
              <Link to="/perfil" style={{ color: 'white', textDecoration: 'none' }}>
                Mi Perfil
              </Link>
            </>
          )}

          <Link to="/carrito" style={{ color: 'white', textDecoration: 'none', position: 'relative' }}>
            🛒 Carrito {totalItems > 0 && `(${totalItems})`}
          </Link>
          
          {isAdmin && (
            <Link to="/admin" style={{ padding: '8px 15px', backgroundColor: '#2b6cb0', borderRadius: '6px', color: 'white', textDecoration: 'none' }}>
            Administracion
            </Link>
          )}

          {isAdmin && (
            <Link to="/punto-de-venta" style={{ padding: '8px 15px', backgroundColor: '#059669', borderRadius: '6px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Venta
            </Link>
          )}

          {user ? (
            <>
              <span style={{ fontSize: '14px' }}>Hola, {user.nombre || user.Nombre}</span>
              <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#c53030', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Iniciar Sesión</Link>
          )}
        </nav>
      </header>
      )}

      <main style={{ padding: isAuthPage ? 0 : '20px' }}>
        <Routes>
          <Route path="/" element={<ProductCatalog onAddToCart={addToCart} cart={cart} />} />
          <Route path="/mis-compras" element={
            <ProtectedRoute>
              <MisCompras />
            </ProtectedRoute>
          } />
          <Route path="/perfil" element={
            <ProtectedRoute>
              <UserProfile user={user} onUserUpdated={handleUserUpdated} />
            </ProtectedRoute>
          } />
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
            user
              ? <Navigate to={homeForUser} replace />
              : <Login onLoginSuccess={handleLoginSuccess} />
          } />
          <Route path="/registro" element={
            user ? <Navigate to={homeForUser} replace /> : <Registro />
          } />
          <Route path="/verificar-cuenta" element={<VerificarCuenta />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/restablecer-password" element={<RestablecerPassword />} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard user={user} />
            </ProtectedRoute>
          } />
          <Route path="/punto-de-venta" element={
            <ProtectedRoute requireAdmin>
              <PuntoDeVenta />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default App;