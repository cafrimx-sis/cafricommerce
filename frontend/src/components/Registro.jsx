import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '', apellidoPaterno: '', apellidoMaterno: '',
    fechaNacimiento: '', direccion: '', email: '',
    password: '', confirmPassword: ''
  });

  // 1. PRIMERO definimos los estilos (Variables declaradas arriba)
  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '8px 0 16px 0',
    border: '1px solid #cbd5e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const labelStyle = { fontSize: '12px', color: '#4a5568', fontWeight: 'bold' };

  // 2. LUEGO definimos la lógica
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://localhost:7163/api/auth/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        alert("¡Registro exitoso!");
        navigate('/login');
      } else {
        alert(data.mensaje || "Error al registrar");
      }
    } catch (err) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  // 3. FINALMENTE el return
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f7fafc', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' }}>
        <h2 style={{ color: '#1a365d', textAlign: 'center', marginBottom: '25px' }}>Crear cuenta CAFRI</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Nombre</label>
          <input name="nombre" onChange={handleChange} style={inputStyle} required />

          <label style={labelStyle}>Apellido Paterno</label>
          <input name="apellidoPaterno" onChange={handleChange} style={inputStyle} required />

          <label style={labelStyle}>Apellido Materno</label>
          <input name="apellidoMaterno" onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Fecha de Nacimiento</label>
          <input type="date" name="fechaNacimiento" onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Dirección</label>
          <input name="direccion" onChange={handleChange} style={inputStyle} />

          <label style={labelStyle}>Correo Electrónico</label>
          <input type="email" name="email" onChange={handleChange} style={inputStyle} required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>Contraseña</label>
              <input type="password" name="password" onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Confirmar</label>
              <input type="password" name="confirmPassword" onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Finalizar Registro
          </button>
        </form>
      </div>
    </div>
  );
}