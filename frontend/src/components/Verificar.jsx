import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';
import loginImage from '../assets/login.jpg';

export default function Verificar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerificar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/verificar-cuenta', { email, codigo });
      alert(response.data.mensaje || "¡Cuenta verificada exitosamente!");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.mensaje || "Error al verificar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ flex: 1.2, height: '100%', position: 'relative', backgroundColor: '#1a365d' }}>
        <img src={loginImage} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: 'white' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '10px', color: '#1a365d', fontWeight: '800' }}>Verificar Cuenta</h1>
          <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '20px' }}>
            Ingresa el código de 6 dígitos que fue enviado a tu correo electrónico.
          </p>

          <form onSubmit={handleVerificar}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#2d3748', textTransform: 'uppercase' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '12px', margin: '5px 0 15px 0', border: '2px solid #cbd5e0', borderRadius: '8px', boxSizing: 'border-box' }} 
              required 
            />

            <label style={{ fontSize: '11px', fontWeight: '800', color: '#2d3748', textTransform: 'uppercase' }}>Código de Verificación</label>
            <input 
              type="text" 
              maxLength="6"
              placeholder="123456"
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)} 
              style={{ width: '100%', padding: '12px', margin: '5px 0 20px 0', border: '2px solid #cbd5e0', borderRadius: '8px', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', boxSizing: 'border-box' }} 
              required 
            />

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Verificando...' : 'VERIFICAR CUENTA'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}