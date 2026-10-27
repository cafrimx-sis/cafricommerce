import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { getCurrentProductPricing } from '../lib/productPricing';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

  const getImageUrl = (rutaRaw) => {
    if (!rutaRaw) return "https://placehold.co/400x400?text=Sin+Imagen";
    if (rutaRaw.startsWith('http')) return rutaRaw;
    const fileName = rutaRaw.replaceAll('\\', '/').split('/').pop() || '';
    return `${BASE_URL}/productos/${fileName}`;
  };

  useEffect(() => {
    // Petición al backend para obtener los detalles del producto específico
    api.get(`/productos/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
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
  const pricing = getCurrentProductPricing(product);
  const precioProd = pricing.price;
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
        ...pricing,
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
          min-height: 100%;
          padding: clamp(18px, 4vw, 48px);
          background:
            radial-gradient(circle at 90% 8%, rgba(18,184,166,0.08), transparent 23rem),
            transparent;
        }
        .product-main-grid {
          max-width: 1320px;
          margin: 0 auto;
          background: rgba(255,255,255,0.94);
          border-radius: 24px;
          box-shadow: 0 18px 52px rgba(10,42,67,0.1);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 400px);
          gap: clamp(20px, 4vw, 54px);
          padding: clamp(20px, 4vw, 52px);
          border: 1px solid #e3edf2;
          box-sizing: border-box;
          animation: rise-in 500ms ease both;
        }
        .product-left-col {
          display: flex;
          flex-direction: column;
          gap: 26px;
          border-right: 1px solid #eaf0f4;
          padding-right: clamp(16px, 3vw, 36px);
        }
        .product-right-col {
          align-self: center;
          padding: 8px 0;
        }
        .product-image-preview {
          flex: 1;
          text-align: center;
          min-height: 430px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 18px;
          background:
            radial-gradient(circle at 50% 42%, rgba(18,184,166,0.13), transparent 57%),
            linear-gradient(145deg, #f5f9fb, #edf4f7);
        }
        .product-main-image {
          max-width: 100%;
          max-height: 440px;
          object-fit: contain;
          mix-blend-mode: multiply;
          transition: transform 400ms ease;
        }
        .product-image-preview:hover .product-main-image {
          transform: scale(1.035);
        }
        .product-breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          max-width: 1320px;
          margin: 0 auto 17px;
          color: #6d8496;
          font-size: 0.84rem;
          flex-wrap: wrap;
        }
        .product-back-button {
          padding: 6px 0;
          border: 0;
          color: #147d89;
          background: transparent;
          font-weight: 800;
          cursor: pointer;
        }
        .product-back-button:hover {
          color: #0c4d68;
        }
        .product-description {
          padding-top: 22px;
          border-top: 1px solid #e7eef2;
        }
        .product-description h3 {
          margin: 0 0 10px;
          color: #193850;
          font-size: 1.12rem;
        }
        .product-description p {
          color: #64798a;
          font-size: 0.94rem;
          line-height: 1.8;
          white-space: pre-line;
          word-break: break-word;
        }
        .product-sku {
          margin-top: 16px;
          padding: 10px 12px;
          color: #60798a;
          background: #f5f8fa;
          border-radius: 9px;
          font-size: 0.8rem;
        }
        .product-eyebrow {
          margin-bottom: 10px;
          color: #71889a;
          font-size: 0.77rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .product-brand-label {
          display: inline-flex;
          margin-bottom: 12px;
          padding: 6px 10px;
          color: #087b75;
          background: #e4f8f4;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 800;
        }
        .product-title {
          margin: 0 0 16px;
          color: #0b2942;
          font-size: clamp(1.55rem, 2.4vw, 2.25rem);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.045em;
          word-break: break-word;
        }
        .product-price {
          margin-bottom: 16px;
          color: #0c5473;
          font-size: clamp(1.9rem, 3vw, 2.55rem);
          font-weight: 800;
          letter-spacing: -0.055em;
        }
        .product-price span {
          color: #7b8fa0;
          font-size: 0.92rem;
          font-weight: 600;
          letter-spacing: 0;
        }
        .product-stock {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #13836e;
          font-size: 0.9rem;
          font-weight: 700;
        }
        .product-stock::before {
          width: 8px;
          height: 8px;
          content: "";
          border-radius: 50%;
          background: #19b58f;
          box-shadow: 0 0 0 4px rgba(25,181,143,0.12);
        }
        .product-quantity {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #29445a;
          font-size: 0.9rem;
          font-weight: 700;
        }
        .product-quantity select {
          padding: 10px 13px;
          border: 1px solid #dce7ed;
          border-radius: 9px;
          background: #f8fafb;
          color: #18344c;
        }
        .product-add-button {
          width: 100%;
          min-height: 52px;
          padding: 14px;
          color: white;
          background: linear-gradient(135deg, #0d4768, #147da0);
          border: 0;
          border-radius: 12px;
          box-shadow: 0 10px 22px rgba(16, 101, 137, 0.19);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
        }
        .product-add-button:not(:disabled):hover {
          background: linear-gradient(135deg, #08796f, #13aa95);
          box-shadow: 0 13px 25px rgba(18, 164, 139, 0.26);
          transform: translateY(-2px);
        }
        .product-add-button:disabled {
          background: #9eabb4;
          box-shadow: none;
          cursor: not-allowed;
        }
        .product-trust {
          margin-top: 20px;
          padding: 15px;
          color: #456276;
          background: linear-gradient(120deg, #eff8f8, #f4f8fb);
          border: 1px solid #e2eff0;
          border-radius: 12px;
          font-size: 0.82rem;
          line-height: 1.55;
        }
        .product-trust strong {
          color: #173b54;
        }

        @media (max-width: 900px) {
          .product-detail-container {
            padding: 18px 14px 36px;
          }
          .product-main-grid {
            grid-template-columns: 1fr;
            padding: 22px;
            gap: 22px;
          }
          .product-left-col {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid #e5edf2;
            padding-bottom: 22px;
          }
          .product-image-preview {
            min-height: 320px;
          }
          .product-main-image {
            max-height: 340px;
          }
        }
        @media (max-width: 560px) {
          .product-main-grid {
            padding: 15px;
            border-radius: 17px;
          }
          .product-image-preview {
            min-height: 240px;
          }
          .product-main-image {
            max-height: 270px;
          }
        }
      `}</style>

      {/* Barra de Navegación superior */}
      <div className="product-breadcrumb">
        <div>
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="product-back-button"
          >
            ← Volver al catálogo
          </button>
          <span aria-hidden="true">/</span>
          <span>{categoriaNombre}</span>
          {subcategoriaNombre && subcategoriaNombre !== 'N/A' && <><span aria-hidden="true">/</span><span>{subcategoriaNombre}</span></>}
        </div>
      </div>

      {/* Tarjeta Principal de Detalle */}
      <div className="product-main-grid">
        
        {/* Columna Izquierda: Imágenes y Descripción */}
        <div className="product-left-col">
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ width: '55px', height: '55px', border: '2px solid #25b8a7', borderRadius: '9px', padding: '4px', cursor: 'pointer', background: '#effaf8' }}>
                <img src={getImageUrl(rutaRaw)} alt="Miniatura del producto" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
            <div className="product-image-preview">
              <img src={getImageUrl(rutaRaw)} alt={nombreProd} className="product-main-image" />
            </div>
          </div>

          <div className="product-description">
            <h3>Características del equipo</h3>
            <p>{descripcionProd}</p>
            <div className="product-sku">
              <strong>SKU:</strong> {skuProd}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Caja de Compra */}
        <div className="product-right-col">
          <div className="product-eyebrow">
            Nuevo | Equipos especializados HVACR
          </div>
          
          {marcaProdNombre && marcaProdNombre !== 'N/A' && (
            <div className="product-brand-label">
              Línea oficial de {marcaProdNombre}
            </div>
          )}

          <h1 className="product-title">
            {nombreProd}
          </h1>

          <div className="product-price">
            {pricing.offerActive ? (
              <>
                <span style={{ display: 'block', color: '#8293a0', fontSize: '1rem', textDecoration: 'line-through' }}>
                  ${pricing.originalPrice.toLocaleString()} MXN
                </span>
                <strong style={{ color: '#c24135' }}>${precioProd.toLocaleString()}</strong>
                <span style={{ color: '#c24135' }}> MXN · {pricing.discountPercentage}% de descuento</span>
              </>
            ) : (
              <>${precioProd.toLocaleString()} <span>MXN</span></>
            )}
          </div>

          <div className="product-stock">
            {stockDisponible > 0 ? `Disponible · ${stockDisponible} unidades` : 'Agotado temporalmente'}
          </div>

          <div className="product-quantity">
            <span>Cantidad</span>
            <select 
              value={cantidad} 
              onChange={(e) => setCantidad(Number(e.target.value))}
            >
              {[...Array(Math.min(stockDisponible || 1, 10))].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} unidad{i > 0 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={stockDisponible <= 0}
              onClick={handleAdd}
              className="product-add-button"
            >
              {stockDisponible <= 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
          </div>

          <div className="product-trust">
            <span style={{ color: '#0b9f87', fontSize: '16px', marginRight: '8px' }}>✦</span>
            <div>
              <strong>Garantía y Soporte Técnico.</strong> Respaldado para proyectos comerciales e industriales.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}