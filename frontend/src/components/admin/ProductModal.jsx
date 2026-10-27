export default function ProductModal({ 
  isOpen, isEditing, onClose, onSubmit,
  sku, setSku, nombre, setNombre, 
  descripcion, setDescripcion,
  precioPublico, setPrecioPublico, stock, setStock,
  descuentoOferta, setDescuentoOferta, ofertaInicio, setOfertaInicio,
  ofertaFin, setOfertaFin,
  esDestacado, setEsDestacado, destacadoInicio, setDestacadoInicio,
  destacadoFin, setDestacadoFin,
  categoriaId, setCategoriaId, categorias = [], 
  subCategoriaId, setSubCategoriaId, subCategorias = [], 
  mainMarcaId, setMainMarcaId, marcas = [], 
  setFotoArchivo 
}) {
  const subCategoriasFiltradas = categoriaId
    ? subCategorias.filter((sub) => {
      const parentId = sub.categoriaId ?? sub.CategoriaId ?? sub.categoryId ?? sub.CategoryId;
      return String(parentId) === String(categoriaId);
    })
    : [];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .modal-container {
          background-color: #ffffff;
          border-radius: 10px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          padding: 24px;
          box-sizing: border-box;
        }

        .modal-row-2col {
          display: flex;
          gap: 15px;
          flex-direction: row;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          flex-direction: row;
        }

        @media (max-width: 480px) {
          .modal-container {
            padding: 16px;
            max-height: 94vh;
          }
          .modal-row-2col {
            flex-direction: column;
            gap: 0;
          }
          .modal-actions {
            flex-direction: column-reverse;
          }
          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>

      <div className="modal-container">
        <h3 style={{ margin: '0 0 18px 0', color: '#1a365d', borderBottom: '2px solid #edf2f7', paddingBottom: '10px', fontSize: '1.2rem' }}>
          {isEditing ? '✏️ Modificar Parámetros de Equipo' : '➕ Alta de Nuevo Equipo CAFRI'}
        </h3>
        
        <form onSubmit={onSubmit}>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Código / SKU</label>
            <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' }} placeholder="Ej. MS-CAFRI-12K" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Nombre Completo del Producto</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' }} placeholder="Ej. Mini Split Inverter High Efficiency" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Descripción y especificaciones</label>
            <textarea 
              value={descripcion || ''} 
              onChange={(e) => setDescripcion(e.target.value)} 
              rows={6}
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', minHeight: '140px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
              placeholder={'Capacidad: 12,000 BTU\nTipo: Inverter\nVoltaje: 220 V\nRefrigerante: R-32\nEficiencia: ...\nIncluye: ...\nGarantía: ...'}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#64748b', lineHeight: 1.5 }}>
              Esta información aparecerá en la tienda y en “Más información” del chatbot. Agrega solo especificaciones confirmadas para este modelo.
            </small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Categoría</label>
            <select 
              value={categoriaId} 
              onChange={(e) => {
                setCategoriaId(e.target.value);
                setSubCategoriaId(""); 
              }} 
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: '#fff', fontSize: '14px' }}
            >
              <option value="">-- Selecciona una categoría --</option>
              {categorias?.map((cat, index) => {
                const id = cat.id ?? cat.categoriaId ?? cat.CategoriaId ?? index;
                const nombreCat = cat.nombre ?? cat.Nombre ?? "Categoría sin nombre";
                return <option key={`${id}-${index}`} value={id}>{nombreCat}</option>;
              })}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Subcategoría</label>
            <select 
              value={subCategoriaId} 
              onChange={(e) => setSubCategoriaId(e.target.value)} 
              required={subCategoriasFiltradas.length > 0}
              disabled={!categoriaId || subCategoriasFiltradas.length === 0}
              style={{ 
                width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', 
                backgroundColor: (!categoriaId || subCategoriasFiltradas.length === 0) ? '#f0f0f0' : '#fff',
                cursor: (!categoriaId || subCategoriasFiltradas.length === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="">
                {!categoriaId 
                  ? "-- Primero elige categoría --" 
                  : (subCategoriasFiltradas.length > 0 ? "-- Selecciona una subcategoría --" : "-- Sin subcategorías registradas --")}
              </option>
              {subCategoriasFiltradas?.map((sub, index) => {
                const subId = sub.id ?? sub.subCategoriaId ?? sub.SubCategoriaId ?? index;
                const subNombre = sub.nombre ?? sub.Nombre ?? "Subcategoría sin nombre";
                return <option key={`${subId}-${index}`} value={subId}>{subNombre}</option>;
              })}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Marca</label>
            <select 
              value={mainMarcaId} 
              onChange={(e) => setMainMarcaId(e.target.value)} 
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: '#fff', fontSize: '14px' }}
            >
              <option value="">-- Selecciona una marca --</option>
              {marcas?.map((marca, index) => {
                const marcaId = marca.marcaId ?? marca.id ?? index;
                const marcaNombre = marca.nombre ?? marca.Nombre ?? "Marca sin nombre";
                return <option key={`${marcaId}-${index}`} value={marcaId}>{marcaNombre}</option>;
              })}
            </select>
          </div>

          <div className="modal-row-2col" style={{ marginBottom: '15px' }}>
            <div style={{ flex: 1, marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Precio Lista ($)</label>
              <input type="number" step="0.01" required value={precioPublico} onChange={(e) => setPrecioPublico(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' }} placeholder="0.00" />
            </div>
            <div style={{ flex: 1, marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Unidades Stock</label>
              <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' }} placeholder="0" />
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '14px', border: '1px solid #bee3f8', borderRadius: '8px', background: '#f0f9ff' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#2c5282' }}>Oferta para tienda en línea</label>
            <div className="modal-row-2col">
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#4a5568' }}>Descuento (%)</label>
                <input type="number" min="0" max="99.99" step="0.01" value={descuentoOferta} onChange={(e) => setDescuentoOferta(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#4a5568' }}>Inicia</label>
                <input type="datetime-local" required={Number(descuentoOferta) > 0} disabled={Number(descuentoOferta) <= 0} value={ofertaInicio} onChange={(e) => setOfertaInicio(e.target.value)} style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#4a5568' }}>Termina</label>
                <input type="datetime-local" required={Number(descuentoOferta) > 0} disabled={Number(descuentoOferta) <= 0} value={ofertaFin} onChange={(e) => setOfertaFin(e.target.value)} style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <small style={{ display: 'block', marginTop: '8px', color: '#4a5568' }}>Deja el descuento en 0 para quitar la oferta. Las fechas se capturan en hora local.</small>
          </div>

          <div style={{ marginBottom: '15px', padding: '14px', border: '1px solid #c4b5fd', borderRadius: '8px', background: '#f5f3ff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '9px', fontWeight: 'bold', fontSize: '14px', color: '#5b21b6', cursor: 'pointer' }}>
              <input type="checkbox" checked={esDestacado} onChange={(e) => setEsDestacado(e.target.checked)} />
              Promocionar como producto nuevo o destacado
            </label>
            <div className="modal-row-2col" style={{ marginTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#4a5568' }}>Inicia</label>
                <input type="datetime-local" required={esDestacado} disabled={!esDestacado} value={destacadoInicio} onChange={(e) => setDestacadoInicio(e.target.value)} style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#4a5568' }}>Termina</label>
                <input type="datetime-local" required={esDestacado} disabled={!esDestacado} value={destacadoFin} onChange={(e) => setDestacadoFin(e.target.value)} style={{ width: '100%', padding: '9px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <small style={{ display: 'block', marginTop: '8px', color: '#4a5568' }}>Se muestra en el carrusel sin requerir descuento. Las fechas se capturan en hora local.</small>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#4a5568' }}>Foto (PNG, JPG, JPEG)</label>
            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => e.target.files && setFotoArchivo(e.target.files[0])} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e0', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' }} />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} style={{ padding: '12px 18px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
            <button type="submit" style={{ padding: '12px 20px', backgroundColor: isEditing ? '#dd6b20' : '#3182ce', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>{isEditing ? 'Guardar Cambios' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}