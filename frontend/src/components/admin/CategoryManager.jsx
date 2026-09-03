import React, { useState, useEffect } from "react";
import api from "../../lib/api";

export default function CategoryManager() {
  const [categorias, setCategorias] = useState([]);
  const [subCategorias, setSubCategorias] = useState([]);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resCat, resSub] = await Promise.all([
        api.get("/categorias"),
        api.get("/subcategorias")
      ]);
      setCategorias(resCat.data);
      setSubCategorias(resSub.data);

      // Seleccionar la primera categoría por defecto si existe y no hay una seleccionada
      if (resCat.data.length > 0 && !categoriaSeleccionadaId) {
        setCategoriaSeleccionadaId(resCat.data[0].categoriaId || resCat.data[0].CategoriaId);
      }
    } catch (err) {
      console.error("Error al cargar datos", err);
    }
  };

  // --- CRUD CATEGORÍAS PRINCIPALES ---
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

  // --- CRUD SUBCATEGORÍAS ---
  const handleCreateSubCategoriaParaActiva = async () => {
    if (!categoriaSeleccionadaId) {
      alert("Selecciona una categoría principal primero.");
      return;
    }

    const nombre = prompt("Nombre de la nueva subcategoría:");
    if (!nombre || !nombre.trim()) return;

    try {
      // Enviamos ambas nomenclaturas para evitar conflictos de serialización en C# (PascalCase / camelCase)
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

  // Obtener la categoría actualmente seleccionada
  const categoriaActiva = categorias.find(
    (c) => (c.categoriaId || c.CategoriaId) === categoriaSeleccionadaId
  );

  // Subcategorías que pertenecen a la categoría activa
  const subsDeCategoriaActiva = subCategorias.filter(
    (sub) => (sub.categoriaId || sub.CategoriaId) === categoriaSeleccionadaId
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#2d3748", margin: 0 }}>🏷️ Explorador de Catálogo</h2>
        <button 
          onClick={handleCreateCategoria}
          style={{ padding: "10px 18px", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
        >
          + Nueva Categoría Principal
        </button>
      </div>

      {/* Contenedor Estilo Mercado Libre */}
      <div style={{ display: "flex", backgroundColor: "#ffffff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", minHeight: "450px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
        
        {/* PANEL IZQUIERDO: Lista de Categorías Principales */}
        <div style={{ width: "320px", backgroundColor: "#333333", color: "white", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#a0aec0", borderBottom: "1px solid #4a5568", fontWeight: "bold" }}>
            Categorías
          </div>
          
          <div style={{ overflowY: "auto", flex: 1 }}>
            {categorias.length === 0 ? (
              <p style={{ padding: "20px", color: "#a0aec0", fontSize: "0.9rem" }}>No hay categorías registradas.</p>
            ) : (
              categorias.map((cat) => {
                const catId = cat.categoriaId || cat.CategoriaId;
                const catNombre = cat.nombre || cat.Nombre;
                const isSelected = catId === categoriaSeleccionadaId;

                return (
                  <div
                    key={catId}
                    onClick={() => setCategoriaSeleccionadaId(catId)}
                    style={{
                      padding: "14px 20px",
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
                    <span style={{ fontSize: "0.8rem", color: isSelected ? "#ebf8ff" : "#718096" }}>›</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Detalle, Opciones de la Categoría Activa y sus Subcategorías */}
        <div style={{ flex: 1, padding: "30px", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
          {categoriaActiva ? (
            <>
              {/* Encabezado de la Categoría Seleccionada */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #edf2f7", paddingBottom: "15px", marginBottom: "25px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "1.5rem", color: "#1a202c" }}>
                    {categoriaActiva.nombre || categoriaActiva.Nombre}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#a0aec0" }}>ID Principal: {categoriaSeleccionadaId}</span>
                </div>
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={() => handleEditCategoria(categoriaActiva)}
                    style={{ fontSize: "0.8rem", padding: "6px 12px", backgroundColor: "#edf2f7", color: "#2d3748", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Editar Categoría
                  </button>
                  <button 
                    onClick={() => handleDeleteCategoria(categoriaSeleccionadaId)}
                    style={{ fontSize: "0.8rem", padding: "6px 12px", backgroundColor: "#fed7d7", color: "#9b2c2c", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Sección de Subcategorías estilo panel desplegable */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h4 style={{ margin: 0, color: "#4a5568", fontSize: "1.1rem" }}>Subcategorías</h4>
                <button 
                  onClick={handleCreateSubCategoriaParaActiva}
                  style={{ padding: "8px 14px", backgroundColor: "#48bb78", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  + Agregar Subcategoría a esta categoría
                </button>
              </div>

              {subsDeCategoriaActiva.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#f7fafc", borderRadius: "8px", border: "1px dashed #cbd5e0" }}>
                  <p style={{ color: "#a0aec0", margin: "0 0 10px 0" }}>Esta categoría aún no cuenta con subcategorías.</p>
                  <span style={{ fontSize: "0.85rem", color: "#718096" }}>Haz clic en el botón superior verde para agregar una nueva.</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "15px" }}>
                  {subsDeCategoriaActiva.map((sub) => {
                    const subId = sub.subCategoriaId || sub.SubCategoriaId;
                    const subNombre = sub.nombre || sub.Nombre;

                    return (
                      <div key={subId} style={{ backgroundColor: "#f8fafc", padding: "12px 15px", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.9rem", color: "#2d3748", fontWeight: "500" }}>{subNombre}</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            onClick={() => handleEditSubCategoria(sub)}
                            style={{ fontSize: "0.7rem", padding: "3px 6px", backgroundColor: "#edf2f7", border: "none", borderRadius: "3px", cursor: "pointer" }}
                            title="Editar subcategoría"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteSubCategoria(subId)}
                            style={{ fontSize: "0.7rem", padding: "3px 6px", backgroundColor: "#fed7d7", border: "none", borderRadius: "3px", cursor: "pointer" }}
                            title="Eliminar subcategoría"
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#a0aec0" }}>
              <p>Selecciona una categoría en el menú izquierdo para ver su contenido.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}