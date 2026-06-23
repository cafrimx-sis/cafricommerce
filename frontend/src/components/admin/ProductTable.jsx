import React from 'react';

export default function ProductTable({ products, loading, error, onEdit, onDelete, onAddNew, onDirectImageUpload }) {
  if (loading) return <p style={{ color: '#3182ce', fontWeight: 'bold' }}>Cargando Mini Splits y equipos desde la base de datos...</p>;
  if (error) return <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>⚠️ Error: {error}</div>;

  const BACKEND_URL = 'https://localhost:7163';

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
              <th style={{ padding: '15px' }}>Precio Público</th>
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
                const idClave = item.productoId || item.ProductoId || item.id;
                const rutaImg = item.image || item.Image || item.imageUrl || item.rutaImagen;

                return (
                  <tr key={idClave} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {rutaImg ? (
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={
                                (rutaImg.startsWith('http')) 
                                  ? rutaImg 
                                  : `${BACKEND_URL}${rutaImg}`
                              } 
                              alt="Miniatura" 
                              style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: '#f7fafc' }} 
                              onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/45x45?text=📷"; }}
                            />
                            <label htmlFor={`file-table-${idClave}`} style={{ position: 'absolute', bottom: '-2px', right: '-2px', backgroundColor: '#3182ce', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title="Cambiar Foto">
                              🔄
                            </label>
                          </div>
                        ) : (
                          <label htmlFor={`file-table-${idClave}`} style={{ padding: '5px 8px', backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #63b3ed', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' }}>
                            📁 Subir
                          </label>
                        )}

                        <input 
                          id={`file-table-${idClave}`}
                          type="file" 
                          accept="image/png, image/jpeg"
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              if (typeof onDirectImageUpload === 'function') {
                                onDirectImageUpload(idClave, e.target.files[0]);
                              }
                            }
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '15px', fontFamily: 'monospace', color: '#4a5568', verticalAlign: 'middle' }}>{item.sku || item.SKU}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#1a202c', verticalAlign: 'middle' }}>{item.nombre || item.Nombre || item.name}</td>
                    <td style={{ padding: '15px', verticalAlign: 'middle' }}>${Number(item.precioPublico || item.PrecioPublico || item.price || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: (item.stock ?? item.Stock) > 0 ? '#38a169' : '#e53e3e', verticalAlign: 'middle' }}>{item.stock ?? item.Stock ?? 0} pzas</td>
                    <td style={{ padding: '15px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <button onClick={() => onEdit(item)} style={{ marginRight: '15px', background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Editar ✏️</button>
                      <button onClick={() => onDelete(idClave)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Eliminar 🗑️</button>
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