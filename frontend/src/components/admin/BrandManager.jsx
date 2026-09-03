import React, { useState, useEffect } from "react";
import api from "../../lib/api";

export default function BrandManager() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMarcas();
  }, []);

  const cargarMarcas = async () => {
    try {
      const res = await api.get("/marcas");
      setMarcas(res.data || []);
    } catch (err) {
      console.error("Error al cargar marcas", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarca = async () => {
    const nombre = prompt("Nombre de la nueva marca:");
    if (!nombre || !nombre.trim()) return;
    try {
      await api.post("/marcas", { 
        Nombre: nombre.trim(),
        nombre: nombre.trim() 
      });
      cargarMarcas();
      alert("Marca creada con éxito");
    } catch (err) {
      console.error("Error al crear marca:", err.response?.data || err);
      alert("Error al crear marca");
    }
  };

  const handleEditMarca = async (marca) => {
    const marcaId = marca.marcaId || marca.Id || marca.id;
    const nombreActual = marca.nombre || marca.Nombre || marca.name;

    const nuevoNombre = prompt("Editar nombre de la marca:", nombreActual);
    if (!nuevoNombre || !nuevoNombre.trim() || nuevoNombre.trim() === nombreActual) return;

    try {
      await api.put(`/marcas/${marcaId}`, { 
        marcaId: marcaId,
        Nombre: nuevoNombre.trim(),
        nombre: nuevoNombre.trim() 
      });
      cargarMarcas();
      alert("Marca actualizada con éxito");
    } catch (err) {
      try {
        await api.post(`/marcas/update/${marcaId}`, { 
          Nombre: nuevoNombre.trim(),
          nombre: nuevoNombre.trim() 
        });
        cargarMarcas();
        alert("Marca actualizada con éxito");
      } catch (errPost) {
        alert("Error al actualizar la marca");
      }
    }
  };

  const handleDeleteMarca = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta marca?")) return;
    try {
      // Intento 1: Método estándar REST DELETE (/api/marcas/{id})
      await api.delete(`/marcas/${id}`);
      cargarMarcas();
      alert("Marca eliminada con éxito");
    } catch (err) {
      try {
        // Intento 2: Método alternativo POST por si el backend lo requiere
        await api.post(`/marcas/delete/${id}`);
        cargarMarcas();
        alert("Marca eliminada con éxito");
      } catch (errPost) {
        console.error("Error al eliminar:", errPost.response?.data || errPost);
        alert("No se pudo eliminar la marca. Verifica que el endpoint de eliminación exista en el backend.");
      }
    }
  };

  if (loading) return <p style={{ padding: '20px' }}>Cargando marcas...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#2d3748", margin: 0 }}>🏷️ Gestión de Marcas</h2>
        <button 
          onClick={handleCreateMarca}
          style={{ padding: "10px 18px", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" }}
        >
          + Nueva Marca
        </button>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "20px", border: "1px solid #e2e8f0" }}>
        {marcas.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#a0aec0" }}>
            <p>No hay marcas registradas en el sistema.</p>
            <span style={{ fontSize: "0.85rem" }}>Haz clic en el botón superior para agregar una nueva marca.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" }}>
            {marcas.map((marca, index) => {
              const marcaId = marca.marcaId ?? marca.id ?? index;
              const marcaNombre = marca.nombre ?? marca.Nombre ?? marca.name ?? "Sin nombre";

              return (
                <div key={marcaId} style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1rem", color: "#2d3748", fontWeight: "600" }}>{marcaNombre}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button 
                      onClick={() => handleEditMarca(marca)}
                      style={{ fontSize: "0.8rem", padding: "5px 8px", backgroundColor: "#edf2f7", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      title="Editar marca"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteMarca(marcaId)}
                      style={{ fontSize: "0.8rem", padding: "5px 8px", backgroundColor: "#fed7d7", border: "none", borderRadius: "4px", cursor: "pointer" }}
                      title="Eliminar marca"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}