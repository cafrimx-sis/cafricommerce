import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api'; 
import loginImage from '../assets/login.jpg';

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '', 
    codigoPostal: '', colonia: '', direccion: '', email: '', password: '', confirmPassword: ''
  });
  const [listaColonias, setListaColonias] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- ESTILOS DEFINIDOS CON MÁS CONTRASTE ---
  const inputStyle = { 
    width: '100%', 
    padding: '12px', 
    margin: '5px 0 10px 0', 
    border: '2px solid #cbd5e0', // Borde más oscuro y definido
    borderRadius: '8px', 
    fontSize: '13px', 
    boxSizing: 'border-box',
    backgroundColor: '#ffffff'
  };

  const labelStyle = { 
    fontSize: '11px', 
    fontWeight: '800', 
    color: '#2d3748', // Color más sólido para las etiquetas
    textTransform: 'uppercase',
    letterSpacing: '0.5px' 
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleBuscarCp = async () => {
    if (formData.codigoPostal.length === 5) {
      try {
        const response = await api.get(`/direcciones/buscar-por-cp/${formData.codigoPostal}`);
        if (response.data && Array.isArray(response.data)) {
          const colonias = response.data.map(item => item.response.asentamiento);
          setListaColonias(colonias);
          setFormData(prev => ({ ...prev, colonia: colonias[0] }));
        }
      } catch (err) { alert("No se pudieron cargar las colonias."); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("Las contraseñas no coinciden");
    setLoading(true);
    try {
      await api.post('/auth/registrar', formData);
      alert("¡Registro exitoso!");
      navigate('/login');
    } catch (err) { alert(err.response?.data?.mensaje || "Error al registrar"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .reg-card { animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        /* Efecto de foco para que se vea claramente dónde estás escribiendo */
        .input-modern:focus { border-color: #3182ce !important; outline: none; box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2); }
        .btn-hover:hover { transform: scale(1.02); background-color: #2a4a7a !important; }
        .spinner { border: 3px solid rgba(255,255,255,0.3); width: 20px; height: 20px; border-radius: 50%; border-top-color: #fff; animation: spin 1s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Columna Izquierda: Imagen */}
      <div style={{ flex: 1.2, height: '100%', position: 'relative', backgroundColor: '#1a365d' }}>
        <img src={loginImage} alt="Background" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
      </div>

      {/* Columna Derecha: Formulario */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '40px', backgroundColor: 'white' }} className="reg-card">
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#1a365d', fontWeight: '800' }}>Crear cuenta</h1>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Nombre</label><input name="nombre" onChange={handleChange} className="input-modern" style={inputStyle} required /></div>
              <div><label style={labelStyle}>Ap. Paterno</label><input name="apellidoPaterno" onChange={handleChange} className="input-modern" style={inputStyle} required /></div>
              <div><label style={labelStyle}>Ap. Materno</label><input name="apellidoMaterno" onChange={handleChange} className="input-modern" style={inputStyle} /></div>
            </div>

            <label style={labelStyle}>Teléfono</label>
            <input name="telefono" onChange={handleChange} className="input-modern" style={inputStyle} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>CP</label><input name="codigoPostal" onChange={handleChange} onBlur={handleBuscarCp} className="input-modern" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Colonia</label>
                <select name="colonia" value={formData.colonia} onChange={handleChange} className="input-modern" style={{...inputStyle, backgroundColor: '#f9fafb'}}>
                  {listaColonias.length > 0 ? listaColonias.map((col, i) => <option key={i} value={col}>{col}</option>) : <option>Ingresa CP...</option>}
                </select>
              </div>
            </div>

            <label style={labelStyle}>Dirección completa</label>
            <input name="direccion" onChange={handleChange} className="input-modern" style={inputStyle} placeholder="Calle, número, referencias..." required />

            <label style={labelStyle}>Correo Electrónico</label>
            <input type="email" name="email" onChange={handleChange} className="input-modern" style={inputStyle} required />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Contraseña</label><input type="password" name="password" onChange={handleChange} className="input-modern" style={inputStyle} required /></div>
              <div><label style={labelStyle}>Confirmar</label><input type="password" name="confirmPassword" onChange={handleChange} className="input-modern" style={inputStyle} required /></div>
            </div>

            <button type="submit" disabled={loading} className="btn-hover" style={{ width: '100%', padding: '14px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '15px', transition: '0.2s' }}>
              {loading ? <div className="spinner"></div> : 'FINALIZAR REGISTRO'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#4a5568' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}