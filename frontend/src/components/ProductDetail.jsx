import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://localhost:5104';

  const getImageUrl = (rutaRaw) => {
    if (!rutaRaw) return "https://placehold.co/400x400?text=Sin+Imagen";
    if (rutaRaw.startsWith('http')) return rutaRaw;
    const fileName = rutaRaw.replace(/^.*[\\\/]/, ''); 
    return `${BASE_URL}/productos/${fileName}`;
  };

  useEffect(() => {
    // Petición al backend para obtener los detalles del producto específico
    api.get(`/productos/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(err => {
        // Fallback por si el backend no tiene un endpoint por ID unitario y usa la lista general
        api.get('/productos')
          .then(resList => {
            const encontrado = resList.data.find(p => String(p.productoId || p.id) === String(id));
            if (encontrado) {
              setProduct(encontrado);
            } else {
              setError("El producto no fue encontrado.");
            }
            setLoading(false);
          })
          .catch(errList => {
            setError(errList.message);
            setLoading(false);
          });
      });
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#3483fa', fontWeight: 'bold' }}>Cargando producto...</div>;
  if (error || !product) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>⚠️ {error || "Producto no disponible."}</div>;

  const nombreProd = product.nombre || product.name || 'Equipo sin nombre';
  const precioProd = Number(product.precioPublico || product.price || 0);
  const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
  const stockDisponible = product.stock ?? 0;
  const descripcionProd = product.descripcion || product.description || 'Sin descripción detallada para este equipo.';
  const skuProd = product.sku || 'N/A';
  const marcaProdNombre = product.brand || product.marca?.nombre || '';
  const categoriaNombre = product.category || product.categoria?.nombre || 'General';
  const subcategoriaNombre = product.subCategory || product.subCategoria?.nombre;

  const handleAdd = () => {
    for (let i = 0; i < cantidad; i++) {
      const productoParaCarrito = {
        ...product,
        productoId: product.productoId || product.id,
        name: nombreProd,
        price: precioProd,
        urlImagen: getImageUrl(rutaRaw)
      };
      onAddToCart(productoParaCarrito);
    }
    toast.success(`${cantidad} pieza(s) agregada(s) al carrito`);
  };

  return (
    <div className="product-detail-container">
      <style>{`
        .product-detail-container {
          padding: 20px 40px;
          background-color: #ededed;
          min-height: 100vh;
          font-family: sans-serif;
          box-sizing: border-box;
        }
        .product-main-grid {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          padding: 30px;
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
        }
        .product-left-col {
          display: flex;
          flex-direction: column;
          gap: 30px;
          border-right: 1px solid #e5e7eb;
          padding-right: 20px;
        }
        .product-right-col {
          padding: 10px;
        }
        .product-image-preview {
          flex: 1;
          text-align: center;
          min-height: 350px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
        }
        .product-main-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
        }

        /* 📱 Adaptabilidad para Móviles y Tablets */
        @media (max-width: 900px) {
          .product-detail-container {
            padding: 12px;
          }
          .product-main-grid {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 16px;
          }
          .product-left-col {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
            gap: 20px;
          }
          .product-image-preview {
            min-height: 250px;
          }
          .product-main-image {
            max-height: 280px;
          }
        }
      `}</style>

      {/* Barra de Navegación superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '14px', color: '#333', flexWrap: 'wrap', gap: '5px' }}>
        <div>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#3483fa', cursor: 'pointer', fontWeight: '600', padding: 0, fontSize: '14px' }}
          >
            &lt; Volver al listado
          </button>
          <span style={{ margin: '0 10px', color: '#ccc' }}>|</span>
          <span style={{ color: '#666' }}>{categoriaNombre}</span>
          {subcategoriaNombre && subcategoriaNombre !== 'N/A' && <span style={{ color: '#666' }}> &gt; {subcategoriaNombre}</span>}
        </div>
      </div>

      {/* Tarjeta Principal de Detalle */}
      <div className="product-main-grid">
        
        {/* Columna Izquierda: Imágenes y Descripción */}
        <div className="product-left-col">
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '55px', height: '55px', border: '2px solid #3483fa', borderRadius: '6px', padding: '4px', cursor: 'pointer' }}>
                <img src={getImageUrl(rutaRaw)} alt="miniatura" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            <div className="product-image-preview">
              <img src={getImageUrl(rutaRaw)} alt={nombreProd} className="product-main-image" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '12px' }}>Lo que tienes que saber de este equipo</h3>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{descripcionProd}</p>
            <div style={{ marginTop: '15px', fontSize: '13px', color: '#666' }}>
              <p><strong>SKU:</strong> {skuProd}</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Caja de Compra */}
        <div className="product-right-col">
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Nuevo | Equipos especializados HVACR
          </div>
          
          {marcaProdNombre && marcaProdNombre !== 'N/A' && (
            <div style={{ fontSize: '13px', color: '#3483fa', fontWeight: 'bold', marginBottom: '8px' }}>
              Línea oficial de {marcaProdNombre}
            </div>
          )}

          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#333', lineHeight: '1.3', marginBottom: '12px', wordBreak: 'break-word' }}>
            {nombreProd}
          </h1>

          <div style={{ fontSize: '28px', fontWeight: '300', color: '#333', marginBottom: '12px' }}>
            ${precioProd.toLocaleString()} <span style={{ fontSize: '14px' }}>MXN</span>
          </div>

          <div style={{ color: '#00a650', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
            Disponible para entrega y proyectos
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>Stock disponible: </span>
            <span style={{ fontSize: '14px', color: '#666' }}>({stockDisponible} unidades)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Cantidad:</span>
            <select 
              value={cantidad} 
              onChange={(e) => setCantidad(Number(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: '#fff', outline: 'none' }}
            >
              {[...Array(Math.min(stockDisponible || 1, 10))].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} unidad{i > 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              disabled={stockDisponible <= 0}
              onClick={handleAdd}
              style={{ 
                width: '100%', padding: '14px', backgroundColor: stockDisponible <= 0 ? '#9ca3af' : '#3483fa', 
                color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: stockDisponible <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1)'
              }}
            >
              {stockDisponible <= 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px', fontSize: '13px', color: '#333', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ color: '#00a650', fontSize: '16px' }}>🛡️</span>
            <div>
              <strong>Garantía y Soporte Técnico.</strong> Respaldado para proyectos comerciales e industriales.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}