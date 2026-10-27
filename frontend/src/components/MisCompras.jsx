import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/api";

const monedaMXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const estadosConPagoConfirmado = ["Pagado", "En preparación", "Enviado", "Entregado"];

function obtenerEstadoVisible(estado) {
  if (estado === "Pendiente Pago PayPal") return "Pendiente";
  return estado || "Pendiente";
}

function obtenerUrlSeguimiento(paqueteria, numeroGuia) {
  const guia = encodeURIComponent(numeroGuia);
  const URLs = {
    dhl: `https://www.dhl.com/mx-es/home/tracking.html?tracking-id=${guia}`,
    estafeta: "https://www.estafeta.com/Herramientas/Rastreo",
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${guia}`,
    ups: `https://www.ups.com/track?tracknum=${guia}`,
    redpack: "https://www.redpack.com.mx/rastreo/",
    paquetexpress: "https://www.paquetexpress.com.mx/rastreo",
  };
  return URLs[paqueteria.trim().toLocaleLowerCase("es-MX")] || null;
}

async function descargarComprobante(orden) {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const right = pageWidth - margin;
    const detalles = orden.ordenesDetalles || orden.OrdenesDetalles || [];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("CAFRI E-commerce", margin, 20);
    pdf.setFontSize(14);
    pdf.text("Comprobante de compra", margin, 31);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Orden: #${orden.id}`, margin, 42);
    pdf.text(
      `Fecha: ${new Date(orden.fechaOrden).toLocaleString("es-MX")}`,
      margin,
      48
    );
    pdf.text(`Estado: ${orden.estadoOrden || "Pendiente"}`, margin, 54);
    pdf.text(`Método de pago: ${orden.metodoPago || "N/D"}`, margin, 60);

    let y = 72;
    const drawTableHeader = () => {
      pdf.setFont("helvetica", "bold");
      pdf.setFillColor(240, 244, 248);
      pdf.rect(margin, y - 5, right - margin, 9, "F");
      pdf.text("Producto", margin + 2, y);
      pdf.text("Cant.", 119, y, { align: "right" });
      pdf.text("P. unitario", 157, y, { align: "right" });
      pdf.text("Importe", right - 2, y, { align: "right" });
      y += 9;
      pdf.setFont("helvetica", "normal");
    };

    drawTableHeader();
    detalles.forEach((detalle) => {
      const nombre = detalle.producto?.nombre || detalle.producto?.Nombre || `Producto ${detalle.productoId}`;
      const lineasNombre = pdf.splitTextToSize(nombre, 88);
      const altoFila = Math.max(7, lineasNombre.length * 5);
      if (y + altoFila > pageHeight - 48) {
        pdf.addPage();
        y = 20;
        drawTableHeader();
      }

      const cantidad = Number(detalle.cantidad) || 0;
      const precio = Number(detalle.precioUnitario) || 0;
      pdf.text(lineasNombre, margin + 2, y);
      pdf.text(String(cantidad), 119, y, { align: "right" });
      pdf.text(monedaMXN.format(precio), 157, y, { align: "right" });
      pdf.text(monedaMXN.format(cantidad * precio), right - 2, y, { align: "right" });
      y += altoFila + 2;
    });

    if (y + 48 > pageHeight - 15) {
      pdf.addPage();
      y = 20;
    } else {
      y += 4;
    }

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y, right, y);
    y += 8;
    pdf.text(`Subtotal: ${monedaMXN.format(Number(orden.subtotal) || 0)}`, right, y, { align: "right" });
    y += 6;
    pdf.text(`IVA: ${monedaMXN.format(Number(orden.iva) || 0)}`, right, y, { align: "right" });
    y += 6;
    pdf.text(`Envío: ${monedaMXN.format(Number(orden.costoFlete) || 0)}`, right, y, { align: "right" });
    y += 8;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(`Total: ${monedaMXN.format(Number(orden.total) || 0)}`, right, y, { align: "right" });
    y += 12;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Este comprobante no es una factura fiscal.", margin, y);

    pdf.save(`comprobante-orden-${orden.id}.pdf`);
  } catch (error) {
    console.error("No se pudo generar el comprobante PDF:", error);
    toast.error("No se pudo generar el comprobante. Inténtalo de nuevo.");
  }
}

