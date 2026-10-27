import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";

export default function BrandManager() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarMarcas = useCallback(async () => {
    try {
      const res = await api.get("/marcas");
      setMarcas(res.data || []);
    } catch (err) {
      console.error("Error al cargar marcas", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/marcas")
      .then((res) => {
        if (active) setMarcas(res.data || []);
      })
      .catch((err) => {
        if (active) console.error("Error al cargar marcas", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
    } catch {
      try {
        await api.post(`/marcas/update/${marcaId}`, { 
          Nombre: nuevoNombre.trim(),
          nombre: nuevoNombre.trim() 
        });
        cargarMarcas();
        alert("Marca actualizada con éxito");
      } catch {
        alert("Error al actualizar la marca");
      }
    }
  };

  const handleDeleteMarca = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta marca?")) return;
    try {
      await api.delete(`/marcas/${id}`);
      cargarMarcas();
      alert("Marca eliminada con éxito");
    } catch {
      try {
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
    <div style={{ padding: "16px", maxWidth: "1000px", margin: "0 auto", fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif", boxSizing: "border-box" }}>
      <style>{`
        .brand-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 12px;
        }

        .brand-header h2 {
          color: #2d3748;
          margin: 0;
          font-size: 1.4rem;
        }

        .brand-btn-create {
          padding: 10px 18px;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.9rem;
          white-space: nowrap;
          transition: background 0.2s;
        }

        .brand-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 15px;
        }

        .brand-action-btn {
          font-size: 0.9rem;
          padding: 8px 12px;
          min-height: 36px;
          min-width: 36px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 600px) {
          .brand-header {
            flex-direction: column;
            align-items: stretch;
          }

          .brand-header h2 {
            font-size: 1.25rem;
            text-align: center;
          }

          .brand-btn-create {
            width: 100%;
            padding: 12px;
            font-size: 1rem;
          }

          .brand-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .brand-card-container {
            padding: 12px !important;
          }
        }
      `}</style>

      <div className="brand-header">
        <h2>🏷️ Gestión de Marcas</h2>
        <button 
          type="button"
          onClick={handleCreateMarca}
          className="brand-btn-create"
        >
          + Nueva Marca
        </button>
      </div>

      <div className="brand-card-container" style={{ backgroundColor: "#ffffff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", padding: "20px", border: "1px solid #e2e8f0" }}>
        {marcas.length === 0 ? (
          <div style={{ padding: "40px 15px", textAlign: "center", color: "#a0aec0" }}>
            <p style={{ margin: "0 0 8px 0" }}>No hay marcas registradas en el sistema.</p>
            <span style={{ fontSize: "0.85rem" }}>Haz clic en el botón superior para agregar una nueva marca.</span>
          </div>
        ) : (
          <div className="brand-grid">
            {marcas.map((marca, index) => {
              const marcaId = marca.marcaId ?? marca.id ?? index;
              const marcaNombre = marca.nombre ?? marca.Nombre ?? marca.name ?? "Sin nombre";

              return (
                <div 
                  key={marcaId} 
                  style={{ 
                    backgroundColor: "#f8fafc", 
                    padding: "14px", 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    gap: "10px",
                    wordBreak: "break-word"
                  }}
                >
                  <span style={{ fontSize: "0.95rem", color: "#2d3748", fontWeight: "600", flex: 1 }}>
                    {marcaNombre}
                  </span>
                  
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button 
                      type="button"
                      onClick={() => handleEditMarca(marca)}
                      className="brand-action-btn"
                      style={{ backgroundColor: "#edf2f7" }}
                      title="Editar marca"
                      aria-label={`Editar ${marcaNombre}`}
                    >
                      ✏️
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteMarca(marcaId)}
                      className="brand-action-btn"
                      style={{ backgroundColor: "#fed7d7" }}
                      title="Eliminar marca"
                      aria-label={`Eliminar ${marcaNombre}`}
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