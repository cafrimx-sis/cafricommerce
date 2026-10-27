import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ShippingAddressView({ formData, handleChange, setFormData, onNext, onBack }) {
  const [listaColonias, setListaColonias] = useState([]);
  const [loadingCp, setLoadingCp] = useState(false);

  const handleBuscarCp = async () => {
    const cp = formData.codigoPostal;
    if (cp && cp.length === 5) {
      setLoadingCp(true);
      try {
        const response = await api.get(`/direcciones/buscar-por-cp/${cp}`);
        
        // Accedemos correctamente a response.data.response
        const dataDir = response.data?.response;

        if (dataDir && dataDir.asentamiento) {
          const colonias = dataDir.asentamiento;
          setListaColonias(colonias);
          
          setFormData(prev => ({
            ...prev,
            colonia: colonias.length > 0 ? colonias[0] : '',
            ciudad: dataDir.municipio || prev.ciudad,
            estado: dataDir.estado || prev.estado
          }));

          toast.success("Colonias cargadas correctamente");
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar las colonias para este C.P.");
        setListaColonias([]);
      } finally {
        setLoadingCp(false);
      }
    }
  };

  return (
    <div className="checkout-address" style={styles.container}>
      <div style={styles.headerBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span style={styles.stepBadge}>Paso 1 de 2</span>
            <h2 style={styles.title}>Dirección de Entrega</h2>
          </div>
          {onBack && (
            <button type="button" onClick={onBack} style={styles.linkButton}>
              ← Volver al carrito
            </button>
          )}
        </div>
        <p style={styles.subtitle}>Indica el domicilio donde entregaremos tu pedido o proyecto HVACR.</p>
      </div>

      <form onSubmit={onNext} style={styles.form}>
        
        {/* Código Postal */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Código Postal *</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="codigoPostal" 
              placeholder="Ej. 97000" 
              maxLength="5"
              value={formData.codigoPostal} 
              onChange={handleChange} 
              onBlur={handleBuscarCp}
              required 
              style={styles.inputFull} 
            />
            {loadingCp && <span style={styles.loadingText}>Buscando...</span>}
          </div>
          <span style={styles.helperText}>Ingresa 5 dígitos y sal de la casilla para cargar las colonias.</span>
        </div>

        {/* Calle, Número Exterior y Número Interior */}
        <div style={styles.gridRow}>
          <div style={{ ...styles.inputGroup, flex: 2 }}>
            <label style={styles.label}>Calle *</label>
            <input 
              type="text" 
              name="calle" 
              placeholder="Ej. Av. Industrial" 
              value={formData.calle} 
              onChange={handleChange} 
              required 
              style={styles.inputFull} 
            />
          </div>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>No. Ext *</label>
            <input 
              type="text" 
              name="numeroExterior" 
              placeholder="Ej. 123" 
              value={formData.numeroExterior} 
              onChange={handleChange} 
              required 
              style={styles.inputFull} 
            />
          </div>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>No. Int</label>
            <input 
              type="text" 
              name="numeroInterior" 
              placeholder="Opcional" 
              value={formData.numeroInterior} 
              onChange={handleChange} 
              style={styles.inputFull} 
            />
          </div>
        </div>

        {/* Colonia */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Colonia *</label>
          <select 
            name="colonia" 
            value={formData.colonia} 
            onChange={handleChange} 
            required 
            style={styles.selectFull}
          >
            <option value="">Selecciona una colonia...</option>
            {listaColonias.length > 0 ? (
              listaColonias.map((col, i) => (
                <option key={i} value={col}>{col}</option>
              ))
            ) : (
              <option value="" disabled>Primero ingresa un C.P. válido</option>
            )}
          </select>
        </div>

        {/* Ciudad y Estado */}
        <div style={styles.gridRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Ciudad / Municipio *</label>
            <input 
              type="text" 
              name="ciudad" 
              placeholder="Ej. Mérida" 
              value={formData.ciudad} 
              onChange={handleChange} 
              required 
              style={styles.inputFull} 
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Estado *</label>
            <input 
              type="text" 
              name="estado" 
              placeholder="Ej. Yucatán" 
              value={formData.estado} 
              onChange={handleChange} 
              required 
              style={styles.inputFull} 
            />
          </div>
        </div>

        {/* Teléfono de contacto */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Teléfono de Contacto (10 dígitos) *</label>
          <input 
            type="tel" 
            name="telefonoContacto" 
            placeholder="Ej. 9991234567" 
            maxLength="10"
            value={formData.telefonoContacto} 
            onChange={handleChange} 
            required 
            style={styles.inputFull} 
          />
        </div>

        <button type="submit" style={styles.primaryButton}>
          Continuar al pago con BBVA →
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { 
    maxWidth: '750px', 
    margin: '30px auto', 
    background: '#ffffff', 
    padding: 'clamp(20px, 5vw, 45px)',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-soft)',
    border: '1px solid var(--line)'
  },
  headerBox: { 
    marginBottom: '30px', 
    borderBottom: '2px solid #f1f5f9', 
    paddingBottom: '18px' 
  },
  stepBadge: {
    backgroundColor: '#d8f7f1',
    color: '#123d62',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '5px 12px',
    borderRadius: '20px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  title: { 
    color: '#0c2946',
    margin: 0, 
    fontSize: '1.7rem',
    fontWeight: '700'
  },
  subtitle: { 
    color: '#64748b', 
    margin: '6px 0 0 0', 
    fontSize: '1rem' 
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '22px' 
  },
  gridRow: { 
    display: 'flex', 
    gap: '16px', 
    flexWrap: 'wrap' 
  },
  inputGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px',
    flex: 1,
    minWidth: '220px'
  },
  label: { 
    fontSize: '0.9rem', 
    fontWeight: '600', 
    color: '#334155' 
  },
  inputFull: { 
    padding: '14px 16px', 
    borderRadius: '10px', 
    border: '1px solid #cbd5e1', 
    fontSize: '1rem', 
    outline: 'none', 
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box'
  },
  selectFull: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'pointer'
  },
  loadingText: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.85rem',
    color: '#004481',
    fontWeight: '600'
  },
  helperText: {
    fontSize: '0.8rem',
    color: '#64748b'
  },
  primaryButton: { 
    padding: '16px 20px', 
    background: 'linear-gradient(135deg, #123d62, #17608a)',
    color: 'white', 
    border: 'none', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    fontSize: '1.05rem', 
    cursor: 'pointer', 
    textAlign: 'center', 
    width: '100%', 
    marginTop: '15px',
    boxShadow: '0 12px 24px rgba(18, 61, 98, 0.22)'
  },
  linkButton: { 
    background: 'none', 
    border: 'none', 
    color: '#17608a',
    fontWeight: '600', 
    cursor: 'pointer', 
    fontSize: '0.95rem',
    padding: 0
  }
};