import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

export default function VerificarCuenta() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
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
      const response = await api.post('/auth/verificar-cuenta', { email, codigo });
      alert(response.data.mensaje || "¡Cuenta verificada exitosamente!");
      navigate('/login');
    } catch (err) {
      alert("Error: " + (err.response?.data?.mensaje || "No se pudo verificar la cuenta"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f7fafc', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
        <h2 style={{ color: '#1a365d', marginBottom: '6px', fontWeight: '800' }}>Verificar Cuenta</h2>
        <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>Ingresa tu correo y el código de verificación.</p>
        
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Correo Electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="usuario@ejemplo.com" required />

          <label style={labelStyle}>Código de Verificación</label>
          <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} style={{ ...inputStyle, letterSpacing: '3px', fontWeight: 'bold', textAlign: 'center' }} placeholder="123456" required />

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' 
          }}>
            {loading ? 'Verificando...' : 'VERIFICAR CUENTA'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
          <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}