import React, { useState, useEffect } from 'react';
import AdminSidebar from './admin/AdminSidebar';
import ProductTable from './admin/ProductTable';
import ProductModal from './admin/ProductModal';
import UserTable from './admin/UserTable';

export default function AdminDashboard({ user }) {
  const [adminView, setAdminView] = useState('products');
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados de Búsqueda y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  // Estados del Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [precioPublico, setPrecioPublico] = useState('');
  const [stock, setStock] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [fotoArchivo, setFotoArchivo] = useState(null);

  const API_URL = 'https://localhost:7163/api/productos';

  // 🌟 FUNCIÓN AUXILIAR: Obtiene el token y lo limpia
  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem('token');
    const token = rawToken ? rawToken.replace(/['"]+/g, '') : null;
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const productosFiltrados = products.filter(item => {
    const nombreProd = (item.nombre || item.name || '').toLowerCase();
    const skuProd = (item.sku || item.SKU || '').toLowerCase();
    const buscaLower = busqueda.toLowerCase();
    const coincideBusqueda = nombreProd.includes(buscaLower) || skuProd.includes(buscaLower);
    const coincideCat = categoriaFiltro === 'Todas' || (item.categoriaId?.toString() === categoriaFiltro);
    return coincideBusqueda && coincideCat;
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        fetch(API_URL, { headers: getAuthHeaders() }),
        fetch('https://localhost:7163/api/categorias', { headers: getAuthHeaders() })
      ]);

      // Si el servidor responde 401, el token es inválido o expiró
      if (resProd.status === 401 || resCat.status === 401) {
        alert("Sesión expirada o sin permisos. Redirigiendo al login...");
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      setProducts(await resProd.json());
      setCategorias(await resCat.json());
    } catch (err) {
      console.error("Error al cargar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminView === 'products') cargarDatos();
  }, [adminView]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const bodyData = { 
      sku, 
      name: nombre, 
      price: parseFloat(precioPublico), 
      stock: parseInt(stock), 
      description: "Sin descripción", 
      categoriaId: parseInt(categoriaId), 
      mainMarcaId: 1 
    };
    if (isEditing) bodyData.id = selectedId;

    try {
      const res = await fetch(isEditing ? `${API_URL}/${selectedId}` : API_URL, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders(), // 🌟 APLICAMOS EL TOKEN AQUÍ
        body: JSON.stringify(bodyData)
      });

      if (res.status === 401) {
        alert("No tienes permiso para realizar esta acción.");
        return;
      }

      if (!res.ok) throw new Error("Error al procesar la solicitud.");
      
      alert('Operación exitosa');
      cerrarYLimpiarModal();
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const abrirEditar = (item) => {
    setSelectedId(item.productoId || item.id);
    setSku(item.sku || '');
    setNombre(item.nombre || item.name || '');
    setPrecioPublico(item.precioPublico || item.price || '');
    setStock(item.stock ?? '');
    setCategoriaId(item.categoriaId || '');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const cerrarYLimpiarModal = () => {
    setIsModalOpen(false); setIsEditing(false); setSelectedId(null);
    setSku(''); setNombre(''); setPrecioPublico(''); setStock(''); setCategoriaId('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <AdminSidebar adminView={adminView} setAdminView={setAdminView} />
      <main style={{ flex: 1, padding: '40px' }}>
        {adminView === 'products' && (
          <div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <input type="text" placeholder="🔍 Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 2, padding: '12px', borderRadius: '5px' }} />
              <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '5px' }}>
                <option value="Todas">Todas las Categorías</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
            </div>
            <ProductTable products={productosFiltrados} loading={loading} onEdit={abrirEditar} onAddNew={() => setIsModalOpen(true)} />
          </div>
        )}
      </main>
      <ProductModal 
        isOpen={isModalOpen} 
        isEditing={isEditing} 
        onClose={cerrarYLimpiarModal} 
        onSubmit={handleSubmit} 
        sku={sku} setSku={setSku} 
        nombre={nombre} setNombre={setNombre} 
        precioPublico={precioPublico} setPrecioPublico={setPrecioPublico} 
        stock={stock} setStock={setStock} 
        categoriaId={categoriaId} setCategoriaId={setCategoriaId} 
        categorias={categorias} 
        setFotoArchivo={setFotoArchivo} 
      />
    </div>
  );
}