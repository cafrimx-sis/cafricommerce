import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const inputStyle = { 
    width: '100%', padding: '10px 12px', margin: '4px 0 12px 0', 
    border: '2px solid #cbd5e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensajeExito('');
    try {
      const response = await api.post('/auth/olvide-password', { email });
      setMensajeExito(response.data.mensaje || "Se han enviado las instrucciones.");
      if (response.data.tokenPruebas) {
        console.log("Token de pruebas:", response.data.tokenPruebas);
      }
    } catch (err) {
      alert("Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f7fafc', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
        <h2 style={{ color: '#1a365d', marginBottom: '6px', fontWeight: '800' }}>Recuperar Contraseña</h2>
        <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>Te enviaremos los pasos para restablecer tu acceso.</p>
        
        {mensajeExito && (
          <div style={{ backgroundColor: '#c6f6d5', color: '#22543d', padding: '10px', borderRadius: '6px', fontSize: '12px', marginBottom: '15px' }}>
            {mensajeExito} <br/><em>(Revisa la consola del navegador si estás probando localmente).</em>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#2d3748', textTransform: 'uppercase' }}>Correo Electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="usuario@ejemplo.com" required />

          <button type="submit" disabled={loading} style={{ 
            width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', 
            border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' 
          }}>
            {loading ? 'Enviando...' : 'ENVIAR INSTRUCCIONES'}
          </button>
        </form>

        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
          <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}