import React, { useState, useEffect } from 'react';

export default function UserTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('https://localhost:7163/api/auth/listar', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error("No se pudo conectar con el servidor.");
        
        const data = await response.json();
        setUsuarios(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarUsuarios();
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Cargando usuarios...</p>;
  if (error) return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px' }}>👥 Gestión de Usuarios</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ID</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Correo</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Rol</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '12px' }}>{u.id}</td>
              <td style={{ padding: '12px' }}>{u.nombre} {u.apellido}</td>
              <td style={{ padding: '12px' }}>{u.email}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: u.rol === 'Admin' ? '#fed7d7' : '#e0f2f1' }}>
                  {u.rol}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}