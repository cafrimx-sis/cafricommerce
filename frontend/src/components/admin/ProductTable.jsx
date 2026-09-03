import React from 'react';
// Asegúrate de que esta ruta sea correcta según tu estructura de carpetas
import api from "../../lib/api"; 

export default function ProductTable({ products, loading, error, onEdit, onDelete, onAddNew, onDirectImageUpload }) {
  if (loading) return <p style={{ color: '#3182ce', fontWeight: 'bold' }}>Cargando equipos...</p>;
  if (error) return <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>⚠️ Error: {error}</div>;

  // ✅ CORREGIDO: Extraemos la raíz dinámicamente y dejamos el puerto activo (5104) como salvavidas
  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:5104';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#2d3748', margin: 0 }}>Gestión de Inventario (CAFRI)</h2>
        <button 
          onClick={onAddNew}
          style={{ padding: '10px 15px', backgroundColor: '#38a169', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          ➕ Agregar Nuevo Equipo
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#ebf8ff', color: '#2c5282' }}>
              <th style={{ padding: '15px', width: '90px', textAlign: 'center' }}>Foto</th>
              <th style={{ padding: '15px' }}>SKU</th>
              <th style={{ padding: '15px' }}>Producto</th>
              <th style={{ padding: '15px' }}>Precio</th>
              <th style={{ padding: '15px' }}>Stock</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>No hay equipos registrados.</td>
              </tr>
            ) : (
              products.map((item) => {
                // Mapeo tolerante a propiedades en inglés o español para evitar componentes vacíos
                const idClave = item.productoId || item.id || item.ProductoId;
                const rutaImg = item.image || item.imageUrl || item.rutaImagen || item.imagenUrl;
                const nombreProd = item.nombre || item.name || 'Equipo sin nombre';
                const precioProd = Number(item.precioPublico || item.price || 0);
                const stockDisponible = item.stock ?? 0;

                return (
                  <tr key={idClave} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {/* ✅ CORREGIDO: Se añade el timestamp único (?t=...) para obligar al navegador a recargar la miniatura */}
                      <img 
                        src={
                          rutaImg 
                            ? `${rutaImg.startsWith('http') ? rutaImg : `${BASE_URL}${rutaImg}`}?t=${new Date().getTime()}` 
                            : "https://placehold.co/45x45?text=📷"
                        } 
                        alt="Producto" 
                        style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '15px', fontFamily: 'monospace' }}>{item.sku || 'N/A'}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{nombreProd}</td>
                    <td style={{ padding: '15px' }}>${precioProd.toLocaleString()} MXN</td>
                    <td style={{ padding: '15px', color: stockDisponible > 0 ? '#38a169' : '#e53e3e', fontWeight: 'bold' }}>
                      {stockDisponible}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => onEdit(item)} style={{ marginRight: '10px', color: '#3182ce', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Editar</button>
                      <button onClick={() => onDelete(idClave)} style={{ color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Eliminar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}