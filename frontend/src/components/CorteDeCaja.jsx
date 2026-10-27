import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CorteDeCaja() {
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [historialCortes, setHistorialCortes] = useState([]);
  const [fondoInicial, setFondoInicial] = useState(0);
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [corteSeleccionado, setCorteSeleccionado] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const resVentas = await api.get('/ventas?sinCorte=true');
      const listaVentas = Array.isArray(resVentas.data) ? resVentas.data : (resVentas.data?.$values || []);
      setVentasPendientes(listaVentas);

      const resCortes = await api.get('/cortes');
      setHistorialCortes(Array.isArray(resCortes.data) ? resCortes.data : (resCortes.data?.$values || []));
    } catch (err) {
      console.error(err);
      toast.error('Error al sincronizar datos de caja');
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/ventas?sinCorte=true'),
      api.get('/cortes')
    ])
      .then(([resVentas, resCortes]) => {
        if (!active) return;
        const listaVentas = Array.isArray(resVentas.data) ? resVentas.data : (resVentas.data?.$values || []);
        setVentasPendientes(listaVentas);
        setHistorialCortes(Array.isArray(resCortes.data) ? resCortes.data : (resCortes.data?.$values || []));
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        toast.error('Error al sincronizar datos de caja');
      });

    return () => {
      active = false;
    };
  }, []);

  const calcularTotalesPendientes = () => {
    const efectivo = ventasPendientes.filter(v => (v.metodoPago || v.MetodoPago) === 'Efectivo').reduce((acc, v) => acc + (v.total || v.Total || 0), 0);
    const tarjeta = ventasPendientes.filter(v => (v.metodoPago || v.MetodoPago) === 'Tarjeta').reduce((acc, v) => acc + (v.total || v.Total || 0), 0);
    const transferencia = ventasPendientes.filter(v => (v.metodoPago || v.MetodoPago) === 'Transferencia').reduce((acc, v) => acc + (v.total || v.Total || 0), 0);
    const granTotal = efectivo + tarjeta + transferencia;

    return { efectivo, tarjeta, transferencia, granTotal };
  };

  const totales = calcularTotalesPendientes();
  const efectivoEsperadoEnCaja = totales.efectivo + Number(fondoInicial);
  const diferenciaArqueo = Number(efectivoContado) - efectivoEsperadoEnCaja;

  const ejecutarCorte = async (e) => {
    e.preventDefault();
    if (ventasPendientes.length === 0) {
      toast.error('No hay ventas pendientes de cortar');
      return;
    }

    if (!window.confirm('¿Deseas registrar este corte de caja de forma definitiva?')) return;

    setProcesando(true);
    try {
      await api.post('/cortes', {
        fondoInicial: Number(fondoInicial) || 0,
        efectivoContado: Number(efectivoContado) || 0,
        observaciones: observaciones.trim()
      });
      toast.success('¡Corte de caja realizado y guardado con éxito!');
      setFondoInicial(0);
      setEfectivoContado(0);
      setObservaciones('');
      cargarDatos();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al guardar el corte');
    } finally {
      setProcesando(false);
    }
  };

  const imprimirCorte = (corte) => {
    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
    if (!ventanaImpresion) {
      toast.error('Por favor, permite las ventanas emergentes en tu navegador para imprimir.');
      return;
    }

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Corte de Caja #${corte.id || corte.Id}</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 10px; width: 300px; margin: 0 auto; }
            h2, h3 { text-align: center; margin: 5px 0; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>REPORTE DE CORTE</h2>
          <h3>Folio #${corte.id || corte.Id}</h3>
          <p style="text-align:center;">${new Date(corte.fechaCorte || corte.FechaCorte).toLocaleString()}</p>
          <div class="line"></div>
          <div class="row"><span>Ventas realizadas:</span> <span class="bold">${corte.totalVentas || corte.TotalVentas}</span></div>
          <div class="row"><span>Fondo inicial:</span> <span>$${(corte.fondoInicial || corte.FondoInicial || 0).toLocaleString()}</span></div>
          <div class="row"><span>Efectivo sistema:</span> <span>$${(corte.totalEfectivoSistema || corte.TotalEfectivoSistema || 0).toLocaleString()}</span></div>
          <div class="row"><span>Efectivo contado:</span> <span>$${(corte.efectivoContado || corte.EfectivoContado || 0).toLocaleString()}</span></div>
          <div class="row bold"><span>Diferencia:</span> <span>$${(corte.diferencia || corte.Diferencia || 0).toLocaleString()}</span></div>
          <div class="line"></div>
          <div class="row"><span>Tarjetas:</span> <span>$${(corte.totalTarjeta || corte.TotalTarjeta || 0).toLocaleString()}</span></div>
          <div class="row"><span>Transferencias:</span> <span>$${(corte.totalTransferencia || corte.TotalTransferencia || 0).toLocaleString()}</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size: 14px;"><span>GRAN TOTAL:</span> <span>$${(corte.granTotal || corte.GranTotal || 0).toLocaleString()}</span></div>
          ${corte.observaciones ? `<p><strong>Obs:</strong> ${corte.observaciones}</p>` : ''}
          <div class="line"></div>
          <p style="text-align:center; margin-top:20px;">*** FIN DE CORTE ***</p>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => ventanaImpresion.print(), 500);
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <style>{`
        .corte-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 2fr;
          gap: 12px;
          align-items: end;
          margin-bottom: 16px;
        }

        .table-responsive-box {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .corte-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <h2 style={{ color: '#111827', marginBottom: '16px', fontSize: '1.4rem' }}>Arqueo y Corte de Caja</h2>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#1f2937' }}>Turno Actual (Pendiente de Corte)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Efectivo en Ventas</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>${totales.efectivo.toLocaleString()} MXN</span>
          </div>
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Tarjetas</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2563eb' }}>${totales.tarjeta.toLocaleString()} MXN</span>
          </div>
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', display: 'block' }}>Transferencias</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#7c3aed' }}>${totales.transferencia.toLocaleString()} MXN</span>
          </div>
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '12px', color: '#1e40af', display: 'block', fontWeight: '600' }}>Ventas ({ventasPendientes.length})</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a8a' }}>${totales.granTotal.toLocaleString()} MXN</span>
          </div>
        </div>

        <form onSubmit={ejecutarCorte} className="corte-form-grid">
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Fondo Inicial ($):</label>
            <input 
              type="number" 
              step="0.01" 
              value={fondoInicial} 
              onChange={(e) => setFondoInicial(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Efectivo Contado ($):</label>
            <input 
              type="number" 
              step="0.01" 
              value={efectivoContado} 
              onChange={(e) => setEfectivoContado(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Observaciones:</label>
            <input 
              type="text" 
              placeholder="Ej. Turno matutino..." 
              value={observaciones} 
              onChange={(e) => setObservaciones(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
        </form>

        {Number(efectivoContado) > 0 && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: diferenciaArqueo === 0 ? '#f0fdf4' : diferenciaArqueo > 0 ? '#eff6ff' : '#fef2f2', border: `1px solid ${diferenciaArqueo === 0 ? '#bbf7d0' : diferenciaArqueo > 0 ? '#bfdbfe' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
              Arqueo (Esperado: ${efectivoEsperadoEnCaja.toLocaleString()}):
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: diferenciaArqueo === 0 ? '#16a34a' : diferenciaArqueo > 0 ? '#2563eb' : '#dc2626' }}>
              {diferenciaArqueo === 0 ? '✓ Caja Exacta' : diferenciaArqueo > 0 ? `+ Sobrante de $${diferenciaArqueo.toLocaleString()}` : `- Faltante de $${Math.abs(diferenciaArqueo).toLocaleString()}`}
            </span>
          </div>
        )}

        <button 
          type="button"
          disabled={procesando || ventasPendientes.length === 0}
          onClick={ejecutarCorte}
          style={{ width: '100%', padding: '12px', backgroundColor: ventasPendientes.length === 0 ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: ventasPendientes.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          {procesando ? 'Guardando Corte...' : 'Generar y Guardar Corte de Caja'}
        </button>
      </div>

      <h3 style={{ color: '#111827', marginBottom: '12px', fontSize: '16px' }}>Historial de Cortes Registrados</h3>
      <div className="table-responsive-box" style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#374151' }}>
              <th style={{ padding: '10px' }}>Folio</th>
              <th style={{ padding: '10px' }}>Fecha</th>
              <th style={{ padding: '10px' }}>Ventas</th>
              <th style={{ padding: '10px' }}>Fondo</th>
              <th style={{ padding: '10px' }}>Diferencia</th>
              <th style={{ padding: '10px' }}>Gran Total</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historialCortes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No hay cortes registrados.</td>
              </tr>
            ) : (
              historialCortes.map(corte => {
                const idC = corte.id || corte.Id;
                const fechaC = corte.fechaCorte || corte.FechaCorte;
                const totalV = corte.totalVentas || corte.TotalVentas;
                const fondoI = corte.fondoInicial || corte.FondoInicial || 0;
                const dif = corte.diferencia || corte.Diferencia || 0;
                const granT = corte.granTotal || corte.GranTotal || 0;

                return (
                  <tr key={idC} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>#{idC}</td>
                    <td style={{ padding: '10px' }}>{new Date(fechaC).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{totalV}</td>
                    <td style={{ padding: '10px' }}>${fondoI.toLocaleString()}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: dif === 0 ? '#16a34a' : dif > 0 ? '#2563eb' : '#dc2626' }}>
                      ${dif.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#111827' }}>${granT.toLocaleString()}</td>
                    <td style={{ padding: '10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => setCorteSeleccionado(corte)}
                        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginRight: '4px' }}
                      >
                        Ver
                      </button>
                      <button 
                        type="button"
                        onClick={() => imprimirCorte(corte)}
                        style={{ background: '#4b5563', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        🖨️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {corteSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '560px', maxHeight: '85vh', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>Ventas del Corte #{corteSeleccionado.id || corteSeleccionado.Id}</h3>
              <button type="button" onClick={() => setCorteSeleccionado(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '6px' }}>Folio</th>
                    <th style={{ padding: '6px' }}>Cliente</th>
                    <th style={{ padding: '6px' }}>Pago</th>
                    <th style={{ padding: '6px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(corteSeleccionado.ventas || corteSeleccionado.Ventas || []).map(v => (
                    <tr key={v.ventaId || v.VentaId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '6px' }}>#{v.ventaId || v.VentaId}</td>
                      <td style={{ padding: '6px' }}>{v.cliente || v.Cliente}</td>
                      <td style={{ padding: '6px' }}>{v.metodoPago || v.MetodoPago}</td>
                      <td style={{ padding: '6px', fontWeight: 'bold', color: '#1e40af' }}>${(v.total || v.Total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              type="button"
              onClick={() => setCorteSeleccionado(null)}
              style={{ padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}