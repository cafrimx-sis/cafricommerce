import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import ProductCatalog from './components/ProductCatalog';
import Login from './components/Login';
import Registro from './components/Registro';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Recuperar usuario al cargar la app
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setCart([]);
    navigate('/login');
  };

  // Lógica robusta para detectar administrador
  const userRol = String(user?.rol || user?.Rol || '').toLowerCase();
  const isAdmin = userRol === 'admin' || userRol === 'administrador';

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#1a365d', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>CAFRI E-commerce</h1>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Catálogo</Link>
          
          {isAdmin && (
            <Link to="/admin" style={{ padding: '8px 12px', backgroundColor: '#3182ce', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', color: 'white' }}>
              ⚙️ Panel Admin
            </Link>
          )}

          {user ? (
            <>
              <span>Hola, {user.nombre || user.Nombre}</span>
              <button onClick={handleLogout} style={{ padding: '8px', cursor: 'pointer', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px' }}>
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Iniciar Sesión</Link>
          )}
        </nav>
      </header>

      <main style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<ProductCatalog onAddToCart={(p) => setCart(prev => [...prev, p])} cart={cart} />} />
          
          <Route path="/login" element={
            <Login onLoginSuccess={(u) => { 
              setUser(u); 
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
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default App;