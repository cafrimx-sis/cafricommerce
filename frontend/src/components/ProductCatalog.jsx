import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { getCurrentProductPricing } from '../lib/productPricing';

export default function ProductCatalog({ onAddToCart, cart = [] }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);

  // Estados para filtro por rangos de precio
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPromoPaused, setIsPromoPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const BASE_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

  const getImageUrl = (rutaRaw) => {
    if (!rutaRaw) return "https://placehold.co/280x180?text=Sin+Imagen";
    if (rutaRaw.startsWith('http')) return rutaRaw;
    const fileName = rutaRaw.replaceAll('\\', '/').split('/').pop() || '';
    return `${BASE_URL}/productos/${fileName}`;
  };

  useEffect(() => {
    Promise.all([
      api.get('/productos'),
      api.get('/categorias'),
      api.get('/subcategorias'),
      api.get('/marcas')
    ])
    .then(([resProd, resCat, resSub, resMar]) => {
      setProducts(resProd.data || []);
      setCategorias(resCat.data || []);
      setSubcategorias(resSub.data || []);
      setMarcas(resMar.data || []);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();
    const intervalId = window.setInterval(updateCurrentTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const applyFilter = (setFilter, value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleAdd = (product, e) => {
    e.stopPropagation();
    const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
    const productoParaCarrito = {
      ...product,
      productoId: product.productoId || product.id,
      name: product.nombre || product.name,
      price: getCurrentProductPricing(product).price,
      urlImagen: getImageUrl(rutaRaw)
    };

    onAddToCart(productoParaCarrito);
    toast.success(`${productoParaCarrito.name} agregado al carrito`);
  };

  const filteredProducts = products.filter(p => {
    const textoBusqueda = busqueda.toLowerCase().trim();

    // Búsqueda por Nombre o por SKU
    const nombreProducto = (p.nombre || p.name || '').toLowerCase();
    const skuProducto = (p.sku || p.Sku || p.codigoSku || p.codigo || '').toLowerCase();
    const coincideBusqueda = nombreProducto.includes(textoBusqueda) || (skuProducto && skuProducto.includes(textoBusqueda));

    // Filtro por Rango de Precios
    const precioProd = getCurrentProductPricing(p).price;
    if (precioMin !== '' && !isNaN(precioMin)) {
      if (precioProd < Number(precioMin)) return false;
    }
    if (precioMax !== '' && !isNaN(precioMax)) {
      if (precioProd > Number(precioMax)) return false;
    }

    const catIdProd = p.categoriaId || p.categoryId;
    const subCatIdProd = p.subCategoriaId || p.subCategoryId;
    const catNombreProd = (p.category || p.categoria?.nombre || '').toLowerCase();
    const subCatNombreProd = (p.subCategory || p.subCategoria?.nombre || '').toLowerCase();

    const marcaIdProd = p.mainMarcaId || p.marcaId;
    const marcaNombreProd = (p.brand || p.marca?.nombre || '').toLowerCase();

    if (selectedBrand !== 'Todas') {
      const coincideMarca = marcaIdProd === selectedBrand || marcaNombreProd === String(selectedBrand).toLowerCase();
      if (!coincideMarca) return false;
    }

    if (selectedCategory === 'Todos') {
      return coincideBusqueda;
    }

    if (selectedSubCategory !== null) {
      return coincideBusqueda && (subCatIdProd === selectedSubCategory || subCatNombreProd === String(selectedSubCategory).toLowerCase());
    }

    const coincideCat = catIdProd === selectedCategory || catNombreProd === String(selectedCategory).toLowerCase();
    return coincideBusqueda && coincideCat;
  });

  const promoSlides = [
    {
      type: 'welcome',
      kicker: 'Soluciones HVACR para profesionales',
      title: <>El clima perfecto para <span>cada proyecto.</span></>,
      description: 'Encuentra equipos y componentes de climatización, refrigeración y ventilación con el respaldo técnico que tu operación necesita.',
      actionLabel: 'Explorar productos',
      onAction: () => document.getElementById('catalog-product-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    ...products
      .map(product => {
        const pricing = getCurrentProductPricing(product);
        const startsAt = product.featuredStartUtc ? Date.parse(product.featuredStartUtc) : Number.NaN;
        const endsAt = product.featuredEndUtc ? Date.parse(product.featuredEndUtc) : Number.NaN;
        const featuredActive = Boolean(product.isFeatured) &&
          Number.isFinite(startsAt) &&
          Number.isFinite(endsAt) &&
          startsAt <= currentTime &&
          currentTime < endsAt;
        return { product, pricing, featuredActive };
      })
      .filter(({ pricing, featuredActive }) => pricing.offerActive || featuredActive)
      .sort((a, b) =>
        Number(b.featuredActive) - Number(a.featuredActive) ||
        b.pricing.discountPercentage - a.pricing.discountPercentage)
      .slice(0, 5)
      .map(({ product, pricing, featuredActive }) => ({
        type: featuredActive ? 'featured' : 'offer',
        kicker: featuredActive
          ? `Producto nuevo o destacado${pricing.offerActive ? ` · Oferta ${pricing.discountPercentage}%` : ''}`
          : `Oferta vigente · ${pricing.discountPercentage}% de descuento`,
        title: <>{product.nombre || product.name || 'Producto destacado'} <span>{featuredActive ? 'conoce esta novedad' : 'por tiempo limitado'}</span></>,
        description: pricing.offerActive
          ? `Antes $${pricing.originalPrice.toLocaleString()} MXN. Aprovecha el precio especial de $${pricing.price.toLocaleString()} MXN.`
          : product.description || 'Descubre este producto nuevo que CAFRI seleccionó para ti.',
        actionLabel: 'Ver producto',
        imageUrl: getImageUrl(product.image || product.imageUrl || product.imagenUrl || ''),
        onAction: () => navigate(`/producto/${product.productoId || product.id}`)
      }))
  ];
  const activePromoIndex = currentPromoIndex % promoSlides.length;
  const currentPromo = promoSlides[activePromoIndex];

  useEffect(() => {
    if (isPromoPaused || promoSlides.length < 2) return undefined;
    const intervalId = window.setInterval(() => {
      setCurrentPromoIndex(index => (index + 1) % promoSlides.length);
    }, 7000);
    return () => window.clearInterval(intervalId);
  }, [isPromoPaused, promoSlides.length]);

  const showPromo = (index) => {
    setCurrentPromoIndex((index + promoSlides.length) % promoSlides.length);
  };

  // Cálculo de elementos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) return <div className="catalog-state"><span className="catalog-spinner" />Preparando el catálogo para ti...</div>;
  if (error) return <div className="catalog-state catalog-state-error">⚠️ No pudimos conectar con la tienda. {error}</div>;

  return (
    <div className="catalog-page">
      <style>{`
        .catalog-page {
          min-height: 100%;
          padding-bottom: 56px;
        }
        .catalog-hero {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          max-width: 1512px;
          min-height: 320px;
          margin: 26px auto 0;
          padding: clamp(28px, 5vw, 58px) clamp(24px, 6vw, 72px) 76px;
          color: white;
          background:
            radial-gradient(circle at 78% 52%, rgba(33, 194, 178, 0.35), transparent 13rem),
            radial-gradient(circle at 91% 8%, rgba(87, 188, 222, 0.22), transparent 17rem),
            linear-gradient(118deg, #071b30 0%, #10395a 57%, #125b72 100%);
          border-radius: 0 0 30px 30px;
          box-shadow: 0 22px 50px rgba(8, 35, 59, 0.19);
          animation: rise-in 600ms ease both;
        }
        .catalog-hero::before,
        .catalog-hero::after {
          position: absolute;
          z-index: -1;
          content: "";
          border: 1px solid rgba(218, 255, 250, 0.16);
          border-radius: 50%;
          pointer-events: none;
        }
        .catalog-hero::before {
          width: 390px;
          height: 390px;
          right: 6%;
          top: -220px;
        }
        .catalog-hero::after {
          width: 310px;
          height: 310px;
          right: 12%;
          bottom: -230px;
        }
        .catalog-hero-copy {
          max-width: 680px;
        }
        .catalog-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 7px 12px;
          color: #a5f3e7;
          background: rgba(18, 184, 166, 0.13);
          border: 1px solid rgba(122, 239, 220, 0.2);
          border-radius: 50px;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .catalog-kicker::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ce0c3;
          box-shadow: 0 0 12px #4ce0c3;
        }
        .catalog-hero h1 {
          max-width: 670px;
          margin: 0;
          color: white;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.055em;
        }
        .catalog-hero h1 span {
          color: #66e0cd;
        }
        .catalog-hero-copy p {
          max-width: 570px;
          margin: 15px 0 22px;
          color: #c2d5e4;
          font-size: clamp(0.96rem, 1.5vw, 1.08rem);
          line-height: 1.7;
        }
        .catalog-hero-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          color: #062839;
          background: linear-gradient(135deg, #a5f3e7, #42d2bd);
          border: 0;
          border-radius: 11px;
          box-shadow: 0 9px 20px rgba(30, 203, 179, 0.19);
          font-weight: 800;
          cursor: pointer;
        }
        .catalog-hero-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 26px rgba(30, 203, 179, 0.28);
        }
        .catalog-hero-art {
          display: grid;
          place-items: center;
          width: clamp(150px, 22vw, 250px);
          height: clamp(150px, 22vw, 250px);
          margin-right: clamp(0px, 5vw, 60px);
          color: #b8fff2;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(113, 232, 213, 0.17), rgba(113, 232, 213, 0.02) 65%, transparent 70%);
          border: 1px solid rgba(169, 255, 240, 0.19);
          box-shadow: inset 0 0 44px rgba(99, 238, 216, 0.1), 0 0 75px rgba(56, 208, 192, 0.1);
          animation: soft-float 5s ease-in-out infinite;
          flex: 0 0 auto;
        }
        .catalog-hero-art span {
          display: grid;
          place-items: center;
          width: 69%;
          height: 69%;
          border-radius: 50%;
          background: linear-gradient(145deg, rgba(179, 255, 244, 0.2), rgba(31, 179, 165, 0.08));
          border: 1px solid rgba(196, 255, 248, 0.25);
          font-size: clamp(4rem, 9vw, 7.5rem);
          line-height: 1;
          text-shadow: 0 0 30px rgba(123, 248, 225, 0.62);
        }
        .catalog-hero-art img {
          width: 72%;
          height: 72%;
          object-fit: contain;
          filter: drop-shadow(0 18px 25px rgba(0, 0, 0, 0.24));
        }
        .catalog-hero-controls {
          position: absolute;
          right: clamp(20px, 4vw, 52px);
          bottom: 22px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .catalog-hero-controls button {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          padding: 0;
          color: white;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          cursor: pointer;
        }
        .catalog-hero-controls button:hover,
        .catalog-hero-controls button[aria-current="true"] {
          color: #062839;
          background: #a5f3e7;
        }
        .catalog-hero-controls .catalog-hero-dot {
          width: 9px;
          height: 9px;
          border: 0;
          background: rgba(255, 255, 255, 0.55);
        }
        .catalog-hero-controls .catalog-hero-dot[aria-current="true"] {
          width: 23px;
          border-radius: 8px;
          background: #a5f3e7;
        }
        .catalog-layout {
          display: flex;
          gap: 26px;
          padding: 34px clamp(18px, 4vw, 54px);
          max-width: 1512px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .catalog-sidebar {
          width: 250px;
          min-width: 250px;
          background: rgba(255,255,255,0.93);
          padding: 22px;
          border-radius: 17px;
          border: 1px solid rgba(218, 230, 238, 0.9);
          box-shadow: 0 10px 28px rgba(15,43,68,0.055);
          height: fit-content;
          box-sizing: border-box;
          position: sticky;
          top: 90px;
        }
        .catalog-sidebar h3 {
          font-family: "Aptos Display", "Segoe UI", sans-serif;
          color: #17344d !important;
          font-size: 0.87rem !important;
          font-weight: 800;
          letter-spacing: -0.015em;
        }
        .catalog-sidebar select,
        .catalog-sidebar input,
        .catalog-search {
          min-height: 43px;
          padding: 10px 12px !important;
          border: 1px solid #dce6ed !important;
          border-radius: 10px !important;
          background: #f7fafc !important;
          color: #18344c;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .catalog-sidebar select:focus,
        .catalog-sidebar input:focus,
        .catalog-search:focus {
          border-color: #31bca9 !important;
          background: white !important;
          box-shadow: 0 0 0 4px rgba(18,184,166,0.12);
          outline: 0;
        }
        .catalog-sidebar li > div,
        .catalog-sidebar li[role="button"] {
          transition: background 160ms ease, color 160ms ease, transform 160ms ease;
        }
        .catalog-sidebar li > div:hover,
        .catalog-sidebar li[role="button"]:hover {
          transform: translateX(2px);
          background: #edf9f7 !important;
          color: #087d77 !important;
        }
        .catalog-search-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.88);
          border: 1px solid #dfe8ef;
          border-radius: 13px;
          box-shadow: 0 5px 18px rgba(15,43,68,0.045);
        }
        .catalog-search-icon {
          color: #688095;
          font-size: 1.2rem;
        }
        .catalog-search {
          width: 100%;
          margin: 0 !important;
          padding: 9px 0 !important;
          border: 0 !important;
          background: transparent !important;
          outline: 0 !important;
          box-shadow: none !important;
        }
        .catalog-results-heading {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin: 5px 1px 17px;
        }
        .catalog-results-heading h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.035em;
        }
        .catalog-results-heading span {
          color: #75899b;
          font-size: 0.84rem;
        }

        .catalog-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
          gap: 17px;
        }
        .catalog-product-card {
          position: relative;
          overflow: hidden;
          min-width: 0;
          background: #fff;
          border: 1px solid #e1e9ef;
          border-radius: 16px;
          box-shadow: 0 6px 18px rgba(15,43,68,0.045);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          animation: rise-in 500ms ease both;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }
        .catalog-product-card:hover {
          transform: translateY(-5px);
          border-color: rgba(18,184,166,0.5);
          box-shadow: 0 18px 38px rgba(15,43,68,0.12);
        }
        .catalog-product-visual {
          position: relative;
          display: grid;
          place-items: center;
          min-height: 185px;
          margin: 10px 10px 0;
          padding: 14px;
          overflow: hidden;
          border-radius: 12px;
          background:
            radial-gradient(circle at 50% 42%, rgba(18,184,166,0.1), transparent 55%),
            linear-gradient(145deg, #f6fafc, #eff5f8);
        }
        .catalog-product-visual::after {
          position: absolute;
          inset: auto 15% 0;
          height: 1px;
          content: "";
          background: linear-gradient(90deg, transparent, rgba(23,96,138,0.16), transparent);
        }
        .catalog-product-visual img {
          width: 100%;
          height: 160px;
          object-fit: contain;
          mix-blend-mode: multiply;
          transition: transform 350ms cubic-bezier(.2,.8,.2,1);
        }
        .catalog-product-card:hover .catalog-product-visual img {
          transform: scale(1.06);
        }
        .catalog-product-copy {
          padding: 14px 15px 8px;
        }
        .catalog-product-sku {
          color: #8295a5;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }
        .catalog-product-title {
          display: -webkit-box;
          overflow: hidden;
          min-height: 42px;
          margin: 7px 0;
          color: #17344d;
          font-family: "Aptos Display", "Segoe UI", sans-serif;
          font-size: 0.91rem;
          font-weight: 800;
          line-height: 1.4;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .catalog-product-meta {
          overflow: hidden;
          color: #73899a;
          font-size: 0.74rem;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .catalog-product-footer {
          padding: 10px 15px 15px;
        }
        .catalog-product-price {
          margin: 0 0 11px;
          color: #0d5474;
          font-family: "Aptos Display", "Segoe UI", sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .catalog-product-price span {
          color: #7b8e9f;
          font-family: "Aptos", "Segoe UI", sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0;
        }
        .catalog-add-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          min-height: 42px;
          padding: 10px;
          border: 0;
          border-radius: 10px;
          color: white;
          background: linear-gradient(135deg, #0d4768, #147da0);
          box-shadow: 0 6px 14px rgba(18, 91, 132, 0.15);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
        }
        .catalog-add-button:not(:disabled):hover {
          background: linear-gradient(135deg, #08796f, #13aa95);
          box-shadow: 0 9px 18px rgba(18, 164, 139, 0.22);
          transform: translateY(-1px);
        }
        .catalog-add-button:disabled {
          color: #6f7d87;
          background: #e4eaee;
          box-shadow: none;
          cursor: not-allowed;
        }
        .catalog-empty {
          padding: 48px 24px;
          color: #667d90;
          background: white;
          border: 1px dashed #cad8e2;
          border-radius: 16px;
          text-align: center;
        }
        .catalog-state {
          min-height: 55vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: #42647d;
          font-weight: 700;
        }
        .catalog-state-error {
          color: #a33e3e;
        }
        .catalog-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #d4e8e7;
          border-top-color: #12aa95;
          border-radius: 50%;
          animation: catalog-spin 700ms linear infinite;
        }
        @keyframes catalog-spin {
          to { transform: rotate(360deg); }
        }
        .catalog-pagination button {
          min-width: 90px;
          padding: 9px 14px;
          border: 1px solid #dbe5ec;
          border-radius: 9px;
          color: #173c57;
          background: white;
          font-weight: 700;
          cursor: pointer;
        }
        .catalog-pagination button:not(:disabled):hover {
          color: white;
          background: #0d5474;
          border-color: #0d5474;
        }
        .catalog-pagination button:disabled {
          color: #98a7b2;
          background: #f2f5f7;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .catalog-hero {
            margin: 0 14px;
            min-height: 290px;
            border-radius: 0 0 22px 22px;
          }
          .catalog-hero-art {
            margin-right: 0;
          }
          .catalog-layout {
            flex-direction: column;
            padding: 24px 16px;
          }
          .catalog-sidebar {
            width: 100%;
            min-width: 100%;
            position: static;
          }
          .catalog-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 13px;
          }
        }
        @media (max-width: 600px) {
          .catalog-hero {
            min-height: 280px;
            padding: 28px 22px;
            padding-bottom: 68px;
          }
          .catalog-hero-art {
            position: absolute;
            width: 130px;
            height: 130px;
            right: -24px;
            bottom: -28px;
            opacity: 0.48;
          }
          .catalog-hero-controls {
            right: 18px;
            bottom: 17px;
          }
          .catalog-hero-controls button {
            width: 32px;
            height: 32px;
          }
          .catalog-hero-copy {
            position: relative;
            z-index: 1;
          }
          .catalog-hero h1 {
            max-width: 440px;
            font-size: clamp(2rem, 10vw, 2.7rem);
          }
          .catalog-hero-copy p {
            max-width: 340px;
            font-size: 0.92rem;
          }
          .catalog-layout {
            padding: 19px 13px 32px;
            gap: 18px;
          }
          .catalog-sidebar {
            padding: 17px;
          }
          .catalog-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .catalog-product-visual {
            min-height: 135px;
            margin: 7px 7px 0;
            padding: 8px;
          }
          .catalog-product-visual img {
            height: 115px;
          }
          .catalog-product-copy {
            padding: 10px 10px 5px;
          }
          .catalog-product-title {
            min-height: 39px;
            font-size: 0.78rem;
          }
          .catalog-product-meta {
            font-size: 0.68rem;
          }
          .catalog-product-footer {
            padding: 8px 10px 10px;
          }
          .catalog-product-price {
            font-size: 0.98rem;
          }
          .catalog-add-button {
            min-height: 38px;
            font-size: 0.72rem;
          }
        }
      `}</style>

      <section
        className={`catalog-hero ${currentPromo.type === 'offer' ? 'catalog-hero--offer' : ''}`}
        aria-label="Promociones destacadas"
        aria-roledescription="carrusel"
        onMouseEnter={() => setIsPromoPaused(true)}
        onMouseLeave={() => setIsPromoPaused(false)}
        onFocusCapture={() => setIsPromoPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsPromoPaused(false);
        }}
      >
        <div className="catalog-hero-copy">
          <span className="catalog-kicker">{currentPromo.kicker}</span>
          <h1>{currentPromo.title}</h1>
          <p>{currentPromo.description}</p>
          <button
            type="button"
            className="catalog-hero-button"
            onClick={currentPromo.onAction}
          >
            {currentPromo.actionLabel} <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="catalog-hero-art" aria-hidden="true">
          {currentPromo.imageUrl ? <img src={currentPromo.imageUrl} alt="" /> : <span>❄</span>}
        </div>
        {promoSlides.length > 1 && (
          <div className="catalog-hero-controls" aria-label="Controles del carrusel">
            <button type="button" aria-label="Promoción anterior" onClick={() => showPromo(activePromoIndex - 1)}>‹</button>
            {promoSlides.map((slide, index) => (
              <button
                key={slide.type === 'offer' ? `offer-${index}` : slide.type}
                type="button"
                className="catalog-hero-dot"
                aria-label={`Mostrar promoción ${index + 1}`}
                aria-current={index === activePromoIndex}
                onClick={() => showPromo(index)}
              />
            ))}
            <button type="button" aria-label="Siguiente promoción" onClick={() => showPromo(activePromoIndex + 1)}>›</button>
          </div>
        )}
      </section>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h3 style={{ marginTop: 0, color: '#111827', fontSize: '15px', marginBottom: '10px' }}>Fabricantes / Marcas</h3>
          <select
            value={selectedBrand}
            onChange={(e) => applyFilter(setSelectedBrand, e.target.value === 'Todas' ? 'Todas' : Number(e.target.value) || e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
          >
            <option value="Todas">Todas las marcas</option>
            {marcas.map(marca => {
              const marcaId = marca.marcaId || marca.id;
              const marcaNombre = marca.nombre || marca.Nombre;
              return (
                <option key={marcaId} value={marcaId}>
                  {marcaNombre}
                </option>
              );
            })}
          </select>

          <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', marginBottom: '14px' }} />

          <h3 style={{ marginTop: 0, color: '#111827', fontSize: '15px', marginBottom: '10px' }}>Filtrar por Rango de Precio</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="number"
              placeholder="Mín ($)"
              value={precioMin}
              onChange={(e) => applyFilter(setPrecioMin, e.target.value)}
              style={{ width: '50%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
            />
            <input
              type="number"
              placeholder="Máx ($)"
              value={precioMax}
              onChange={(e) => applyFilter(setPrecioMax, e.target.value)}
              style={{ width: '50%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
            />
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', marginBottom: '14px' }} />

          <h3 style={{ marginTop: 0, color: '#111827', fontSize: '15px', marginBottom: '10px' }}>Categorías</h3>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedSubCategory(null);
                setCategoriaAbierta(null);
                setCurrentPage(1);
              }}
              style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: '6px', marginBottom: '4px', backgroundColor: selectedCategory === 'Todos' ? '#eff6ff' : 'transparent', color: selectedCategory === 'Todos' ? '#1d4ed8' : '#4b5563', fontWeight: selectedCategory === 'Todos' ? '600' : '400', fontSize: '13px' }}
            >
              Todos
            </li>

            {categorias.map(cat => {
              const catId = cat.categoriaId || cat.id;
              const catNombre = cat.nombre || cat.Nombre;
              const estaSeleccionada = selectedCategory === catId || selectedCategory === catNombre;
              const estaAbierta = categoriaAbierta === catId;
              const subsDeEstaCat = subcategorias.filter(sub => (sub.categoriaId || sub.categoryId) === catId);

              return (
                <li key={catId} style={{ marginBottom: '4px' }}>
                  <div
                    onClick={() => {
                      setSelectedCategory(catId);
                      setSelectedSubCategory(null);
                      setCategoriaAbierta(estaAbierta ? null : catId);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 10px', cursor: 'pointer', borderRadius: '6px',
                      backgroundColor: estaSeleccionada && selectedSubCategory === null ? '#eff6ff' : 'transparent',
                      color: estaSeleccionada ? '#1d4ed8' : '#4b5563',
                      fontWeight: estaSeleccionada ? '600' : '400',
                      fontSize: '13px'
                    }}
                  >
                    <span>{catNombre}</span>
                    {subsDeEstaCat.length > 0 && (
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {estaAbierta ? '▲' : '▼'}
                      </span>
                    )}
                  </div>

                  {subsDeEstaCat.length > 0 && estaAbierta && (
                    <ul style={{ listStyle: 'none', paddingLeft: '10px', margin: '2px 0 0 0', borderLeft: '2px solid #e5e7eb' }}>
                      {subsDeEstaCat.map(sub => {
                        const subId = sub.subCategoriaId || sub.id;
                        const subNombre = sub.nombre || sub.Nombre;
                        const subSeleccionada = selectedSubCategory === subId;

                        return (
                          <li
                            key={subId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory(catId);
                              setSelectedSubCategory(subId);
                              setCurrentPage(1);
                            }}
                            style={{
                              padding: '5px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
                              backgroundColor: subSeleccionada ? '#dbeafe' : 'transparent',
                              color: subSeleccionada ? '#1e40af' : '#6b7280',
                              fontWeight: subSeleccionada ? '600' : '400',
                              marginTop: '2px'
                            }}
                          >
                            - {subNombre}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div id="catalog-product-results" className="catalog-results-heading">
            <h2>Explora el catálogo</h2>
            <span>{filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}</span>
          </div>
          <div className="catalog-search-row">
            <span className="catalog-search-icon" aria-hidden="true">⌕</span>
          <input
            className="catalog-search"
            type="text"
            aria-label="Buscar equipos por nombre o SKU"
            placeholder="Busca por nombre, marca o SKU..."
            value={busqueda}
            onChange={(e) => applyFilter(setBusqueda, e.target.value)}
          />
          </div>

          <div className="catalog-products-grid">
            {currentProducts.map(product => {
              const idClave = product.productoId || product.id;
              const nombreProd = product.nombre || product.name || 'Equipo sin nombre';
              const skuProd = product.sku || product.Sku || product.codigoSku || product.codigo || '';
              const pricing = getCurrentProductPricing(product);
              const precioProd = pricing.price;
              const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
              const stockDisponible = product.stock ?? 0;
              const itemEnCarrito = cart.find(item => (item.productoId || item.id) === idClave);
              const sinStock = (itemEnCarrito?.cantidad || 0) >= stockDisponible;
              const marcaProdNombre = product.brand || product.marca?.nombre;

              return (
                <div
                  key={idClave}
                  onClick={() => navigate(`/producto/${idClave}`)}
                  className="catalog-product-card"
                >
                  <div>
                    <div className="catalog-product-visual">
                      <img
                        src={getImageUrl(rutaRaw)}
                        alt={nombreProd}
                      />
                    </div>

                    {skuProd && (
                      <div className="catalog-product-copy">
                      <div className="catalog-product-sku">
                        SKU: {skuProd}
                      </div>
                      <h3 className="catalog-product-title">{nombreProd}</h3>
                      <div className="catalog-product-meta">
                        {marcaProdNombre && marcaProdNombre !== 'N/A' && <span style={{ fontWeight: 'bold', color: '#147da0' }}>{marcaProdNombre} · </span>}
                        {product.category || product.categoria?.nombre}
                      </div>
                      </div>
                    )}
                    {!skuProd && (
                      <div className="catalog-product-copy">
                        <h3 className="catalog-product-title">{nombreProd}</h3>
                        <div className="catalog-product-meta">
                          {marcaProdNombre && marcaProdNombre !== 'N/A' && <span style={{ fontWeight: 'bold', color: '#147da0' }}>{marcaProdNombre} · </span>}
                          {product.category || product.categoria?.nombre}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="catalog-product-footer">
                    <p className="catalog-product-price">
                      {pricing.offerActive ? (
                        <>
                          <span style={{ display: 'block', color: '#8b9aa5', fontSize: '0.78rem', textDecoration: 'line-through' }}>
                            ${pricing.originalPrice.toLocaleString()} MXN
                          </span>
                          <strong style={{ color: '#c24135' }}>${precioProd.toLocaleString()} </strong>
                          <span style={{ color: '#c24135' }}>-{pricing.discountPercentage}% · MXN</span>
                        </>
                      ) : (
                        <>{`$${precioProd.toLocaleString()} `}<span>MXN</span></>
                      )}
                    </p>
                    <button
                      type="button"
                      disabled={sinStock}
                      onClick={(e) => handleAdd(product, e)}
                      className="catalog-add-button"
                    >
                      {sinStock ? 'Sin stock' : <><span aria-hidden="true">＋</span> Agregar al carrito</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="catalog-empty">
              <strong>No encontramos productos con esos filtros.</strong>
              <p style={{ marginTop: '7px' }}>Prueba otra búsqueda o ajusta los filtros para ver más opciones.</p>
            </div>
          )}

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="catalog-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', color: currentPage === 1 ? '#9ca3af' : '#374151' }}
              >
                Anterior
              </button>

              <span style={{ fontSize: '14px', color: '#4b5563', padding: '0 8px' }}>
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', color: currentPage === totalPages ? '#9ca3af' : '#374151' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}