export default function MisCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const obtenerCompras = useCallback(() => api.get("/ordenes/mis-compras"), []);
  const cargarCompras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerCompras();
      setCompras(response.data || []);
    } catch (err) {
      console.error("Error al cargar el historial:", err);
      setError("No se pudo cargar tu historial de compras. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    obtenerCompras()
      .then((response) => {
        if (active) setCompras(response.data || []);
      })
      .catch((err) => {
        console.error("Error al cargar el historial:", err);
        if (active) setError("No se pudo cargar tu historial de compras. Inténtalo de nuevo más tarde.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [obtenerCompras]);

  const comprasOrdenadas = useMemo(
    () => [...compras].sort((a, b) => new Date(b.fechaOrden).getTime() - new Date(a.fechaOrden).getTime()),
    [compras]
  );
  const comprasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-MX");
    return comprasOrdenadas.filter((orden) => {
      const estado = obtenerEstadoVisible(orden.estadoOrden);
      const detalles = orden.ordenesDetalles || orden.OrdenesDetalles || [];
      const coincideEstado = filtroEstado === "Todos" || estado === filtroEstado;
      const coincideBusqueda = !termino || [
        orden.id,
        orden.metodoPago,
        orden.referenciaPago,
        orden.numeroGuia,
        orden.paqueteria,
        ...detalles.map((detalle) => detalle.producto?.nombre || detalle.producto?.Nombre || `Producto ${detalle.productoId}`)
      ].some((valor) => String(valor || "").toLocaleLowerCase("es-MX").includes(termino));
      return coincideEstado && coincideBusqueda;
    });
  }, [busqueda, comprasOrdenadas, filtroEstado]);

  const pedidosActivos = compras.filter((orden) =>
    ["Pendiente", "Pagado", "En preparación", "Enviado"].includes(obtenerEstadoVisible(orden.estadoOrden))
  ).length;
  const pedidosEntregados = compras.filter((orden) => obtenerEstadoVisible(orden.estadoOrden) === "Entregado").length;
  const totalComprado = compras.reduce((total, orden) => {
    const estado = obtenerEstadoVisible(orden.estadoOrden);
    return estadosConPagoConfirmado.includes(estado) ? total + (Number(orden.total) || 0) : total;
  }, 0);

  if (loading && compras.length === 0) {
    return (
      <div className="compras-state compras-loading">
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  if (error && compras.length === 0) {
    return (
      <div className="compras-state compras-error">
        <p>{error}</p>
        <button type="button" className="compras-refresh-button" onClick={cargarCompras}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="mis-compras-page" style={{ padding: "clamp(20px, 4vw, 40px) 16px", maxWidth: "1000px", margin: "0 auto", boxSizing: "border-box" }}>
      <style>{`
        .mis-compras-page {
          animation: rise-in 420ms ease both;
        }

        .compras-state {
          display: grid;
          min-height: 240px;
          place-items: center;
          padding: 32px 20px;
          color: var(--muted);
          text-align: center;
        }

        .compras-error {
          color: #b42318;
        }

        .compras-title {
          margin: 0 0 6px;
          color: var(--brand-950);
          font-size: clamp(1.7rem, 3vw, 2.25rem);
          letter-spacing: -0.045em;
        }

        .compras-intro {
          margin: 0;
          color: var(--muted);
          line-height: 1.55;
        }

        .compras-toolbar {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(170px, 220px) auto;
          gap: 10px;
          margin: 22px 0 18px;
        }

        .compras-filter {
          width: 100%;
          min-height: 44px;
          padding: 9px 12px;
          color: var(--ink);
          background: white;
          border: 1px solid var(--line);
          border-radius: 10px;
        }

        .compras-refresh-button {
          min-height: 44px;
          padding: 9px 14px;
          color: var(--brand-800);
          background: white;
          border: 1px solid var(--line);
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .compras-refresh-button:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .compras-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 20px 0 24px;
        }

        .compras-stat {
          padding: 16px 18px;
          background: rgba(255,255,255,0.88);
          border: 1px solid var(--line);
          border-radius: 14px;
        }

        .compras-stat span {
          display: block;
          margin-bottom: 6px;
          color: var(--muted);
          font-size: 0.8rem;
        }

        .compras-stat strong {
          color: var(--brand-900);
          font-size: clamp(1.05rem, 2vw, 1.35rem);
          letter-spacing: -0.03em;
        }

        .compras-card {
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: clamp(16px, 3vw, 24px);
          background: var(--surface);
          box-shadow: var(--shadow-soft);
        }

        .compras-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
          flex-wrap: wrap;
        }

        .compras-order-title {
          color: var(--brand-900);
          font-size: 1.05rem;
          font-weight: 800;
        }

        .compras-no-results {
          padding: 24px;
          color: var(--muted);
          background: white;
          border: 1px dashed var(--line);
          border-radius: 14px;
          text-align: center;
        }

        .compras-continue-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 0 18px;
          color: white;
          background: linear-gradient(135deg, var(--brand-800), var(--brand-700));
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 800;
          text-decoration: none;
        }

        .compras-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--line);
          padding-top: 16px;
          gap: 10px;
        }

        .compras-card-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 14px;
        }

        .compras-pdf-button {
          border: 0;
          border-radius: 10px;
          padding: 11px 16px;
          background: linear-gradient(135deg, var(--brand-800), var(--brand-700));
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(18, 61, 98, 0.18);
        }

        @media (max-width: 600px) {
          .compras-toolbar {
            grid-template-columns: 1fr;
          }
          .compras-stats {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .compras-stat {
            padding: 13px 15px;
          }
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
          .compras-card-actions {
            justify-content: stretch;
          }
          .compras-pdf-button {
            width: 100%;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <h1 className="compras-title">Mis compras</h1>
          <p className="compras-intro">Consulta el estado, los productos y el seguimiento de tus pedidos.</p>
        </div>
        <button
          type="button"
          className="compras-refresh-button"
          onClick={cargarCompras}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ margin: "14px 0", padding: "12px", color: "#9b2c2c", background: "#fff5f5", borderRadius: "10px" }}>
          {error} Se muestran los datos cargados anteriormente.
        </p>
      )}

      {compras.length > 0 && (
        <>
          <div className="compras-stats" aria-label="Resumen de compras">
            <div className="compras-stat">
              <span>Pedidos activos</span>
              <strong>{pedidosActivos}</strong>
            </div>
            <div className="compras-stat">
              <span>Pedidos entregados</span>
              <strong>{pedidosEntregados}</strong>
            </div>
            <div className="compras-stat">
              <span>Total de compras confirmadas</span>
              <strong>{monedaMXN.format(totalComprado)}</strong>
            </div>
          </div>
          <div className="compras-toolbar">
            <input
              type="search"
              className="compras-filter"
              aria-label="Buscar en mis compras"
              placeholder="Buscar por pedido, producto o guía"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
            <select
              className="compras-filter"
              aria-label="Filtrar compras por estado"
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
            >
              {["Todos", "Pendiente", "Pago no completado", "Pagado", "En preparación", "Enviado", "Entregado", "Cancelado"].map((estado) => (
                <option key={estado} value={estado}>{estado === "Todos" ? "Todos los estados" : estado}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {compras.length === 0 ? (
        <div className="compras-state" style={{ background: "#fff", borderRadius: "16px", border: "1px dashed var(--line)" }}>
          <div>
            <p style={{ color: "#15344d", fontSize: "1.1rem", fontWeight: 800, margin: "0 0 8px" }}>Aún no tienes compras</p>
            <p style={{ color: "#718096", margin: "0 0 16px" }}>Cuando realices un pedido, podrás consultar aquí su estado y comprobante.</p>
            <Link to="/" className="compras-continue-link">Explorar productos</Link>
          </div>
        </div>
      ) : (
        comprasFiltradas.length === 0 ? (
          <div className="compras-no-results">No hay compras que coincidan con la búsqueda o el estado seleccionado.</div>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {comprasFiltradas.map((orden) => (
            (() => {
              const estado = obtenerEstadoVisible(orden.estadoOrden);
              const pagoConfirmado = estadosConPagoConfirmado.includes(estado);
              const estadoFinalizado = estado === "Entregado";
              const estadoSinConfirmar = estado === "Pago no completado";
              const estadoColor = pagoConfirmado
                ? { backgroundColor: "#c6f6d5", color: "#22543d" }
                : estadoSinConfirmar || estado === "Cancelado"
                  ? { backgroundColor: "#fed7d7", color: "#9b2c2c" }
                  : { backgroundColor: "#feebc8", color: "#744210" };
              const descripcionEstado = {
                "Pendiente": "El pago todavía no está confirmado. No realices otro pago sin revisar primero la actividad de PayPal.",
                "Pago no completado": "No recibimos confirmación del pago durante 24 horas. Revisa la actividad de PayPal antes de volver a pagar; si ves un cargo, contacta a soporte.",
                "Pagado": "Pago confirmado. La tienda preparará tu pedido.",
                "En preparación": "Tu pedido está siendo preparado.",
                "Enviado": "Tu pedido fue enviado.",
                "Entregado": "Tu pedido fue marcado como entregado."
              }[estado];
              const detallesOrden = orden.ordenesDetalles || orden.OrdenesDetalles || [];

              return (
            <div
              key={orden.id}
              className="compras-card"
            >
              <div className="compras-header-row">
                <div>
                  <span className="compras-order-title">
                    Orden #{orden.id}
                  </span>
                  <span style={{ display: "block", marginTop: "4px", fontSize: "0.85rem", color: "#718096" }}>
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
                    ...estadoColor,
                    alignSelf: "flex-start",
                  }}
                >
                  {estado}
                </span>
              </div>

              {descripcionEstado && (
                <p style={{ margin: "0 0 12px", color: "#4a5568", fontSize: "0.9rem" }}>
                  {descripcionEstado}
                </p>
              )}

              {estado === "Enviado" && orden.paqueteria && orden.numeroGuia && (
                <div style={{ marginBottom: "12px", padding: "12px", background: "#eff6ff", borderRadius: "8px", color: "#1e3a8a" }}>
                  <strong>Seguimiento de envío</strong>
                  <div>Paquetería: {orden.paqueteria}</div>
                  <div>Número de guía: <strong>{orden.numeroGuia}</strong></div>
                  {obtenerUrlSeguimiento(orden.paqueteria, orden.numeroGuia) && (
                    <a
                      href={obtenerUrlSeguimiento(orden.paqueteria, orden.numeroGuia)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-block", marginTop: "6px", color: "#1d4ed8", fontWeight: 600 }}
                    >
                      Rastrear paquete
                    </a>
                  )}
                </div>
              )}

              {detallesOrden.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <strong style={{ display: "block", marginBottom: "6px", color: "#2d3748" }}>Productos</strong>
                  {detallesOrden.map((detalle) => (
                    <div key={detalle.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "4px 0", color: "#4a5568", fontSize: "0.9rem" }}>
                      <span>{detalle.producto?.nombre || `Producto ${detalle.productoId}`} × {detalle.cantidad}</span>
                      <span>{monedaMXN.format((detalle.precioUnitario || 0) * (detalle.cantidad || 0))}</span>
                    </div>
                  ))}
                </div>
              )}

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
                    {monedaMXN.format(Number(orden.total) || 0)}
                  </span>
                </div>
              </div>
              {pagoConfirmado && !estadoFinalizado && (
              <div className="compras-card-actions">
                <button
                  type="button"
                  className="compras-pdf-button"
                  onClick={() => descargarComprobante(orden)}
                >
                  Descargar comprobante PDF
                </button>
              </div>
              )}
            </div>
              );
            })()
          ))}
        </div>
      ))}
    </div>
  );
}