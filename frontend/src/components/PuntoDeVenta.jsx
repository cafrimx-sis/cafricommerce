import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function PuntoDeVenta() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carritoPos, setCarritoPos] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [cliente, setCliente] = useState('Público General');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [procesando, setProcesando] = useState(false);

  const BASE_URL = 'http://localhost:5104';

  const getImageUrl = (rutaRaw) => {
    if (!rutaRaw) return "https://placehold.co/200x150?text=Sin+Imagen";
    if (rutaRaw.startsWith('http')) return rutaRaw;
    const fileName = rutaRaw.replace(/^.*[\\\/]/, ''); 
    return `${BASE_URL}/productos/${fileName}`;
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = () => {
    api.get('/productos')
      .then(res => {
        let lista = [];
        if (Array.isArray(res.data)) {
          lista = res.data;
        } else if (res.data && Array.isArray(res.data.$values)) {
          lista = res.data.$values;
        } else if (res.data && Array.isArray(res.data.items)) {
          lista = res.data.items;
        } else if (res.data && Array.isArray(res.data.productos)) {
          lista = res.data.productos;
        } else if (typeof res.data === 'object' && res.data !== null) {
          const posibleArray = Object.values(res.data).find(val => Array.isArray(val));
          lista = posibleArray || [];
        }
        setProductos(lista);
      })
      .catch(() => toast.error('Error al cargar el inventario de productos'));
  };

  const agregarAlTicket = (prod) => {
    const idClave = prod.id || prod.productoId;
    const nombreProd = prod.name || prod.nombre || 'Sin nombre';
    const precioProd = Number(prod.precioPublico ?? prod.precio ?? prod.price ?? 0);
    const stockMax = prod.stock ?? prod.Stock ?? 0;
    
    const rawImg = prod.imagenUrl || prod.imageUrl || prod.ImagenUrl || prod.imagen || prod.image || prod.rutaImagen;
    const imagenProd = getImageUrl(rawImg);

    if (stockMax <= 0) {
      toast.error('Este producto no tiene stock físico disponible');
      return;
    }

    setCarritoPos(prev => {
      const existe = prev.find(item => item.productoId === idClave);
      if (existe) {
        if (existe.cantidad >= stockMax) {
          toast.error('Límite del stock físico alcanzado');
          return prev;
        }
        return prev.map(item => 
          item.productoId === idClave ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      } else {
        return [...prev, {
          productoId: idClave,
          nombre: nombreProd,
          precioUnitario: precioProd,
          cantidad: 1,
          stockMax: stockMax,
          imagenUrl: imagenProd
        }];
      }
    });
  };

  const cambiarCantidad = (productoId, delta) => {
    setCarritoPos(prev => prev.map(item => {
      if (item.productoId === productoId) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > item.stockMax) {
          toast.error('Stock físico insuficiente en almacén');
          return item;
        }
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const eliminarDelTicket = (productoId) => {
    setCarritoPos(prev => prev.filter(item => item.productoId !== productoId));
  };

  const calcularSubtotal = () => {
    return carritoPos.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  };

  const calcularDescuentoMonto = () => {
    const subtotal = calcularSubtotal();
    const porcentaje = Number(descuentoPorcentaje) || 0;
    return (subtotal * porcentaje) / 100;
  };

  const calcularTotalFinal = () => {
    const subtotal = calcularSubtotal();
    const descuento = calcularDescuentoMonto();
    return Math.max(0, subtotal - descuento);
  };

  const procesarCobro = async () => {
    if (carritoPos.length === 0) {
      toast.error('El ticket está vacío');
      return;
    }

    const payload = {
      cliente: cliente.trim() || 'Público General',
      metodoPago: metodoPago,
      subtotal: calcularSubtotal(),
      descuentoPorcentaje: Number(descuentoPorcentaje) || 0,
      total: calcularTotalFinal(),
      items: carritoPos.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario
      }))
    };

    setProcesando(true);
    try {
      const response = await api.post('/ventas', payload);
      toast.success(`¡Venta cobrada con éxito! Folio #${response.data.ventaId || response.data.id || 'OK'}`);
      setCarritoPos([]);
      setCliente('Público General');
      setDescuentoPorcentaje(0);
      cargarProductos();
    } catch (err) {
      toast.error(err.response?.data?.mensaje || 'Error al procesar la venta física');
    } finally {
      setProcesando(false);
    }
  };

  const productosFiltrados = productos.filter(p => {
    const nombre = p.name || p.nombre || '';
    const sku = p.sku || '';
    return nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
           sku.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* Sección Izquierda: Catálogo Mostrador */}
      <div style={{ flex: 2, padding: '25px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '22px' }}>Punto de Venta - Mostrador Físico</h2>
        
        <input 
          type="text" 
          placeholder="🔍 Buscar equipo por nombre o SKU..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          style={{ width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', backgroundColor: 'white' }} 
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
          {productosFiltrados.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Cargando productos o sin resultados...</p>
          ) : (
            productosFiltrados.map(prod => {
              const idProd = prod.id || prod.productoId;
              const nombreProd = prod.name || prod.nombre || 'Sin nombre';
              const precioProd = Number(prod.precioPublico ?? prod.precio ?? prod.price ?? 0);
              const stock = prod.stock ?? prod.Stock ?? 0;
              
              const rawImg = prod.imagenUrl || prod.imageUrl || prod.ImagenUrl || prod.imagen || prod.image || prod.rutaImagen;
              const imagenProd = getImageUrl(rawImg);

              return (
                <div 
                  key={idProd} 
                  onClick={() => agregarAlTicket(prod)}
                  style={{ backgroundColor: 'white', borderRadius: '12px', padding: '15px', cursor: 'pointer', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                  <div>
                    <img 
                      src={imagenProd} 
                      alt={nombreProd} 
                      onError={(e) => { e.target.src = "https://placehold.co/200x150?text=Sin+Imagen"; }}
                      style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#e5e7eb' }} 
                    />
                    <h4 style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#1f2937', height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreProd}</h4>
                    <span style={{ fontSize: '11px', color: stock > 0 ? '#059669' : '#dc2626', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                      Stock: {stock} disp.
                    </span>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                      ${precioProd.toLocaleString()} MXN
                    </span>
                    <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                      + Agregar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sección Derecha: Ticket / Carrito POS */}
      <div style={{ width: '400px', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '25px', boxShadow: '-4px 0 15px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#111827', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
          Ticket de Venta Actual
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Nombre del Cliente:</label>
          <input 
            type="text" 
            value={cliente} 
            onChange={(e) => setCliente(e.target.value)} 
            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '10px 0' }}>
          {carritoPos.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '40px', fontSize: '14px' }}>Haz clic en los productos para agregarlos al ticket.</p>
          ) : (
            carritoPos.map(item => (
              <div key={item.productoId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#f9fafb', padding: '8px 10px', borderRadius: '8px' }}>
                <div style={{ flex: 1, marginRight: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{item.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>${item.precioUnitario.toLocaleString()} c/u</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => cambiarCantidad(item.productoId, -1)} style={{ padding: '2px 8px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.productoId, 1)} style={{ padding: '2px 8px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                  <button onClick={() => eliminarDelTicket(item.productoId)} style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', marginLeft: '4px' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Descuento (%):</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={descuentoPorcentaje} 
              onChange={(e) => setDescuentoPorcentaje(Math.max(0, Math.min(100, Number(e.target.value))))} 
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>Método de Pago:</label>
            <select 
              value={metodoPago} 
              onChange={(e) => setMetodoPago(e.target.value)}
              style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </div>

        {/* Resumen de totales */}
        <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px', borderTop: '1px dashed #e5e7eb', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Subtotal:</span>
            <span>${calcularSubtotal().toLocaleString()} MXN</span>
          </div>
          {descuentoPorcentaje > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#059669', fontWeight: '600' }}>
              <span>Descuento ({descuentoPorcentaje}%):</span>
              <span>-${calcularDescuentoMonto().toLocaleString()} MXN</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '6px 0' }}>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Total Final:</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af' }}>${calcularTotalFinal().toLocaleString()} MXN</span>
        </div>

        <button 
          disabled={procesando || carritoPos.length === 0} 
          onClick={procesarCobro}
          style={{ width: '100%', padding: '14px', backgroundColor: carritoPos.length === 0 ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: carritoPos.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          {procesando ? 'Procesando Venta...' : 'Completar y Cobrar Venta'}
        </button>
      </div>

    </div>
  );
}