import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api'; 
import toast from 'react-hot-toast';

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

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://localhost:5104';

  const getImageUrl = (rutaRaw) => {
    if (!rutaRaw) return "https://placehold.co/280x180?text=Sin+Imagen";
    if (rutaRaw.startsWith('http')) return rutaRaw;
    const fileName = rutaRaw.replace(/^.*[\\\/]/, ''); 
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

  // Regresar a la página 1 al filtrar o buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, selectedCategory, selectedSubCategory, selectedBrand]);

  const handleAdd = (product, e) => {
    e.stopPropagation();
    const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
    const productoParaCarrito = {
      ...product,
      productoId: product.productoId || product.id,
      name: product.nombre || product.name,
      price: Number(product.precioPublico || product.price || 0),
      urlImagen: getImageUrl(rutaRaw)
    };

    onAddToCart(productoParaCarrito);
    toast.success(`${productoParaCarrito.name} agregado al carrito`);
  };

  const filteredProducts = products.filter(p => {
    const nombreProducto = (p.nombre || p.name || '').toLowerCase();
    const coincideBusqueda = nombreProducto.includes(busqueda.toLowerCase());

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

  // Cálculo de elementos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#3182ce', fontWeight: 'bold' }}>Cargando catálogo...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>⚠️ Error al conectar con el servidor: {error}</div>;

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <style>{`
        .catalog-layout {
          display: flex;
          gap: 24px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .catalog-sidebar {
          width: 260px;
          min-width: 260px;
          background-color: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          height: fit-content;
          box-sizing: border-box;
        }

        .catalog-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        @media (max-width: 900px) {
          .catalog-layout {
            flex-direction: column;
            padding: 16px;
          }
          .catalog-sidebar {
            width: 100%;
            min-width: 100%;
          }
          .catalog-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 10px;
          }
        }
      `}</style>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h3 style={{ marginTop: 0, color: '#111827', fontSize: '15px', marginBottom: '10px' }}>Fabricantes / Marcas</h3>
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value === 'Todas' ? 'Todas' : Number(e.target.value) || e.target.value)}
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

          <h3 style={{ marginTop: 0, color: '#111827', fontSize: '15px', marginBottom: '10px' }}>Categorías</h3>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li 
              onClick={() => { setSelectedCategory('Todos'); setSelectedSubCategory(null); setCategoriaAbierta(null); }}
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
          <input 
            type="text" 
            placeholder="🔍 Buscar equipos..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            style={{ width: '100%', padding: '12px 14px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
          />

          <div className="catalog-products-grid">
            {currentProducts.map(product => {
              const idClave = product.productoId || product.id;
              const nombreProd = product.nombre || product.name || 'Equipo sin nombre';
              const precioProd = Number(product.precioPublico || product.price || 0);
              const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
              const stockDisponible = product.stock ?? 0;
              const itemEnCarrito = cart.find(item => (item.productoId || item.id) === idClave);
              const sinStock = (itemEnCarrito?.cantidad || 0) >= stockDisponible;
              const marcaProdNombre = product.brand || product.marca?.nombre;

              return (
                <div 
                  key={idClave} 
                  onClick={() => navigate(`/producto/${idClave}`)}
                  style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid #edf2f7' }}
                >
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '8px', backgroundColor: '#ffffff', borderRadius: '6px', padding: '2px' }}>
                      <img 
                        src={getImageUrl(rutaRaw)} 
                        alt={nombreProd} 
                        style={{ width: '100%', height: '120px', objectFit: 'contain' }} 
                      />
                    </div>
                    <h4 style={{ margin: '6px 0 4px 0', fontSize: '14px', minHeight: '34px', maxHeight: '34px', overflow: 'hidden', color: '#1f2937', lineHeight: '1.2' }}>{nombreProd}</h4>
                    
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {marcaProdNombre && marcaProdNombre !== 'N/A' && <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{marcaProdNombre} | </span>}
                      {product.category || product.categoria?.nombre} 
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#1e40af', margin: '0 0 8px 0' }}>${precioProd.toLocaleString()} MXN</p>
                    <button 
                      type="button"
                      disabled={sinStock} 
                      onClick={(e) => handleAdd(product, e)} 
                      style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '6px', cursor: sinStock ? 'not-allowed' : 'pointer', backgroundColor: sinStock ? '#9ca3af' : '#2563eb', color: 'white', fontWeight: '600', fontSize: '13px' }}
                    >
                      {sinStock ? 'Sin stock' : 'Agregar al carrito'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
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