import { useState } from 'react';
import api from "../../lib/api"; 

const MAX_BULK_OFFER_PRODUCTS = 500;

export default function ProductTable({ products = [], loading, error, onEdit, onDelete, onAddNew, onApplyOffer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [offerDiscount, setOfferDiscount] = useState('');
  const [offerStart, setOfferStart] = useState('');
  const [offerEnd, setOfferEnd] = useState('');

  if (loading) return <p style={{ color: '#3182ce', fontWeight: 'bold', padding: '20px' }}>Cargando equipos...</p>;
  if (error) return <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>⚠️ Error: {error}</div>;

  const BASE_URL = api.defaults.baseURL.replace(/\/api\/?$/, '');

  const categories = [...new Set(products.map(p => p.category || p.Categoria?.nombre || 'General'))];
  const subCategories = [...new Set(products.map(p => p.subCategory || p.SubCategoria?.nombre || 'N/A'))];
  const brands = [...new Set(products.map(p => p.brand || p.Marca?.nombre || 'N/A'))];

  const filteredProducts = products.filter(item => {
    const nombreProd = item.nombre || item.name || '';
    const skuProd = item.sku || '';
    const catProd = item.category || item.Categoria?.nombre || 'General';
    const subCatProd = item.subCategory || item.SubCategoria?.nombre || 'N/A';
    const brandProd = item.brand || item.Marca?.nombre || 'N/A';
    const stock = item.stock ?? 0;

    const matchesSearch = nombreProd.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          skuProd.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || catProd === selectedCategory;
    const matchesSubCategory = selectedSubCategory === 'ALL' || subCatProd === selectedSubCategory;
    const matchesBrand = selectedBrand === 'ALL' || brandProd === selectedBrand;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = stock > 0;
    if (stockFilter === 'OUT_OF_STOCK') matchesStock = stock <= 0;

    return matchesSearch && matchesCategory && matchesSubCategory && matchesBrand && matchesStock;
  });
  const filteredIds = filteredProducts.map(item => item.productoId || item.id || item.ProductoId);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.includes(id));

  const toggleProductSelection = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(current => current.filter(selectedId => selectedId !== id));
      return;
    }
    if (selectedProductIds.length >= MAX_BULK_OFFER_PRODUCTS) {
      window.alert(`Selecciona como máximo ${MAX_BULK_OFFER_PRODUCTS} productos por oferta.`);
      return;
    }
    setSelectedProductIds(current => [...current, id]);
  };

  const toggleFilteredSelection = () => {
    const nextSelection = allFilteredSelected
      ? selectedProductIds.filter(id => !filteredIds.includes(id))
      : [...new Set([...selectedProductIds, ...filteredIds])];
    if (nextSelection.length > MAX_BULK_OFFER_PRODUCTS) {
      window.alert(`Selecciona como máximo ${MAX_BULK_OFFER_PRODUCTS} productos por oferta. Usa los filtros para dividir la selección.`);
      return;
    }
    setSelectedProductIds(nextSelection);
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    const discount = Number(offerDiscount);
    if (discount > 0 && (!offerStart || !offerEnd || new Date(offerEnd) <= new Date(offerStart))) {
      window.alert('Indica un periodo de oferta válido.');
      return;
    }
    try {
      const updated = await onApplyOffer(
        selectedProductIds,
        discount,
        discount > 0 ? new Date(offerStart).toISOString() : null,
        discount > 0 ? new Date(offerEnd).toISOString() : null
      );
      if (updated) {
        setSelectedProductIds([]);
        setOfferDiscount('');
        setOfferStart('');
        setOfferEnd('');
      }
    } catch (error) {
      window.alert(error.message || 'No se pudo actualizar la oferta.');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`
        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        .product-header h2 {
          color: #2d3748;
          margin: 0;
          font-size: 1.4rem;
        }

        .btn-add-product {
          padding: 10px 18px;
          background-color: #38a169;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          white-space: nowrap;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .filter-container {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          background-color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .filter-search {
          flex: 1 1 240px;
        }

        .filter-select {
          flex: 1 1 150px;
        }

        .filter-control {
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e0;
          outline: none;
          background-color: white;
          font-size: 14px;
          box-sizing: border-box;
        }

        .table-wrapper {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #edf2f7;
        }

        .product-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
          text-align: left;
        }

        @media (max-width: 650px) {
          .product-header {
            flex-direction: column;
            align-items: stretch;
          }

          .product-header h2 {
            font-size: 1.25rem;
            text-align: center;
          }

          .btn-add-product {
            width: 100%;
            padding: 12px;
            font-size: 1rem;
          }

          .filter-container {
            padding: 12px;
            gap: 10px;
          }

          .filter-select, .filter-search {
            flex: 1 1 100%;
          }
        }
      `}</style>

      <div className="product-header">
        <h2>Gestión de Inventario (CAFRI)</h2>
        <button 
          type="button"
          className="btn-add-product"
          onClick={onAddNew}
        >
          ➕ Agregar Nuevo Equipo
        </button>
      </div>

      {selectedProductIds.length > 0 && (
        <form onSubmit={submitOffer} style={{ display: 'flex', alignItems: 'end', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', padding: '16px', background: '#f0f9ff', border: '1px solid #bee3f8', borderRadius: '8px' }}>
          <strong style={{ color: '#2c5282', alignSelf: 'center' }}>{selectedProductIds.length} producto(s) seleccionado(s)</strong>
          <label style={{ display: 'grid', gap: '5px', color: '#4a5568', fontSize: '13px' }}>
            Descuento (%)
            <input type="number" min="0" max="99.99" step="0.01" required value={offerDiscount} onChange={(e) => setOfferDiscount(e.target.value)} style={{ padding: '9px', border: '1px solid #cbd5e0', borderRadius: '5px' }} />
          </label>
          <label style={{ display: 'grid', gap: '5px', color: '#4a5568', fontSize: '13px' }}>
            Inicia
            <input type="datetime-local" required={Number(offerDiscount) > 0} disabled={Number(offerDiscount) <= 0} value={offerStart} onChange={(e) => setOfferStart(e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e0', borderRadius: '5px' }} />
          </label>
          <label style={{ display: 'grid', gap: '5px', color: '#4a5568', fontSize: '13px' }}>
            Termina
            <input type="datetime-local" required={Number(offerDiscount) > 0} disabled={Number(offerDiscount) <= 0} value={offerEnd} onChange={(e) => setOfferEnd(e.target.value)} style={{ padding: '8px', border: '1px solid #cbd5e0', borderRadius: '5px' }} />
          </label>
          <button type="submit" style={{ padding: '10px 16px', border: 0, borderRadius: '6px', color: 'white', background: '#167d72', fontWeight: 'bold', cursor: 'pointer' }}>
            {Number(offerDiscount) > 0 ? 'Aplicar oferta' : 'Quitar oferta'}
          </button>
          <button type="button" onClick={() => setSelectedProductIds([])} style={{ padding: '10px 14px', border: '1px solid #cbd5e0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancelar</button>
          <small style={{ width: '100%', color: '#64748b' }}>Puedes seleccionar hasta {MAX_BULK_OFFER_PRODUCTS} productos por operación. Usa 0% para quitar la oferta.</small>
        </form>
      )}

      <div className="filter-container">
        <div className="filter-search">
          <input 
            type="text" 
            placeholder="🔍 Buscar nombre o SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-control"
          />
        </div>

        <div className="filter-select">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-control"
          >
            <option value="ALL">Todas Categorías</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select 
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="filter-control"
          >
            <option value="ALL">Todas Subcategorías</option>
            {subCategories.map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="filter-control"
          >
            <option value="ALL">Todas las Marcas</option>
            {brands.map((brand, idx) => (
              <option key={idx} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="filter-control"
          >
            <option value="ALL">Todo Stock</option>
            <option value="IN_STOCK">Con Stock</option>
            <option value="OUT_OF_STOCK">Agotados</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr style={{ backgroundColor: '#ebf8ff', color: '#2c5282' }}>
              <th style={{ padding: '14px', width: '44px', textAlign: 'center' }}>
                <input type="checkbox" aria-label="Seleccionar productos filtrados" checked={allFilteredSelected} onChange={toggleFilteredSelection} />
              </th>
              <th style={{ padding: '14px', width: '70px', textAlign: 'center' }}>Foto</th>
              <th style={{ padding: '14px', width: '130px' }}>SKU</th>
              <th style={{ padding: '14px', minWidth: '220px' }}>Producto / Detalle</th>
              <th style={{ padding: '14px', width: '120px' }}>Precio</th>
              <th style={{ padding: '14px', width: '90px' }}>Stock</th>
              <th style={{ padding: '14px', width: '140px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#718096' }}>
                  No se encontraron equipos que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredProducts.map((item) => {
                const idClave = item.productoId || item.id || item.ProductoId;
                
                // Validación estricta para evitar URLs rotas si el campo está vacío o null
                let rutaImg = item.image || item.imageUrl || item.rutaImagen || item.imagenUrl;
                if (!rutaImg || rutaImg.trim() === "" || rutaImg.toLowerCase() === "null") {
                  rutaImg = null;
                }

                const nombreProd = item.nombre || item.name || 'Equipo sin nombre';
                const descProd = item.descripcion || item.description || '';
                const marcaProd = item.brand || item.Marca?.nombre || '';
                const precioProd = Number(item.precioPublico || item.price || 0);
                const precioLista = Number(item.originalPrice ?? item.precioPublico ?? item.price ?? 0);
                const idSeleccionado = item.productoId || item.id || item.ProductoId;
                const stockDisponible = item.stock ?? 0;

                return (
                  <tr key={idClave} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input type="checkbox" aria-label={`Seleccionar ${nombreProd}`} checked={selectedProductIds.includes(idSeleccionado)} onChange={() => toggleProductSelection(idSeleccionado)} />
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <img 
                        src={
                          rutaImg 
                            ? (rutaImg.startsWith('http') ? rutaImg : `${BASE_URL}${rutaImg.startsWith('/') ? '' : '/productos/'}${rutaImg}`) 
                            : "https://placehold.co/45x45?text=📷"
                        } 
                        alt={nombreProd} 
                        style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#f7fafc' }}
                      />
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#4a5568' }}>
                      {item.sku || 'N/A'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '0.95rem' }}>{nombreProd}</div>
                      {descProd && (
                        <div style={{ fontSize: '0.8rem', color: '#718096', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {descProd}
                        </div>
                      )}
                      {marcaProd && <div style={{ fontSize: '0.78rem', color: '#a0aec0', marginTop: '2px' }}>Marca: {marcaProd}</div>}
                    </td>
                    <td style={{ padding: '14px', fontWeight: '500', color: '#2d3748', whiteSpace: 'nowrap' }}>
                      {item.offerActive ? (
                        <><span style={{ display: 'block', color: '#8293a0', textDecoration: 'line-through' }}>${precioLista.toLocaleString()} MXN</span><strong style={{ color: '#c24135' }}>${precioProd.toLocaleString()} MXN</strong><small style={{ display: 'block', color: '#c24135' }}>-{item.discountPercentage}% oferta</small></>
                      ) : `$${precioLista.toLocaleString()} MXN`}
                    </td>
                    <td style={{ padding: '14px', color: stockDisponible > 0 ? '#38a169' : '#e53e3e', fontWeight: 'bold' }}>
                      {stockDisponible}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => onEdit(item)} 
                        style={{ marginRight: '8px', color: '#3182ce', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '4px' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        type="button"
                        onClick={() => onDelete(idClave)} 
                        style={{ color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', padding: '4px' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}