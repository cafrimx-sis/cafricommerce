import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function OrderHistory({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Ruta ajustada exactamente al endpoint de tu OrdenesController
      const response = await api.get('/api/ordenes/mis-compras');
      setOrders(response.data || []);
    } catch (err) {
      console.error("Error al cargar el historial de órdenes:", err);
      // Si da 404 u otro error porque no hay compras, lo manejamos limpiamente sin romper la UI
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Estilos de color para los distintos estatus del pedido
  const getStatusBadgeStyle = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pagado':
      case 'completado':
        return { bg: '#dcfce7', color: '#166534' };
      case 'enviado':
        return { bg: '#e0f2fe', color: '#0369a1' };
      case 'pendiente':
      case 'pendiente pago paypal':
      case 'pendiente de pago':
        return { bg: '#fef9c3', color: '#854d0e' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '1.1rem' }}>
        Cargando historial de compras...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyBox}>
          <span style={{ fontSize: '3rem' }}>📦</span>
          <h2 style={styles.title}>No tienes compras registradas</h2>
          <p style={styles.subtitle}>Tus pedidos de equipos y refacciones HVACR aparecerán aquí una vez que realices una compra.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <span style={styles.stepBadge}>Seguimiento</span>
        <h2 style={styles.title}>Mis Compras</h2>
        <p style={styles.subtitle}>Consulta el estatus actual y el desglose de tus pedidos anteriores.</p>
      </div>

      <div style={styles.ordersList}>
        {orders.map((order) => {
          // Mapeo exacto de las propiedades que envía tu entidad Orden en C#
          const orderId = order.id || order.Id;
          const isExpanded = expandedOrderId === orderId;
          const statusText = order.estadoOrden || order.EstadoOrden || 'Registrada';
          const statusStyle = getStatusBadgeStyle(statusText);
          const orderTotal = Number(order.total || order.Total || 0);
          const fechaOrden = order.fechaOrden || order.FechaOrden;
          
          // Detalles e items enviados por .NET Core (.Include(o => o.OrdenesDetalles))
          const itemsDetalle = order.ordenesDetalles || order.OrdenesDetalles || order.items || [];
          const direccion = order.direccionEnvio || order.DireccionEnvio;

          return (
            <div key={orderId} style={styles.orderCard}>
              <div 
                style={styles.orderSummaryRow} 
                onClick={() => toggleExpand(orderId)}
              >
                <div>
                  <span style={styles.orderId}>Folio: #{orderId}</span>
                  <p style={styles.orderDate}>
                    Fecha: {fechaOrden ? new Date(fechaOrden).toLocaleDateString() : 'Reciente'}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    padding: '5px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    {statusText}
                  </span>
                  
                  <span style={styles.orderTotal}>
                    ${orderTotal.toLocaleString()} MXN
                  </span>
                  
                  <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'bold' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div style={styles.orderDetails}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#004481', fontSize: '1rem', fontWeight: '700' }}>
                    Partidas del Pedido
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {itemsDetalle.map((item, idx) => {
                      const precioItem = Number(item.precioUnitario || item.PrecioUnitario || item.precio || 0);
                      const cantidadItem = Number(item.cantidad || item.Cantidad || 1);
                      const nombreProducto = item.producto?.nombre || item.Producto?.Nombre || item.nombre || 'Equipo HVACR';
                      
                      return (
                        <div key={idx} style={styles.itemRow}>
                          <span style={{ color: '#1e293b' }}>
                            <strong>{nombreProducto}</strong> (Cant: {cantidadItem})
                          </span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>
                            ${(precioItem * cantidadItem).toLocaleString()} MXN
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={styles.addressInfo}>
                    <strong>Dirección de entrega asignada:</strong> {
                      direccion 
                        ? `${direccion.calle || direccion.Calle} #${direccion.numeroExterior || direccion.NumeroExterior}, Col. ${direccion.colonia || direccion.Colonia}, ${direccion.ciudad || direccion.Ciudad}, ${direccion.estado || direccion.Estado}` 
                        : 'Domicilio registrado en perfil'
                    }
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { 
    maxWidth: '1000px', 
    margin: '30px auto', 
    background: '#ffffff', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08)', 
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box'
  },
  headerBox: { 
    marginBottom: '25px', 
    borderBottom: '2px solid #f1f5f9', 
    paddingBottom: '18px' 
  },
  stepBadge: {
    backgroundColor: '#ebf8ff',
    color: '#004481',
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
    color: '#004481', 
    margin: 0, 
    fontSize: '1.7rem',
    fontWeight: '700'
  },
  subtitle: { 
    color: '#64748b', 
    margin: '6px 0 0 0', 
    fontSize: '1rem' 
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  orderCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  orderSummaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px',
    cursor: 'pointer',
  },
  orderId: {
    fontWeight: '700',
    color: '#1e293b',
    fontSize: '1.05rem',
  },
  orderDate: {
    margin: '4px 0 0 0',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  orderTotal: {
    fontWeight: '700',
    color: '#004481',
    fontSize: '1.15rem',
  },
  orderDetails: {
    padding: '20px 22px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    padding: '6px 0',
    borderBottom: '1px dashed #f1f5f9',
  },
  addressInfo: {
    marginTop: '15px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '0.88rem',
    color: '#64748b',
    lineHeight: '1.4',
  }
};