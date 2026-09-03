import React, { useState, useEffect } from 'react';
import api from '../lib/api'; 
import toast from 'react-hot-toast';

export default function ProductCatalog({ onAddToCart, cart = [] }) {
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Guardamos el filtro actual: puede ser 'Todos', un ID/Nombre de categoría, o una subcategoría
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  
  // Control para expandir/contraer las categorías en el menú lateral
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);

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
    // Cargamos productos, categorías y subcategorías en paralelo
    Promise.all([
      api.get('/productos'),
      api.get('/categorias'),
      api.get('/subcategorias')
    ])
    .then(([resProd, resCat, resSub]) => { 
      setProducts(resProd.data);
      setCategorias(resCat.data);
      setSubcategorias(resSub.data);
      setLoading(false); 
    })
    .catch(err => { 
      setError(err.message); 
      setLoading(false); 
    });
  }, []);

  const handleAdd = (product) => {
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

  // Filtrado de productos por nombre, categoría y subcategoría
  const filteredProducts = products.filter(p => {
    const nombreProducto = (p.nombre || p.name || '').toLowerCase();
    const coincideBusqueda = nombreProducto.includes(busqueda.toLowerCase());

    // Identificadores de categoría y subcategoría del producto (según tu backend)
    const catIdProd = p.categoriaId || p.categoryId;
    const subCatIdProd = p.subCategoriaId || p.subCategoryId;
    const catNombreProd = (p.category || p.categoria?.nombre || '').toLowerCase();
    const subCatNombreProd = (p.subCategory || p.subCategoria?.nombre || '').toLowerCase();

    if (selectedCategory === 'Todos') {
      return coincideBusqueda;
    }

    if (selectedSubCategory !== null) {
      return coincideBusqueda && (subCatIdProd === selectedSubCategory || subCatNombreProd === String(selectedSubCategory).toLowerCase());
    }

    // Si solo hay categoría seleccionada
    const coincideCat = catIdProd === selectedCategory || catNombreProd === String(selectedCategory).toLowerCase();
    return coincideBusqueda && coincideCat;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#3182ce', fontWeight: 'bold' }}>Cargando catálogo...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>⚠️ Error al conectar con el servidor: {error}</div>;

  return (
    <div style={{ display: 'flex', gap: '30px', padding: '40px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Menú lateral con Categorías y Subcategorías */}
      <aside style={{ width: '280px', backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', height: 'fit-content' }}>
        <h3 style={{ marginTop: 0, color: '#111827', fontSize: '18px', marginBottom: '20px' }}>Categorías</h3>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {/* Opción Todos */}
          <li 
            onClick={() => { setSelectedCategory('Todos'); setSelectedSubCategory(null); setCategoriaAbierta(null); }}
            style={{ padding: '12px 15px', cursor: 'pointer', borderRadius: '10px', marginBottom: '8px', backgroundColor: selectedCategory === 'Todos' ? '#eff6ff' : 'transparent', color: selectedCategory === 'Todos' ? '#1d4ed8' : '#4b5563', fontWeight: selectedCategory === 'Todos' ? '600' : '400', transition: 'all 0.2s ease' }}
          >
            Todos
          </li>

          {/* Listado de Categorías Principales */}
          {categorias.map(cat => {
            const catId = cat.categoriaId || cat.id;
            const catNombre = cat.nombre || cat.Nombre;
            const estaSeleccionada = selectedCategory === catId || selectedCategory === catNombre;
            const estaAbierta = categoriaAbierta === catId;

            // Filtrar subcategorías asociadas a esta categoría
            const subsDeEstaCat = subcategorias.filter(sub => (sub.categoriaId || sub.categoryId) === catId);

            return (
              <li key={catId} style={{ marginBottom: '8px' }}>
                <div 
                  onClick={() => {
                    setSelectedCategory(catId);
                    setSelectedSubCategory(null);
                    setCategoriaAbierta(estaAbierta ? null : catId);
                  }}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 15px', cursor: 'pointer', borderRadius: '10px', 
                    backgroundColor: estaSeleccionada && selectedSubCategory === null ? '#eff6ff' : 'transparent', 
                    color: estaSeleccionada ? '#1d4ed8' : '#4b5563', 
                    fontWeight: estaSeleccionada ? '600' : '400', 
                    transition: 'all 0.2s ease' 
                  }}
                >
                  <span>{catNombre}</span>
                  {subsDeEstaCat.length > 0 && (
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {estaAbierta ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* Subcategorías desplegables */}
                {subsDeEstaCat.length > 0 && estaAbierta && (
                  <ul style={{ listStyle: 'none', paddingLeft: '15px', margin: '4px 0 0 0', borderLeft: '2px solid #e5e7eb' }}>
                    {subsDeEstaCat.map(sub => {
                      const subId = sub.subCategoriaId || sub.id;
                      const subNombre = sub.nombre || sub.Nombre;
                      const subSeleccionada = selectedSubCategory === subId;

                      return (
                        <li 
                          key={subId}
                          onClick={(e) => {
                            e.stopPropagation(); // Evita que se cierre el acordeón al hacer clic
                            setSelectedCategory(catId);
                            setSelectedSubCategory(subId);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '14px',
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

      {/* Grid de Productos */}
      <main style={{ flex: 1 }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar equipos..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          style={{ width: '100%', padding: '18px', marginBottom: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', outline: 'none' }} 
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
          {filteredProducts.map(product => {
            const idClave = product.productoId || product.id;
            const nombreProd = product.nombre || product.name || 'Equipo sin nombre';
            const precioProd = Number(product.precioPublico || product.price || 0);
            const rutaRaw = product.image || product.imageUrl || product.imagenUrl || '';
            const stockDisponible = product.stock ?? 0;
            const itemEnCarrito = cart.find(item => (item.productoId || item.id) === idClave);
            const sinStock = (itemEnCarrito?.cantidad || 0) >= stockDisponible;

            return (
              <div key={idClave} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <img src={getImageUrl(rutaRaw)} alt={nombreProd} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px' }} />
                  </div>
                  <h4 style={{ margin: '10px 0 5px 0', fontSize: '16px', height: '45px', overflow: 'hidden' }}>{nombreProd}</h4>
                  
                  {/* Visualización jerárquica de Categoría > Subcategoría en la tarjeta */}
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
                    {product.category || product.categoria?.nombre} 
                    {(product.subCategory || product.subCategoria?.nombre) && (product.subCategory !== 'N/A') ? ` > ${product.subCategory || product.subCategoria?.nombre}` : ''}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: '#1e40af', margin: '0 0 15px 0' }}>${precioProd.toLocaleString()} MXN</p>
                  <button 
                    disabled={sinStock} 
                    onClick={() => handleAdd(product)} 
                    style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '10px', cursor: sinStock ? 'not-allowed' : 'pointer', backgroundColor: sinStock ? '#9ca3af' : '#2563eb', color: 'white', fontWeight: '600' }}
                  >
                    {sinStock ? 'Sin stock' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}