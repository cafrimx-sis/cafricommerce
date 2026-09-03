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
      setCompras(response.data);
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      setError("No se pudo cargar tu historial de compras. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", fontSize: "1.2rem" }}>
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
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: "20px", color: "#1a202c", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
        📦 Mi Historial de Compras
      </h2>

      {compras.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", background: "#f7fafc", borderRadius: "8px" }}>
          <p style={{ color: "#718096", fontSize: "1.1rem" }}>Aún no has realizado ninguna compra.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {compras.map((orden) => (
            <div
              key={orden.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "20px",
                background: "#ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2d3748" }}>
                    Orden #{orden.id}
                  </span>
                  <span style={{ marginLeft: "15px", fontSize: "0.9rem", color: "#718096" }}>
                    {new Date(orden.fechaOrden).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    backgroundColor: orden.estadoOrden.includes("Completado") || orden.estadoOrden.includes("Entregado") ? "#c6f6d5" : "#feebc8",
                    color: orden.estadoOrden.includes("Completado") || orden.estadoOrden.includes("Entregado") ? "#22543d" : "#744210",
                  }}
                >
                  {orden.estadoOrden}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", background: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#718096", display: "block" }}>Subtotal:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748" }}>${orden.subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#718096", display: "block" }}>IVA (16%):</span>
                  <span style={{ fontWeight: "600", color: "#2d3748" }}>${orden.iva.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#718096", display: "block" }}>Envío / Flete:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748" }}>${orden.costoFlete.toFixed(2)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#718096", display: "block" }}>Método de Pago:</span>
                  <span style={{ fontWeight: "600", color: "#2d3748" }}>{orden.metodoPago}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f7", paddingTop: "12px" }}>
                <span style={{ fontSize: "0.9rem", color: "#4a5568" }}>
                  {orden.referenciaPago && <>Referencia: <strong>{orden.referenciaPago}</strong></>}
                </span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.9rem", color: "#718096", marginRight: "8px" }}>Total a Pagar:</span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#2b6cb0" }}>
                    ${orden.total.toFixed(2)} MXN
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