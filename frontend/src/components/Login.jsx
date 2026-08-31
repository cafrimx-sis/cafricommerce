import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api'; 
import loginImage from '../assets/login.jpg';

export default function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputStyle = { 
    width: '100%', 
    padding: '12px', 
    margin: '4px 0 14px 0', 
    border: '1px solid #cbd5e0', 
    borderRadius: '6px', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    backgroundColor: '#ffffff'
  };

  const labelStyle = { 
    fontSize: '11px', 
    fontWeight: '700', 
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
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      onLoginSuccess(response.data);
      navigate('/');
    } catch (err) {
      alert("Error: " + (err.response?.data?.mensaje || "Credenciales incorrectas"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .login-form-side {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px;
          background-color: white;
          box-sizing: border-box;
        }

        .login-image-side {
          flex: 1.2;
          position: relative;
          background-color: #1a365d;
        }

        @media (max-width: 850px) {
          .login-image-side {
            display: none;
          }
          .login-form-side {
            padding: 24px 16px;
          }
        }
      `}</style>

      <div className="login-wrapper">
        <div className="login-form-side">
          <div style={{ width: '100%', maxWidth: '380px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#1a365d', fontWeight: '800' }}>Bienvenido</h1>
            <p style={{ color: '#718096', marginBottom: '24px', fontSize: '14px' }}>Ingresa tus credenciales para acceder a CAFRI</p>
            
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Correo Electrónico</label>
              <input name="email" type="email" onChange={handleChange} style={inputStyle} placeholder="usuario@ejemplo.com" required />
              
              <label style={labelStyle}>Contraseña</label>
              <input name="password" type="password" onChange={handleChange} style={inputStyle} placeholder="••••••••" required />
              
              <button type="submit" disabled={loading} style={{ 
                width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', 
                border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', 
                fontSize: '14px', marginTop: '6px' 
              }}>
                {loading ? 'Ingresando...' : 'INGRESAR'}
              </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#4a5568' }}>
              ¿No tienes cuenta? <Link to="/registro" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Regístrate aquí</Link>
            </p>
          </div>
        </div>

        <div className="login-image-side">
          <img src={loginImage} alt="Login Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(26, 54, 93, 0.3)' }}></div>
        </div>
      </div>
    </div>
  );
}