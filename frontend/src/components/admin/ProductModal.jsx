import React from 'react';

export default function ProductModal({ 
  isOpen, isEditing, onClose, onSubmit,
  sku, setSku, nombre, setNombre, precioPublico, setPrecioPublico, stock, setStock,
  categoriaId, setCategoriaId, categorias = [], // 🌟 Valor por defecto vacío para evitar errores
  setFotoArchivo 
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
        
        <h3 style={{ margin: '0 0 20px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' }}>
          {isEditing ? '✏️ Modificar Parámetros de Equipo' : '➕ Alta de Nuevo Equipo CAFRI'}
        </h3>
        
        <form onSubmit={onSubmit}>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Código / SKU</label>
            <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} placeholder="Ej. MS-CAFRI-12K" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Nombre Completo del Producto</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} placeholder="Ej. Mini Split Inverter High Efficiency" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Categoría</label>
            <select 
              value={categoriaId} 
              onChange={(e) => setCategoriaId(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: '#fff' }}
            >
              <option value="">-- Selecciona una categoría --</option>
              {/* 🌟 Seguridad: usamos optional chaining para evitar errores si la lista no ha llegado aún */}
              {categorias?.map(cat => (
                <option key={cat.id || cat.categoriaId} value={cat.id || cat.categoriaId}>
                  {cat.nombre || cat.Nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Precio Lista ($)</label>
              <input type="number" step="0.01" required value={precioPublico} onChange={(e) => setPrecioPublico(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} placeholder="0.00" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Unidades Stock</label>
              <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} placeholder="0" />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Foto (.PNG)</label>
            <input type="file" accept="image/png" onChange={(e) => e.target.files && setFotoArchivo(e.target.files[0])} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: isEditing ? '#dd6b20' : '#3182ce', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>{isEditing ? 'Guardar Cambios' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}