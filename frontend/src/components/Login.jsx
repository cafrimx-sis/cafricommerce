import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api'; // Asegúrate de que la ruta importe tu api.js centralizado

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Usamos la instancia 'api' configurada en api.js
      // La ruta base y el puerto 7107 ya están definidos ahí
      const response = await api.post('/auth/login', { 
        email, 
        password 
      });

      // Guardamos la información en localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Notificamos al componente App.jsx del éxito
      onLoginSuccess(response.data);
      navigate('/');
    } catch (err) {
      console.error("Error de login:", err);
      alert("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0 16px 0',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', backgroundColor: '#f7fafc', padding: '20px' 
    }}>
      <div style={{ 
        backgroundColor: 'white', padding: '40px', borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' 
      }}>
        <h2 style={{ color: '#1a365d', textAlign: 'center', marginBottom: '10px' }}>Bienvenido a CAFRI</h2>
        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '30px', fontSize: '14px' }}>
          Inicia sesión para continuar
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 'bold' }}>Correo Electrónico</label>
          <input 
            type="email" required onChange={(e) => setEmail(e.target.value)} 
            style={inputStyle} placeholder="ejemplo@gmail.com" 
          />

          <label style={{ fontSize: '12px', color: '#4a5568', fontWeight: 'bold' }}>Contraseña</label>
          <input 
            type="password" required onChange={(e) => setPassword(e.target.value)} 
            style={inputStyle} placeholder="••••••••" 
          />

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '14px', backgroundColor: '#1a365d', 
            color: 'white', border: 'none', borderRadius: '8px', 
            fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px' 
          }}>
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          ¿Eres nuevo? <Link to="/registro" style={{ color: '#3182ce', fontWeight: 'bold' }}>Crea tu cuenta aquí</Link>
        </p>
      </div>
    </div>
  );
}