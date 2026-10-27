import { useState, useEffect, useCallback } from 'react';
import api from "../lib/api";
import AdminSidebar from './admin/AdminSidebar';
import ProductTable from './admin/ProductTable';
import ProductModal from './admin/ProductModal';
import UserTable from './admin/UserTable';
import Overview from './admin/Overview';
import CategoryManager from './admin/CategoryManager';
import BrandManager from './admin/BrandManager';
import CorteDeCaja from './CorteDeCaja';
import AdminFacturacion from './AdminFacturacion'; // 📄 Importación del panel de facturación
import AdminOrders from './admin/AdminOrders';

export default function AdminDashboard() {
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
  const [descuentoOferta, setDescuentoOferta] = useState('0');
  const [ofertaInicio, setOfertaInicio] = useState('');
  const [ofertaFin, setOfertaFin] = useState('');
  const [esDestacado, setEsDestacado] = useState(false);
  const [destacadoInicio, setDestacadoInicio] = useState('');
  const [destacadoFin, setDestacadoFin] = useState('');
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
    const [resProd, resCat, resSub, resMarcas] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
        api.get('/subcategorias'),
        api.get('/marcas')
      ]);

      const categoriasMapeadas = (resCat.data || []).map(cat => ({
        id: cat.id ?? cat.categoriaId ?? cat.CategoriaId,
        nombre: cat.nombre ?? cat.Nombre ?? 'Sin nombre'
      }));
      const subCategoriasMapeadas = (resSub.data || []).map(sub => ({
        id: sub.id ?? sub.subCategoriaId ?? sub.SubCategoriaId,
        nombre: sub.nombre ?? sub.Nombre ?? 'Sin nombre',
        categoriaId: sub.categoriaId ?? sub.CategoriaId ?? sub.categoryId ?? sub.CategoryId
      }));
      const marcasMapeadas = (resMarcas.data || []).map(m => ({
        id: m.id ?? m.marcaId ?? m.MarcaId,
        nombre: m.nombre ?? m.Nombre ?? 'Sin nombre'
      }));

      return {
        products: resProd.data || [],
        categorias: categoriasMapeadas,
        subCategorias: subCategoriasMapeadas,
        marcas: marcasMapeadas
      };
  }, []);

  const aplicarDatos = useCallback((data) => {
    setProducts(data.products);
    setCategorias(data.categorias);
    setSubCategorias(data.subCategorias);
    setMarcas(data.marcas);
  }, []);

  const recargarDatos = useCallback(async () => {
    try {
      aplicarDatos(await cargarDatos());
    } catch (err) {
      console.error("Error al cargar datos:", err);
      handleUnauthorized(err);
    } finally {
      setLoading(false);
    }
  }, [aplicarDatos, cargarDatos, handleUnauthorized]);

  useEffect(() => {
    let active = true;

    if (adminView === 'products') {
      cargarDatos()
        .then((data) => {
          if (active) aplicarDatos(data);
        })
        .catch((err) => {
          if (!active) return;
          console.error("Error al cargar datos:", err);
          handleUnauthorized(err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    if (adminView === 'overview') {
      api.get('/dashboard/resumen')
        .then((response) => {
          if (active) setStats(response.data);
        })
        .catch((err) => {
          if (!active) return;
          console.error("Error al cargar stats:", err);
          handleUnauthorized(err);
        });
    }

    return () => {
      active = false;
    };
  }, [adminView, aplicarDatos, cargarDatos, handleUnauthorized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const catId = parseInt(categoriaId, 10);
    const subCatId = parseInt(subCategoriaId, 10);
    const marcaIdNum = parseInt(mainMarcaId, 10);

    if (isNaN(catId) || catId <= 0) {
      alert("Por favor, selecciona una categoría válida.");
      return;
    }

    if (Number(descuentoOferta) < 0 || Number(descuentoOferta) > 99.99) {
      alert("El descuento debe estar entre 0 y 99.99 por ciento.");
      return;
    }
    if (Number(descuentoOferta) > 0 &&
        (!ofertaInicio || !ofertaFin || new Date(ofertaFin) <= new Date(ofertaInicio))) {
      alert("Indica un periodo de oferta válido.");
      return;
    }
    if (esDestacado &&
        (!destacadoInicio || !destacadoFin || new Date(destacadoFin) <= new Date(destacadoInicio))) {
      alert("Indica un periodo válido para destacar el producto.");
      return;
    }

    const formData = new FormData();
    formData.append("Sku", sku);
    formData.append("Name", nombre);
    formData.append("Price", parseFloat(precioPublico) || 0);
    formData.append("DescuentoPorcentaje", parseFloat(descuentoOferta) || 0);
    if (Number(descuentoOferta) > 0) {
      formData.append("OfertaInicioUtc", new Date(ofertaInicio).toISOString());
      formData.append("OfertaFinUtc", new Date(ofertaFin).toISOString());
    }
    formData.append("EsDestacado", String(esDestacado));
    if (esDestacado) {
      formData.append("DestacadoInicioUtc", new Date(destacadoInicio).toISOString());
      formData.append("DestacadoFinUtc", new Date(destacadoFin).toISOString());
    }
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
      await recargarDatos();
    } catch (err) {
      console.error("Error:", err.response?.data);
      handleUnauthorized(err);
      alert(err.response?.data?.mensaje || "Error al guardar.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try {
        await api.delete(`/productos/${id}`);
        await recargarDatos();
      } catch (err) { 
        handleUnauthorized(err);
        alert("Error al eliminar"); 
      }
    }
  };

  const handleApplyOffer = async (productIds, discountPercentage, offerStartUtc, offerEndUtc) => {
    try {
      const response = await api.put('/productos/oferta', {
        productIds,
        discountPercentage,
        offerStartUtc,
        offerEndUtc
      });
      await recargarDatos();
      alert(`${response.data.productosActualizados} producto(s) actualizado(s).`);
      return true;
    } catch (err) {
      handleUnauthorized(err);
      alert(err.response?.data?.mensaje || "No se pudo actualizar la oferta.");
      return false;
    }
  };

  const abrirEditar = async (item) => {
    await recargarDatos();
    setSelectedId(item.productoId || item.id);
    setSku(item.sku || item.SKU || '');
    setNombre(item.nombre || item.name || '');
    setDescripcion(item.description || item.descripcion || '');
    setPrecioPublico(item.originalPrice ?? item.precioPublico ?? item.price ?? '');
    setDescuentoOferta(String(item.discountPercentage ?? 0));
    setOfertaInicio(toDateTimeLocal(item.offerStartUtc));
    setOfertaFin(toDateTimeLocal(item.offerEndUtc));
    setEsDestacado(Boolean(item.isFeatured));
    setDestacadoInicio(toDateTimeLocal(item.featuredStartUtc));
    setDestacadoFin(toDateTimeLocal(item.featuredEndUtc));
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
    setDescuentoOferta('0'); setOfertaInicio(''); setOfertaFin('');
    setEsDestacado(false); setDestacadoInicio(''); setDestacadoFin('');
    setCategoriaId(''); setSubCategoriaId(''); setMainMarcaId(''); setFotoArchivo(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--canvas)', boxSizing: 'border-box' }}>
      <style>{`
        .admin-main-area {
          flex: 1;
          padding: clamp(20px, 3vw, 36px);
          overflow-y: auto;
          min-width: 0;
          color: var(--ink);
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .admin-main-area {
            padding: 16px;
            padding-bottom: 85px;
            margin-top: 55px; /* 👈 Espacio reservado para la barra superior móvil del admin */
          }
        }
      `}</style>

      <AdminSidebar
        adminView={adminView}
        setAdminView={(view) => {
          if (view === 'products') setLoading(true);
          setAdminView(view);
        }}
      />
      
      <main className="admin-main-area">
        {adminView === 'overview' && <Overview stats={stats} />}
        {adminView === 'orders' && <AdminOrders />}
        {adminView === 'products' && (
          <ProductTable 
            products={products} 
            loading={loading} 
            onEdit={abrirEditar} 
            onDelete={handleDelete} 
            onAddNew={async () => { setLoading(true); await recargarDatos(); setIsModalOpen(true); }}
            onApplyOffer={handleApplyOffer}
          />
        )}
        {adminView === 'categories' && <CategoryManager />} 
        {adminView === 'brands' && <BrandManager />}
        {adminView === 'users' && <UserTable />}
        {adminView === 'corte' && <CorteDeCaja />}
        {adminView === 'facturacion' && <AdminFacturacion />}
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
        descuentoOferta={descuentoOferta} setDescuentoOferta={setDescuentoOferta}
        ofertaInicio={ofertaInicio} setOfertaInicio={setOfertaInicio}
        ofertaFin={ofertaFin} setOfertaFin={setOfertaFin}
        esDestacado={esDestacado} setEsDestacado={setEsDestacado}
        destacadoInicio={destacadoInicio} setDestacadoInicio={setDestacadoInicio}
        destacadoFin={destacadoFin} setDestacadoFin={setDestacadoFin}
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

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}