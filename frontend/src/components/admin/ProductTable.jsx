import React, { useState } from 'react';
import api from "../../lib/api"; 

export default function ProductTable({ products = [], loading, error, onEdit, onDelete, onAddNew }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  if (loading) return <p style={{ color: '#3182ce', fontWeight: 'bold', padding: '20px' }}>Cargando equipos...</p>;
  if (error) return <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>⚠️ Error: {error}</div>;

  const BASE_URL = api.defaults?.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:5104';

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
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#718096' }}>
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
                const stockDisponible = item.stock ?? 0;

                return (
                  <tr key={idClave} style={{ borderBottom: '1px solid #edf2f7' }}>
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
                      ${precioProd.toLocaleString()} MXN
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