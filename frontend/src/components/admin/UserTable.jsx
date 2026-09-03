import React, { useState, useEffect } from 'react';
import api from "../../lib/api"; 

export default function UserTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/auth/listar');
      setUsuarios(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'Administrador' ? 'Cliente' : 'Administrador';
    try {
      await api.put(`/auth/cambiar-rol/${id}`, { rol: nuevoRol });
      alert("Rol actualizado con éxito");
      cargarUsuarios(); 
    } catch (err) {
      alert("Error al actualizar el rol");
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario permanentemente?")) {
      try {
        await api.delete(`/auth/eliminar/${id}`);
        alert("Usuario eliminado");
        cargarUsuarios();
      } catch (err) {
        alert("Error al eliminar el usuario");
      }
    }
  };

  // Lógica de filtrado y paginación
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  if (loading) return <p style={{ padding: '20px' }}>Cargando usuarios...</p>;
  if (error) return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;

  return (
    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '20px' }}>👥 Gestión de Usuarios</h2>
      
      {/* Barra de búsqueda */}
      <input 
        type="text" 
        placeholder="🔍 Buscar por nombre o correo..." 
        value={busqueda}
        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
        style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ddd' }}
      />
 
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ID</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Correo</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Rol</th>
            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPaginados.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #edf2f7' }}>
              <td style={{ padding: '12px' }}>{u.id}</td>
              <td style={{ padding: '12px' }}>{u.nombre} {u.apellido}</td>
              <td style={{ padding: '12px' }}>{u.email}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: u.rol === 'Administrador' ? '#fed7d7' : '#e0f2f1' }}>
                  {u.rol}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button onClick={() => handleCambiarRol(u.id, u.rol)} style={{ marginRight: '5px', cursor: 'pointer' }}>🔄</button>
                <button onClick={() => handleEliminar(u.id)} style={{ color: 'red', cursor: 'pointer' }}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
 
      {/* Controles de Paginación */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
        <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>Anterior</button>
        <span>Página {paginaActual} de {totalPaginas || 1}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>Siguiente</button>
      </div>
    </div>
  );
}