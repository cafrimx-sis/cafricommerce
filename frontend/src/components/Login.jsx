import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api'; 
import loginAnimation from '../assets/login-animation.gif';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const inputStyle = { 
    width: '100%', 
    padding: '10px 12px', 
    margin: '4px 0 12px 0', 
    border: '2px solid #cbd5e0', 
    borderRadius: '8px', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    backgroundColor: '#ffffff'
  };

  const labelStyle = { 
    fontSize: '11px', 
    fontWeight: '800', 
    color: '#2d3748', 
    textTransform: 'uppercase',
    letterSpacing: '0.5px' 
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: formData.email, password: formData.password });
      onLoginSuccess(response.data);
    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || "Credenciales incorrectas";
      alert("Error: " + mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}>
      <style>{`
        .login-card { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .input-modern:focus { border-color: #3182ce !important; outline: none; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2); }
        .btn-hover:hover { transform: scale(1.02); background-color: #2a4a7a !important; }
        .spinner { border: 3px solid rgba(255,255,255,0.3); width: 20px; height: 20px; border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Formulario */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backgroundColor: 'white', boxSizing: 'border-box' }} className="login-card">
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '6px', color: '#1a365d', fontWeight: '800' }}>Bienvenido</h1>
          <p style={{ color: '#718096', marginBottom: '20px', fontSize: '13px' }}>Ingresa tus credenciales para acceder a CAFRI</p>
          
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Correo Electrónico</label>
            <input name="email" type="email" onChange={handleChange} className="input-modern" style={inputStyle} placeholder="usuario@ejemplo.com" required />
            
            <label style={labelStyle}>Contraseña</label>
            <input name="password" type="password" onChange={handleChange} className="input-modern" style={inputStyle} placeholder="••••••••" required />
            
            {/* Enlaces de ayuda: Recuperar contraseña y Verificar cuenta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px' }}>
              <Link to="/olvide-password" style={{ color: '#3182ce', fontWeight: '600', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
              <Link to="/verificar-cuenta" style={{ color: '#718096', textDecoration: 'none' }}>
                Verificar cuenta
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-hover" style={{ 
              width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', 
              border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', 
              fontSize: '14px', transition: '0.2s' 
            }}>
              {loading ? <div className="spinner"></div> : 'INGRESAR'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#4a5568' }}>
            ¿No tienes cuenta? <Link to="/registro" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate aquí</Link>
          </p>
        </div>
      </div>

      {/* Panel derecho con el GIF */}
      <div style={{ flex: 1.2, height: '100%', position: 'relative', backgroundColor: '#1a365d', overflow: 'hidden', boxSizing: 'border-box' }}>
        <img 
          src={loginAnimation} 
          alt="Login Background Animation" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.95, display: 'block' }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(26, 54, 93, 0.1)', pointerEvents: 'none' }}></div>
      </div>
    </div>
  );
}