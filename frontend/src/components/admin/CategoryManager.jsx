import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";

export default function CategoryManager() {
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [resCat, resSub] = await Promise.all([
        api.get("/categorias"),
        api.get("/subcategorias")
      ]);
      setCategorias(resCat.data || []);
      setSubCategorias(resSub.data || []);

      if (resCat.data && resCat.data.length > 0) {
        const firstCategoryId = resCat.data[0].categoriaId || resCat.data[0].CategoriaId;
        setCategoriaSeleccionadaId((currentId) => currentId || firstCategoryId);
      }
    } catch (err) {
      console.error("Error al cargar datos", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/categorias"),
      api.get("/subcategorias")
    ])
      .then(([resCat, resSub]) => {
        if (!active) return;
        setCategorias(resCat.data || []);
        setSubCategorias(resSub.data || []);
        const firstCategoryId = resCat.data?.[0]?.categoriaId || resCat.data?.[0]?.CategoriaId;
        if (firstCategoryId) {
          setCategoriaSeleccionadaId((currentId) => currentId || firstCategoryId);
        }
      })
      .catch((err) => {
        if (active) console.error("Error al cargar datos", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateCategoria = async () => {
    const nombre = prompt("Nombre de la nueva categoría principal:");
    if (!nombre || !nombre.trim()) return;
    try {
      const res = await api.post("/categorias", { 
        Nombre: nombre.trim(),
        nombre: nombre.trim() 
      });
      await cargarDatos();
      const nuevoId = res.data.categoriaId || res.data.CategoriaId;
      if (nuevoId) setCategoriaSeleccionadaId(nuevoId);
    } catch (err) { 
      console.error("Error al crear categoría:", err.response?.data || err);
      alert("Error al crear categoría"); 
    }
  };

  const handleEditCategoria = async (cat) => {
    const catId = cat.categoriaId || cat.CategoriaId;
    const catNombreActual = cat.nombre || cat.Nombre;

    const nuevoNombre = prompt("Editar nombre de categoría:", catNombreActual);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === catNombreActual) return;
    
    try {
      await api.post(`/categorias/update/${catId}`, { 
        Nombre: nuevoNombre.trim(),
        nombre: nuevoNombre.trim() 
      });
      cargarDatos();
    } catch (err) { 
      console.error("Error al editar categoría:", err.response?.data || err);
      alert("Error al editar categoría"); 
    }
  };

  const handleDeleteCategoria = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta categoría y sus dependencias?")) return;
    try {
      await api.post(`/categorias/delete/${id}`);
      cargarDatos();
      if (categoriaSeleccionadaId === id) {
        setCategoriaSeleccionadaId(categorias.length > 1 ? (categorias[0].categoriaId || categorias[0].CategoriaId) : null);
      }
    } catch (err) { 
      console.error("Error al eliminar categoría:", err.response?.data || err);
      alert("Error al eliminar categoría"); 
    }
  };

  const handleCreateSubCategoriaParaActiva = async () => {
    if (!categoriaSeleccionadaId) {
      alert("Selecciona una categoría principal primero.");
      return;
    }

    const nombre = prompt("Nombre de la nueva subcategoría:");
    if (!nombre || !nombre.trim()) return;

    try {
      await api.post("/subcategorias", { 
        Nombre: nombre.trim(), 
        nombre: nombre.trim(),
        CategoriaId: categoriaSeleccionadaId,
        categoriaId: categoriaSeleccionadaId
      });
      cargarDatos();
    } catch (err) { 
      console.error("Error al crear subcategoría detallado:", err.response?.data || err);
      alert("Error al crear subcategoría. Revisa la consola."); 
    }
  };

  const handleEditSubCategoria = async (sub) => {
    const subId = sub.subCategoriaId || sub.SubCategoriaId;
    const parentId = sub.categoriaId || sub.CategoriaId;
    const subNombreActual = sub.nombre || sub.Nombre;

    const nuevoNombre = prompt("Editar nombre de subcategoría:", subNombreActual);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === subNombreActual) return;
    
    try {
      await api.post(`/subcategorias/update/${subId}`, { 
        Nombre: nuevoNombre.trim(),
        nombre: nuevoNombre.trim(),
        CategoriaId: parentId,
        categoriaId: parentId
      });
      cargarDatos();
    } catch (err) { 
      console.error("Error al editar subcategoría:", err.response?.data || err);
      alert("Error al editar subcategoría"); 
    }
  };

  const handleDeleteSubCategoria = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta subcategoría?")) return;
    try {
      await api.post(`/subcategorias/delete/${id}`);
      cargarDatos();
    } catch (err) { 
      console.error("Error al eliminar subcategoría:", err.response?.data || err);
      alert("Error al eliminar subcategoría"); 
    }
  };

  const categoriaActiva = categorias.find(
    (c) => (c.categoriaId || c.CategoriaId) === categoriaSeleccionadaId
  );

  const subsDeCategoriaActiva = subCategorias.filter(
    (sub) => (sub.categoriaId || sub.CategoriaId) === categoriaSeleccionadaId
  );

  return (
    <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif", boxSizing: "border-box" }}>
      <style>{`
        .cat-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        .cat-explorer-container {
          display: flex;
          flex-direction: row;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          min-height: 480px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .cat-sidebar-panel {
          width: 280px;
          min-width: 280px;
          background-color: #2d3748;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .cat-main-panel {
          flex: 1;
          padding: 28px;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .cat-header-actions,
        .subcat-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .cat-header-actions {
          border-bottom: 2px solid #edf2f7;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .subcat-header-actions {
          margin-bottom: 15px;
        }

        .subcat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }

        .btn-action-touch {
          padding: 6px 10px;
          min-height: 32px;
          min-width: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        @media (max-width: 820px) {
          .cat-top-header {
            flex-direction: column;
            align-items: stretch;
          }

          .cat-top-header button {
            width: 100%;
          }

          .cat-explorer-container {
            flex-direction: column;
          }

          .cat-sidebar-panel {
            width: 100%;
            min-width: 100%;
            max-height: 180px;
          }

          .cat-sidebar-list {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 8px;
            gap: 8px;
          }

          .cat-sidebar-item {
            flex-shrink: 0;
            border-radius: 6px !important;
            border-left: none !important;
            padding: 10px 14px !important;
            white-space: nowrap;
          }

          .cat-sidebar-item .chevron {
            display: none;
          }

          .cat-main-panel {
            padding: 18px;
          }

          .cat-header-actions,
          .subcat-header-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .cat-header-actions > div:last-child {
            display: flex;
            gap: 8px;
          }

          .cat-header-actions button,
          .subcat-header-actions button {
            width: 100%;
            padding: 10px;
          }

          .subcat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Cabecera Superior */}
      <div className="cat-top-header">
        <h2 style={{ color: "#2d3748", margin: 0, fontSize: "1.4rem" }}>🏷️ Explorador de Catálogo</h2>
        <button 
          type="button"
          onClick={handleCreateCategoria}
          style={{ padding: "10px 18px", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
        >
          + Nueva Categoría Principal
        </button>
      </div>

      {/* Contenedor Explorer */}
      <div className="cat-explorer-container">
        
        {/* Panel lateral con scroll horizontal en móvil */}
        <div className="cat-sidebar-panel">
          <div style={{ padding: "12px 16px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#a0aec0", borderBottom: "1px solid #4a5568", fontWeight: "bold" }}>
            Categorías
          </div>
          
          <div className="cat-sidebar-list" style={{ overflowY: "auto", flex: 1 }}>
            {categorias.length === 0 ? (
              <p style={{ padding: "16px", color: "#a0aec0", fontSize: "0.9rem", margin: 0 }}>No hay categorías.</p>
            ) : (
              categorias.map((cat) => {
                const catId = cat.categoriaId || cat.CategoriaId;
                const catNombre = cat.nombre || cat.Nombre;
                const isSelected = catId === categoriaSeleccionadaId;

                return (
                  <div
                    key={catId}
                    className="cat-sidebar-item"
                    onClick={() => setCategoriaSeleccionadaId(catId)}
                    style={{
                      padding: "14px 18px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#3182ce" : "transparent",
                      color: isSelected ? "#ffffff" : "#e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: isSelected ? "4px solid #63b3ed" : "4px solid transparent",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", fontWeight: isSelected ? "600" : "400" }}>{catNombre}</span>
                    <span className="chevron" style={{ fontSize: "0.8rem", color: isSelected ? "#ebf8ff" : "#718096" }}>›</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel principal */}
        <div className="cat-main-panel">
          {categoriaActiva ? (
            <>
              <div className="cat-header-actions">
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.35rem", color: "#1a202c", wordBreak: "break-word" }}>
                    {categoriaActiva.nombre || categoriaActiva.Nombre}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>ID: {categoriaSeleccionadaId}</span>
                </div>
                
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button 
                    type="button"
                    onClick={() => handleEditCategoria(categoriaActiva)}
                    style={{ fontSize: "0.85rem", padding: "8px 14px", backgroundColor: "#edf2f7", color: "#2d3748", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Editar
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteCategoria(categoriaSeleccionadaId)}
                    style={{ fontSize: "0.85rem", padding: "8px 14px", backgroundColor: "#fed7d7", color: "#9b2c2c", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="subcat-header-actions">
                <h4 style={{ margin: 0, color: "#4a5568", fontSize: "1.05rem" }}>Subcategorías</h4>
                <button 
                  type="button"
                  onClick={handleCreateSubCategoriaParaActiva}
                  style={{ padding: "8px 14px", backgroundColor: "#48bb78", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  + Agregar Subcategoría
                </button>
              </div>

              {subsDeCategoriaActiva.length === 0 ? (
                <div style={{ padding: "30px 15px", textAlign: "center", backgroundColor: "#f7fafc", borderRadius: "8px", border: "1px dashed #cbd5e0" }}>
                  <p style={{ color: "#a0aec0", margin: "0 0 6px 0" }}>Esta categoría aún no cuenta con subcategorías.</p>
                  <span style={{ fontSize: "0.85rem", color: "#718096" }}>Pulsa el botón verde para registrar una.</span>
                </div>
              ) : (
                <div className="subcat-grid">
                  {subsDeCategoriaActiva.map((sub) => {
                    const subId = sub.subCategoriaId || sub.SubCategoriaId;
                    const subNombre = sub.nombre || sub.Nombre;

                    return (
                      <div 
                        key={subId} 
                        style={{ 
                          backgroundColor: "#f8fafc", 
                          padding: "12px 14px", 
                          borderRadius: "6px", 
                          border: "1px solid #e2e8f0", 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <span style={{ fontSize: "0.9rem", color: "#2d3748", fontWeight: "500", wordBreak: "break-word", flex: 1 }}>
                          {subNombre}
                        </span>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button 
                            type="button"
                            onClick={() => handleEditSubCategoria(sub)}
                            className="btn-action-touch"
                            style={{ backgroundColor: "#edf2f7" }}
                            title="Editar subcategoría"
                            aria-label={`Editar ${subNombre}`}
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteSubCategoria(subId)}
                            className="btn-action-touch"
                            style={{ backgroundColor: "#fed7d7" }}
                            title="Eliminar subcategoría"
                            aria-label={`Eliminar ${subNombre}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "150px", color: "#a0aec0", textAlign: "center" }}>
              <p>Selecciona una categoría para gestionar sus subcategorías.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}