import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function UserProfile({ user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
    ciudad: user?.ciudad || '',
    rfc: user?.rfc || '',
  });

  const [passwords, setPasswords] = useState({
    passwordActual: '',
    passwordNuevo: '',
  });

  const [loading, setLoading] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  const aplicarPerfil = (data) => {
    if (!data) return;
    const siguiente = {
      nombre: data.nombre || data.Nombre || '',
      email: data.email || data.Email || '',
      telefono: data.telefono || data.Telefono || '',
      direccion: data.direccion || data.Direccion || '',
      ciudad: data.ciudad || data.Ciudad || data.colonia || data.Colonia || '',
      rfc: data.rfc || data.Rfc || '',
    };
    setFormData(siguiente);
  };

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      try {
        const response = await api.get('/auth/perfil');
        if (!cancelado) {
          aplicarPerfil(response.data);
          onUserUpdated?.(response.data);
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err);
        if (!cancelado) aplicarPerfil(user);
      } finally {
        if (!cancelado) setCargandoPerfil(false);
      }
    };
    cargar();
    return () => { cancelado = true; };
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/auth/perfil', formData);
      toast.success(response.data?.mensaje || 'Perfil actualizado correctamente');
      const usuario = response.data?.usuario || response.data;
      aplicarPerfil(usuario);
      onUserUpdated?.(usuario);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      toast.error(err.response?.data?.mensaje || 'No se pudo actualizar la información.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.passwordActual || !passwords.passwordNuevo) {
      toast.error('Completa ambos campos de contraseña');
      return;
    }
    if (passwords.passwordNuevo.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await api.put('/auth/cambiar-password', passwords);
      toast.success(response.data?.mensaje || 'Contraseña actualizada con éxito');
      setPasswords({ passwordActual: '', passwordNuevo: '' });
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      toast.error(err.response?.data?.mensaje || 'Error al cambiar la contraseña.');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'CF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div style={styles.container}>
      {cargandoPerfil && (
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '16px' }}>Cargando perfil...</p>
      )}
      <div style={styles.userBanner}>
        <div style={styles.avatar}>
          {getInitials(formData.nombre)}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.badgeContainer}>
            <span style={styles.stepBadge}>Mi Cuenta CAFRI</span>
            <span style={styles.roleBadge}>{user?.rol || user?.Rol || 'Cliente'}</span>
          </div>
          <h2 style={styles.title}>{formData.nombre || 'Usuario CAFRI'}</h2>
          <p style={styles.subtitle}>{formData.email || 'correo@ejemplo.com'}</p>
        </div>
      </div>

      <div style={styles.grid}>
        <form onSubmit={handleProfileUpdate} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>👤</span>
            <h3 style={styles.sectionTitle}>Datos Personales y Fiscales</h3>
          </div>
          <p style={styles.cardDesc}>Actualiza tu información de contacto y datos para envíos o facturación.</p>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre completo / Razón social</label>
            <input 
              type="text" 
              value={formData.nombre} 
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              style={styles.input} 
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo electrónico</label>
            <input 
              type="email" 
              value={formData.email} 
              disabled
              style={{ ...styles.input, backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }} 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Teléfono de contacto</label>
            <input 
              type="text" 
              value={formData.telefono} 
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              style={styles.input} 
              placeholder="Ej. 9991234567"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Dirección de envío</label>
            <input 
              type="text" 
              value={formData.direccion} 
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              style={styles.input} 
              placeholder="Calle, Número, Colonia"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Colonia</label>
              <input 
                type="text" 
                value={formData.ciudad} 
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                style={styles.input} 
                placeholder="Ej. Centro"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>RFC (opcional)</label>
              <input 
                type="text" 
                value={formData.rfc} 
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                style={styles.input} 
                placeholder="Aún no se almacena en el servidor"
                disabled
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
        </form>

        <form onSubmit={handlePasswordUpdate} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🔒</span>
            <h3 style={styles.sectionTitle}>Seguridad y Contraseña</h3>
          </div>
          <p style={styles.cardDesc}>Asegura tu cuenta actualizando tu contraseña periódicamente.</p>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña actual</label>
            <input 
              type="password" 
              value={passwords.passwordActual} 
              onChange={(e) => setPasswords({ ...passwords, passwordActual: e.target.value })}
              style={styles.input} 
              placeholder="••••••••••••"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nueva contraseña</label>
            <input 
              type="password" 
              value={passwords.passwordNuevo} 
              onChange={(e) => setPasswords({ ...passwords, passwordNuevo: e.target.value })}
              style={styles.input} 
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div style={{ ...styles.inputGroup, justifyContent: 'flex-end', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
              💡 Te recomendamos usar una contraseña combinada con letras, números y símbolos.
            </span>
          </div>

          <button type="submit" style={{ ...styles.button, backgroundColor: '#1e293b' }}>
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px', boxSizing: 'border-box' },
  userBanner: { display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '30px 40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)', color: 'white', marginBottom: '30px' },
  avatar: { width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '3px solid rgba(255,255,255,0.2)' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  badgeContainer: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' },
  stepBadge: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  roleBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' },
  title: { margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#ffffff' },
  subtitle: { margin: 0, fontSize: '0.95rem', color: '#cbd5e1' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '15px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '-6px' },
  cardIcon: { fontSize: '1.3rem' },
  sectionTitle: { color: '#0f172a', fontSize: '1.25rem', margin: 0, fontWeight: '700' },
  cardDesc: { color: '#64748b', fontSize: '0.88rem', margin: '0 0 5px 0' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#334155' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#fcfcfc' },
  button: { marginTop: '10px', padding: '13px', backgroundColor: '#004481', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};