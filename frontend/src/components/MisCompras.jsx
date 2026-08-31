import React, { useState, useEffect } from "react";
import api from "../lib/api";

export default function MisCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await api.get("/ordenes/mis-compras");
      setCompras(response.data || []);
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      setError("No se pudo cargar tu historial de compras. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", fontSize: "1.1rem", color: "#4a5568" }}>
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#e53e3e" }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif", boxSizing: "border-box" }}>
      <style>{`
        .compras-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
        }

        .compras-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #edf2f7;
          padding-top: 12px;
          gap: 10px;
        }

        @media (max-width: 600px) {
          .compras-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .compras-card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .compras-card-footer > div {
            text-align: left !important;
            width: 100%;
            margin-top: 6px;
          }
        }
      `}</style>

      <h2 style={{ marginBottom: "20px", color: "#1a202c", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px", fontSize: "1.4rem" }}>
        📦 Mi Historial de Compras
      </h2>

      {compras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", background: "#f7fafc", borderRadius: "8px" }}>
          <p style={{ color: "#718096", fontSize: "1rem", margin: 0 }}>Aún no has realizado ninguna compra.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {compras.map((orden) => (
            <div
              key={orden.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "16px",
                background: "#ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div className="compras-header-row">
                <div>
                  <span style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#2d3748" }}>
                    Orden #{orden.id}
                  </span>
                  <span style={{ marginLeft: "12px", fontSize: "0.85rem", color: "#718096" }}>
                    {new Date(orden.fechaOrden).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    backgroundColor: (orden.estadoOrden || "").includes("Completado") || (orden.estadoOrden || "").includes("Entregado") ? "#c6f6d5" : "#feebc8",
                    color: (orden.estadoOrden || "").includes("Completado") || (orden.estadoOrden || "").includes("Entregado") ? "#22543d" : "#744210",
                    alignSelf: "flex-start"
                  }}
                >
                  {orden.estadoOrden}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#718096", display: "block" }}>Subtotal:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.95rem" }}>${(orden.subtotal || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#718096", display: "block" }}>IVA (16%):</span>
                  <span style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.95rem" }}>${(orden.iva || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#718096", display: "block" }}>Envío:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.95rem" }}>${(orden.costoFlete || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#718096", display: "block" }}>Método:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748", fontSize: "0.95rem" }}>{orden.metodoPago}</span>
                </div>
              </div>

              <div className="compras-card-footer">
                <span style={{ fontSize: "0.85rem", color: "#4a5568", wordBreak: "break-word" }}>
                  {orden.referenciaPago && <>Ref: <strong>{orden.referenciaPago}</strong></>}
                </span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.85rem", color: "#718096", marginRight: "6px" }}>Total:</span>
                  <span style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#2b6cb0" }}>
                    ${(orden.total || 0).toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}