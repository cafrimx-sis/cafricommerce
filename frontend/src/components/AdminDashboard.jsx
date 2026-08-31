import React, { useState, useEffect, useCallback } from 'react';
import api from "../lib/api";
import AdminSidebar from './admin/AdminSidebar';
import ProductTable from './admin/ProductTable';
import ProductModal from './admin/ProductModal';
import UserTable from './admin/UserTable';
import Overview from './admin/Overview';
import CategoryManager from './admin/CategoryManager';
import BrandManager from './admin/BrandManager';
import CorteDeCaja from './CorteDeCaja';

export default function AdminDashboard({ user }) {
  const [adminView, setAdminView] = useState('overview');
  const [products, setProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioPublico, setPrecioPublico] = useState('');
  const [stock, setStock] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [subCategoriaId, setSubCategoriaId] = useState('');
  const [mainMarcaId, setMainMarcaId] = useState('');
  const [fotoArchivo, setFotoArchivo] = useState(null);

  const handleUnauthorized = useCallback((err) => {
    if (err.response && err.response.status === 401) {
      alert("Tu sesión ha expirado o no tienes permisos de administrador.");
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resProd, resCat, resSub, resMarcas] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
        api.get('/subcategorias'),
        api.get('/marcas')
      ]);
      
      setProducts(resProd.data || []);
      
      const categoriasMapeadas = (resCat.data || []).map(cat => ({
        id: cat.id ?? cat.categoriaId ?? cat.CategoriaId,
        nombre: cat.nombre ?? cat.Nombre ?? 'Sin nombre'
      }));
      setCategorias(categoriasMapeadas);

      const subCategoriasMapeadas = (resSub.data || []).map(sub => ({
        id: sub.id ?? sub.subCategoriaId ?? sub.SubCategoriaId,
        nombre: sub.nombre ?? sub.Nombre ?? 'Sin nombre',
        categoriaId: sub.categoriaId ?? sub.CategoriaId ?? sub.categoryId ?? sub.CategoryId
      }));
      setSubCategorias(subCategoriasMapeadas);

      const marcasMapeadas = (resMarcas.data || []).map(m => ({
        id: m.id ?? m.marcaId ?? m.MarcaId,
        nombre: m.nombre ?? m.Nombre ?? 'Sin nombre'
      }));
      setMarcas(marcasMapeadas);

    } catch (err) { 
      console.error("Error al cargar datos:", err); 
      handleUnauthorized(err);
    } finally { 
      setLoading(false); 
    }
  }, [handleUnauthorized]);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/resumen');
      setStats(res.data);
    } catch (err) { 
      console.error("Error al cargar stats:", err); 
      handleUnauthorized(err);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (adminView === 'products') cargarDatos();
    if (adminView === 'overview') cargarEstadisticas();
  }, [adminView, cargarDatos, cargarEstadisticas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const catId = parseInt(categoriaId, 10);
    const subCatId = parseInt(subCategoriaId, 10);
    const marcaIdNum = parseInt(mainMarcaId, 10);

    if (isNaN(catId) || catId <= 0) {
      alert("Por favor, selecciona una categoría válida.");
      return;
    }

    const formData = new FormData();
    formData.append("Sku", sku);
    formData.append("Name", nombre);
    formData.append("Price", parseFloat(precioPublico) || 0);
    formData.append("Stock", parseInt(stock, 10) || 0);
    formData.append("Description", descripcion || "");
    formData.append("CategoriaId", catId);
    if (!isNaN(subCatId) && subCatId > 0) formData.append("SubCategoriaId", subCatId);
    
    if (!isNaN(marcaIdNum) && marcaIdNum > 0) {
      formData.append("MainMarcaId", marcaIdNum);
    }
    
    if (fotoArchivo) formData.append("file", fotoArchivo);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditing) {
        await api.put(`/productos/${selectedId}`, formData, config);
      } else {
        await api.post('/productos', formData, config);
      }
      alert('Operación exitosa');
      cerrarYLimpiarModal();
      cargarDatos();
    } catch (err) {
      console.error("Error:", err.response?.data);
      handleUnauthorized(err);
      alert("Error al guardar.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await api.delete(`/productos/${id}`);
        cargarDatos();
      } catch (err) { 
        handleUnauthorized(err);
        alert("Error al eliminar"); 
      }
    }
  };

  const abrirEditar = async (item) => {
    await cargarDatos();
    setSelectedId(item.productoId || item.id);
    setSku(item.sku || item.SKU || '');
    setNombre(item.nombre || item.name || '');
    setDescripcion(item.description || item.descripcion || '');
    setPrecioPublico(item.precioPublico || item.price || '');
    setStock(item.stock ?? '');
    setCategoriaId(item.categoriaId || item.CategoriaId || '');
    setSubCategoriaId(item.subCategoriaId || item.SubCategoriaId || '');
    setMainMarcaId(item.mainMarcaId || item.MainMarcaId || '');
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const cerrarYLimpiarModal = () => {
    setIsModalOpen(false); setIsEditing(false); setSelectedId(null);
    setSku(''); setNombre(''); setDescripcion(''); setPrecioPublico(''); setStock(''); 
    setCategoriaId(''); setSubCategoriaId(''); setMainMarcaId(''); setFotoArchivo(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9', boxSizing: 'border-box' }}>
      <style>{`
        .admin-main-area {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
          min-width: 0;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .admin-main-area {
            padding: 16px;
            padding-bottom: 85px;
          }
        }
      `}</style>

      <AdminSidebar adminView={adminView} setAdminView={setAdminView} />
      
      <main className="admin-main-area">
        {adminView === 'overview' && <Overview stats={stats} />}
        {adminView === 'products' && (
          <ProductTable 
            products={products} 
            loading={loading} 
            onEdit={abrirEditar} 
            onDelete={handleDelete} 
            onAddNew={async () => { await cargarDatos(); setIsModalOpen(true); }} 
          />
        )}
        {adminView === 'categories' && <CategoryManager />} 
        {adminView === 'brands' && <BrandManager />}
        {adminView === 'users' && <UserTable />}
        {adminView === 'corte' && <CorteDeCaja />}
      </main>
      
      <ProductModal 
        isOpen={isModalOpen} 
        isEditing={isEditing} 
        onClose={cerrarYLimpiarModal} 
        onSubmit={handleSubmit} 
        sku={sku} setSku={setSku} 
        nombre={nombre} setNombre={setNombre} 
        descripcion={descripcion} setDescripcion={setDescripcion}
        precioPublico={precioPublico} setPrecioPublico={setPrecioPublico} 
        stock={stock} setStock={setStock} 
        categoriaId={categoriaId} setCategoriaId={setCategoriaId} 
        subCategoriaId={subCategoriaId} setSubCategoriaId={setSubCategoriaId}
        mainMarcaId={mainMarcaId} setMainMarcaId={setMainMarcaId}
        categorias={categorias} 
        subCategorias={subCategorias}
        marcas={marcas}
        setFotoArchivo={setFotoArchivo} 
      />
    </div>
  );
}