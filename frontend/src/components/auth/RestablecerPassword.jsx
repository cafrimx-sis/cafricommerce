import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import loginImage from '../../assets/login.jpg';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Captura automática y silenciosa del token y correo desde la URL
  const [email] = useState(searchParams.get('email') || '');
  const [token] = useState(searchParams.get('token') || '');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      toast.error("El enlace es inválido o faltan datos de recuperación.");
      return;
    }

    if (nuevoPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    if (nuevoPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/restablecer-password', {
        email: email.toLowerCase().trim(),
        token: token.trim(),
        nuevoPassword: nuevoPassword.trim()
      });

      toast.success(response.data.mensaje || "¡Contraseña restablecida con éxito!");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "El enlace es inválido o ha expirado.");
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
          <h1 style={{ fontSize: '26px', marginBottom: '8px', color: '#1a365d', fontWeight: '800' }}>Nueva Contraseña</h1>
          <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '24px' }}>
            Ingresa tu nueva contraseña para actualizar el acceso a tu cuenta.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#2d3748', textTransform: 'uppercase' }}>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              disabled
              style={{ width: '100%', padding: '10px', margin: '4px 0 12px 0', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#edf2f7', color: '#718096' }} 
            />

            <label style={{ fontSize: '11px', fontWeight: '700', color: '#2d3748', textTransform: 'uppercase' }}>Nueva Contraseña</label>
            <input 
              type="password" 
              value={nuevoPassword} 
              onChange={(e) => setNuevoPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', margin: '4px 0 12px 0', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
              placeholder="••••••••"
              required 
            />

            <label style={{ fontSize: '11px', fontWeight: '700', color: '#2d3748', textTransform: 'uppercase' }}>Confirmar Contraseña</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px', margin: '4px 0 20px 0', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
              placeholder="••••••••"
              required 
            />

            <button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              {loading ? 'Actualizando...' : 'RESTABLECER CONTRASEÑA'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
            <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Ir al Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}