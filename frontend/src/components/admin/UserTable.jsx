import { useState, useEffect, useCallback } from 'react';
import api from "../../lib/api"; 

export default function UserTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  const cargarUsuarios = useCallback(async () => {
    try {
      const response = await api.get('/auth/listar');
      setUsuarios(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/auth/listar')
      .then((response) => {
        if (active) setUsuarios(response.data || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "No se pudo conectar con el servidor.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === 'Administrador' ? 'Cliente' : 'Administrador';
    try {
      await api.put(`/auth/cambiar-rol/${id}`, { rol: nuevoRol });
      alert("Rol actualizado con éxito");
      cargarUsuarios(); 
    } catch {
      alert("Error al actualizar el rol");
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario permanentemente?")) {
      try {
        await api.delete(`/auth/eliminar/${id}`);
        alert("Usuario eliminado");
        cargarUsuarios();
      } catch {
        alert("Error al eliminar el usuario");
      }
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice(
    (paginaActual - 1) * usuariosPorPagina,
    paginaActual * usuariosPorPagina
  );

  if (loading) return <p style={{ padding: '20px' }}>Cargando usuarios...</p>;
  if (error) return <p style={{ color: 'red', padding: '20px' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .user-container {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          border: 1px solid #edf2f7;
        }

        .user-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin-top: 10px;
        }

        .user-table {
          width: 100%;
          min-width: 600px;
          border-collapse: collapse;
        }

        .pagination-container {
          margin-top: 20px;
          display: flex;
          gap: 12px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #cbd5e0;
          background-color: #edf2f7;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .user-container {
            padding: 16px;
          }
        }
      `}</style>

      <div className="user-container">
        <h2 style={{ margin: '0 0 16px 0', color: '#2d3748', fontSize: '1.4rem' }}>👥 Gestión de Usuarios</h2>
        
        {/* Barra de búsqueda */}
        <input 
          type="text" 
          placeholder="🔍 Buscar por nombre o correo..." 
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
          style={{ width: '100%', padding: '10px 14px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', outline: 'none' }}
        />
   
        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr style={{ backgroundColor: '#f7fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', width: '70px' }}>ID</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Correo</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', width: '130px' }}>Rol</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'center', width: '110px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#a0aec0' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{u.id}</td>
                    <td style={{ padding: '12px', fontWeight: '500', color: '#2d3748' }}>{u.nombre} {u.apellido}</td>
                    <td style={{ padding: '12px', color: '#4a5568' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: u.rol === 'Administrador' ? '#fed7d7' : '#e0f2f1',
                        color: u.rol === 'Administrador' ? '#9b2c2c' : '#234e52'
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => handleCambiarRol(u.id, u.rol)} 
                        style={{ marginRight: '8px', cursor: 'pointer', border: 'none', background: '#edf2f7', padding: '6px 10px', borderRadius: '4px' }}
                        title="Cambiar Rol"
                      >
                        🔄
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleEliminar(u.id)} 
                        style={{ cursor: 'pointer', border: 'none', background: '#fed7d7', padding: '6px 10px', borderRadius: '4px' }}
                        title="Eliminar Usuario"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
   
        {/* Paginación */}
        <div className="pagination-container">
          <button 
            type="button"
            className="pagination-btn"
            disabled={paginaActual === 1} 
            onClick={() => setPaginaActual(p => p - 1)}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>Página {paginaActual} de {totalPaginas || 1}</span>
          <button 
            type="button"
            className="pagination-btn"
            disabled={paginaActual >= totalPaginas} 
            onClick={() => setPaginaActual(p => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}