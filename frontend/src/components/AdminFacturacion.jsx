import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function AdminFacturacion() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarSolicitudes = useCallback(async () => {
    try {
      const response = await api.get('/facturacion/pendientes');
      setSolicitudes(response.data);
    } catch {
      toast.error("Error al cargar las solicitudes de facturación.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/facturacion/pendientes')
      .then((response) => {
        if (active) setSolicitudes(response.data);
      })
      .catch(() => {
        if (active) toast.error("Error al cargar las solicitudes de facturación.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const cambiarEstatus = async (id, nuevoEstatus) => {
    try {
      await api.put(`/facturacion/estatus/${id}`, JSON.stringify(nuevoEstatus), {
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success(`Estatus actualizado a '${nuevoEstatus}'`);
      cargarSolicitudes(); // Recargar la tabla
    } catch {
      toast.error("Error al actualizar el estatus.");
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ color: '#1a365d', marginBottom: '8px', fontSize: '22px', fontWeight: '800' }}>
        📋 Solicitudes de Facturación Pendientes
      </h2>
      <p style={{ color: '#4a5568', marginBottom: '24px', fontSize: '14px' }}>
        Listado de clientes que han solicitado factura CFDI 4.0 mediante el formulario web.
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#718096' }}>Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '40px', textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#718096', fontSize: '15px' }}>No hay solicitudes de factura pendientes por ahora. 🎉</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#1a365d', color: 'white' }}>
                <th style={{ padding: '12px 14px' }}>Fecha</th>
                <th style={{ padding: '12px 14px' }}>Ticket / Importe</th>
                <th style={{ padding: '12px 14px' }}>RFC / Razón Social</th>
                <th style={{ padding: '12px 14px' }}>Datos Fiscales (C.P. / Régimen / Uso / Pago)</th>
                <th style={{ padding: '12px 14px' }}>Contacto</th>
                <th style={{ padding: '12px 14px' }}>Estatus</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#fff' : '#f7fafc' }}>
                  
                  {/* Fecha */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    {new Date(item.fechaSolicitud).toLocaleString()}
                  </td>

                  {/* Ticket e Importe */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 'bold', color: '#2b6cb0' }}>🎫 {item.numeroOrdenOid}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>F. Ticket: {item.fechaTicket}</div>
                    <div style={{ fontWeight: 'bold', color: '#2f855a', marginTop: '2px' }}>${item.importe?.toFixed(2)} MXN</div>
                  </td>

                  {/* RFC y Razón Social */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{item.rfc}</div>
                    <div style={{ color: '#4a5568', fontSize: '12px', maxWidth: '220px' }}>{item.razonSocial}</div>
                  </td>

                  {/* Datos Fiscales */}
                  <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                    <div><strong>C.P:</strong> {item.codigoPostalFiscal}</div>
                    <div><strong>Régimen:</strong> {item.regimenFiscal}</div>
                    <div><strong>Uso:</strong> {item.usoCfdi}</div>
                    <div style={{ color: '#718096' }}><strong>Pago:</strong> {item.formaPago}</div>
                  </td>

                  {/* Contacto */}
                  <td style={{ padding: '12px 14px', fontSize: '12px' }}>
                    <div style={{ color: '#3182ce' }}>✉️ {item.correo}</div>
                    <div style={{ color: '#276749', marginTop: '2px' }}>📱 {item.celular}</div>
                    {item.observaciones && (
                      <div style={{ fontStyle: 'italic', color: '#718096', marginTop: '3px', fontSize: '11px' }}>
                        Obs: {item.observaciones}
                      </div>
                    )}
                  </td>

                  {/* Estatus */}
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      backgroundColor: item.estatus === 'Pendiente' ? '#feebc8' : item.estatus === 'Facturada' ? '#c6f6d5' : '#fed7d7',
                      color: item.estatus === 'Pendiente' ? '#9c4221' : item.estatus === 'Facturada' ? '#22543d' : '#9b2c2c'
                    }}>
                      {item.estatus}
                    </span>
                  </td>

                  {/* Botones de Acción */}
                  <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      {item.estatus !== 'Facturada' && (
                        <button 
                          onClick={() => cambiarEstatus(item.id, 'Facturada')}
                          style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          Facturar
                        </button>
                      )}
                      {item.estatus !== 'Rechazada' && (
                        <button 
                          onClick={() => cambiarEstatus(item.id, 'Rechazada')}
                          style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                          Rechazar
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}