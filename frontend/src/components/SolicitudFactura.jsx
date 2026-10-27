import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function SolicitudFactura() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    folioVenta: '',
    fechaTicket: '',
    importe: '',
    razonSocial: '',
    rfc: '',
    regimenFiscal: '',
    codigoPostalFiscal: '',
    formaPago: '01 - Efectivo',
    usoCfdi: '',
    correo: '',
    celular: '',
    observaciones: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/facturacion/solicitar', {
        ...formData,
        importe: parseFloat(formData.importe) || 0,
        rfc: formData.rfc.toUpperCase().trim(),
        razonSocial: formData.razonSocial.toUpperCase().trim()
      });

      toast.success(response.data.mensaje || "Solicitud enviada exitosamente.");
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '6px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  return (
    <div style={{ backgroundColor: '#edf2f7', minHeight: '100vh', padding: '40px 16px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Cabecera Principal */}
        <div style={{ ...cardStyle, borderTop: '6px solid #1a365d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>📑</span>
            <h1 style={{ fontSize: '24px', color: '#1a365d', margin: 0, fontWeight: '800' }}>Solicitar Factura</h1>
          </div>
          <p style={{ color: '#4a5568', fontSize: '14px', margin: 0 }}>
            Completa el formulario con tus datos fiscales de la Constancia de Situación Fiscal.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Tarjeta 1: Datos de la Venta */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', color: '#2b6cb0', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              1. Llenado de Información del Ticket
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Folio de Venta / # Ticket *</label>
              <input type="text" name="folioVenta" value={formData.folioVenta} onChange={handleChange} style={inputStyle} placeholder="Anotar folio o ticket de venta" required />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Fecha de ticket *</label>
                <input type="date" name="fechaTicket" value={formData.fechaTicket} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Importe Total ($) *</label>
                <input type="number" step="0.01" name="importe" value={formData.importe} onChange={handleChange} style={inputStyle} placeholder="Ej. 1250.00" required />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Datos Fiscales */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', color: '#2b6cb0', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              2. Datos Fiscales (CFDI 4.0)
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Razón Social / Nombre *</label>
              <input type="text" name="razonSocial" value={formData.razonSocial} onChange={handleChange} style={inputStyle} placeholder="Tal cual aparece en tu Cédula Fiscal" required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>RFC *</label>
              <input type="text" name="rfc" value={formData.rfc} onChange={handleChange} style={inputStyle} placeholder="Ej. XAXX010101000" required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Régimen Fiscal *</label>
              <select name="regimenFiscal" value={formData.regimenFiscal} onChange={handleChange} style={{ ...inputStyle, backgroundColor: '#fff' }} required>
                <option value="">-- Elige un régimen --</option>
                <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                <option value="605 - Sueldos y Salarios e Ingresos por Asimilados a Salarios">605 - Sueldos y Salarios</option>
                <option value="606 - Arrendamiento">606 - Arrendamiento</option>
                <option value="612 - Personas Físicas con Actividades Empresariales y Profesionales">612 - Personas Físicas con Actividades Empresariales</option>
                <option value="626 - Régimen Simplificado de Confianza (RESICO)">626 - RESICO</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Código Postal Fiscal *</label>
                <input type="text" maxLength="5" name="codigoPostalFiscal" value={formData.codigoPostalFiscal} onChange={handleChange} style={inputStyle} placeholder="Ej. 97000" required />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Forma de Pago *</label>
                <select name="formaPago" value={formData.formaPago} onChange={handleChange} style={{ ...inputStyle, backgroundColor: '#fff' }} required>
                  <option value="01 - Efectivo">01 - Efectivo</option>
                  <option value="03 - Transferencia electrónica de fondos">03 - Transferencia electrónica</option>
                  <option value="04 - Tarjeta de crédito">04 - Tarjeta de crédito</option>
                  <option value="28 - Tarjeta de débito">28 - Tarjeta de débito</option>
                  <option value="99 - Por definir">99 - Por definir</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Uso y Contacto */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', color: '#2b6cb0', marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>
              3. Uso de CFDI y Datos de Contacto
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Uso de CFDI *</label>
              <select name="usoCfdi" value={formData.usoCfdi} onChange={handleChange} style={{ ...inputStyle, backgroundColor: '#fff' }} required>
                <option value="">-- Elige Uso de CFDI --</option>
                <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                <option value="I08 - Equipos de computación y accesorios">I08 - Equipos e instalaciones</option>
                <option value="CP01 - Pagos">CP01 - Pagos</option>
                <option value="S01 - Sin efectos fiscales">S01 - Sin efectos fiscales</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Correo Electrónico *</label>
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} style={inputStyle} placeholder="tucorreo@empresa.com" required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Número de celular (WhatsApp) *</label>
              <input type="tel" name="celular" value={formData.celular} onChange={handleChange} style={inputStyle} placeholder="10 dígitos para contacto" required />
            </div>

            <div>
              <label style={labelStyle}>Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Comentario o solicitud especial sobre tu factura..." />
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#4a5568', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>← Volver</Link>
            <button type="submit" disabled={loading} style={{ backgroundColor: '#1a365d', color: 'white', padding: '14px 32px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}