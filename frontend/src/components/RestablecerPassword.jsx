import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputStyle = { 
    width: '100%', padding: '10px 12px', margin: '4px 0 12px 0', 
    border: '2px solid #cbd5e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' 
  };

  const labelStyle = { 
    fontSize: '11px', fontWeight: '800', color: '#2d3748', textTransform: 'uppercase' 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/restablecer-password', { email, token, nuevoPassword });
      alert(response.data.mensaje || "¡Contraseña restablecida con éxito!");
      navigate('/login');
    } catch (err) {
      alert("Error: " + (err.response?.data?.mensaje || "No se pudo restablecer la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f7fafc', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
        <h2 style={{ color: '#1a365d', marginBottom: '6px', fontWeight: '800' }}>Nueva Contraseña</h2>
        <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>Ingresa tu token y tu nueva contraseña.</p>
        
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Correo Electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="usuario@ejemplo.com" required />

          <label style={labelStyle}>Token de Recuperación</label>
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} style={inputStyle} placeholder="Pega tu token aquí" required />

          <label style={labelStyle}>Nueva Contraseña</label>
          <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} style={inputStyle} placeholder="••••••••" required />

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' 
          }}>
            {loading ? 'Guardando...' : 'RESTABLECER CONTRASEÑA'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
          <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}