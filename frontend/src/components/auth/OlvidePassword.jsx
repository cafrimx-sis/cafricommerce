import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import loginImage from '../../assets/login.jpg';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/olvide-password', { email: email.toLowerCase().trim() });
      setEnviado(true);
      toast.success("Correo de recuperación enviado con éxito.");
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al procesar la solicitud.");
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
          <h1 style={{ fontSize: '26px', marginBottom: '8px', color: '#1a365d', fontWeight: '800' }}>Recuperar Contraseña</h1>
          <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '24px' }}>
            Ingresa tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>

          {enviado ? (
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '600' }}>¡Correo enviado!</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Revisa tu bandeja de entrada o utiliza el token de prueba generado en el servidor si estás en entorno de desarrollo.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#2d3748', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Correo Electrónico
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '12px', margin: '4px 0 16px 0', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} 
                placeholder="usuario@ejemplo.com"
                required 
              />

              <button 
                type="submit" 
                disabled={loading} 
                style={{ width: '100%', padding: '12px', backgroundColor: '#1a365d', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                {loading ? 'Enviando...' : 'ENVIAR INSTRUCCIONES'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#4a5568' }}>
            <Link to="/login" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none' }}>← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}