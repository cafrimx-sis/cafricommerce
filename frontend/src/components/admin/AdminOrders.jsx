import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../../lib/api";

const siguienteEstado = {
  Pagado: "En preparación",
  "En preparación": "Enviado",
  Enviado: "Entregado",
};

const filtrosEstado = [
  "Todos",
  "Pendiente",
  "Pago no completado",
  "Pagado",
  "En preparación",
  "Enviado",
  "Entregado",
  "Pendiente Pago PayPal",
];

const monedaMXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function obtenerEstado(estado) {
  return estado === "Pendiente Pago PayPal" ? "Pendiente" : estado || "Pendiente";
}

export default function AdminOrders() {
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [error, setError] = useState("");
  const [envioEnEdicion, setEnvioEnEdicion] = useState(null);

  const obtenerOrdenes = useCallback(() => api.get("/ordenes/admin/todas"), []);

  useEffect(() => {
    let activo = true;
    obtenerOrdenes()
      .then((response) => {
        if (activo) setOrdenes(response.data || []);
      })
      .catch((err) => {
        console.error("Error al cargar pedidos para administración:", err);
        if (activo) setError("No se pudieron cargar los pedidos. Intenta nuevamente.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [obtenerOrdenes]);

  const cargarOrdenes = async () => {
    setCargando(true);
    setError("");
    try {
      const response = await obtenerOrdenes();
      setOrdenes(response.data || []);
    } catch (err) {
      console.error("Error al actualizar pedidos para administración:", err);
      setError("No se pudieron actualizar los pedidos. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const ordenesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-MX");
    return ordenes.filter((orden) => {
      const estado = obtenerEstado(orden.estadoOrden);
      const coincideEstado = filtro === "Todos" ||
        estado === obtenerEstado(filtro);
      const coincideTexto = !termino || [
        orden.id,
        orden.nombreCliente,
        orden.correoCliente,
        orden.metodoPago,
      ].some((valor) => String(valor || "").toLocaleLowerCase("es-MX").includes(termino));
      return coincideEstado && coincideTexto;
    });
  }, [busqueda, filtro, ordenes]);

  const avanzarEstado = async (orden, datosEnvio = {}) => {
    const estadoSiguiente = siguienteEstado[orden.estadoOrden];
    if (!estadoSiguiente) return;

    setActualizandoId(orden.id);
    try {
      const response = await api.put(`/ordenes/admin/${orden.id}/estado`, {
        estado: estadoSiguiente,
        ...datosEnvio,
      });
      setOrdenes((actuales) => actuales.map((item) =>
        item.id === orden.id ? {
          ...item,
          estadoOrden: estadoSiguiente,
          paqueteria: response.data.paqueteria || item.paqueteria,
          numeroGuia: response.data.numeroGuia || item.numeroGuia,
        } : item
      ));
      setEnvioEnEdicion(null);
      if (response.data.notificacionEnviada === false) {
        toast.error(response.data.mensaje || "El estado se guardó, pero no se pudo enviar el correo.");
      } else {
        toast.success(`Pedido #${orden.id}: ${estadoSiguiente}`);
      }
    } catch (err) {
      console.error("Error al actualizar el estado del pedido:", err);
      toast.error(err.response?.data?.mensaje || "No se pudo actualizar el estado del pedido.");
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto", color: "#1f2937" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Pedidos</h2>
          <p style={{ margin: 0, color: "#64748b" }}>Los pagos sin confirmación después de 24 horas se marcan como no completados; no se eliminan.</p>
        </div>
        <button type="button" onClick={cargarOrdenes} disabled={cargando} style={buttonSecondary}>
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(220px, 2fr)", gap: "12px", marginBottom: "18px" }}>
        <select aria-label="Filtrar pedidos por estado" value={filtro} onChange={(event) => setFiltro(event.target.value)} style={inputStyle}>
          {filtrosEstado.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
        <input
          aria-label="Buscar pedido"
          type="search"
          placeholder="Buscar por número, cliente, correo o método de pago"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          style={inputStyle}
        />
      </div>

      {error && (
        <div role="alert" style={{ padding: "14px", background: "#fff5f5", color: "#9b2c2c", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {!error && cargando && <p role="status">Cargando pedidos...</p>}
      {!error && !cargando && ordenesFiltradas.length === 0 && (
        <p style={{ padding: "28px", textAlign: "center", background: "white", borderRadius: "8px" }}>No hay pedidos que coincidan con los filtros.</p>
      )}

      <div style={{ display: "grid", gap: "14px" }}>
        {ordenesFiltradas.map((orden) => {
          const estado = obtenerEstado(orden.estadoOrden);
          const siguiente = siguienteEstado[orden.estadoOrden];
          const esPendiente = estado === "Pendiente";
          const pagoNoCompletado = estado === "Pago no completado";
          const detalles = orden.ordenesDetalles || [];

          return (
            <article key={orden.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px" }}>Orden #{orden.id}</h3>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    {new Date(orden.fechaOrden).toLocaleString("es-MX")}
                  </span>
                </div>
                <span style={{
                  ...badgeStyle,
                  background: esPendiente ? "#feebc8" : pagoNoCompletado ? "#fed7d7" : "#c6f6d5",
                  color: esPendiente ? "#744210" : pagoNoCompletado ? "#9b2c2c" : "#22543d",
                }}>
                  {estado}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <strong>{orden.nombreCliente || "Cliente"}</strong>
                  <div>{orden.correoCliente || "Sin correo"}</div>
                  <div>{orden.telefonoCliente || "Sin teléfono"}</div>
                </div>
                <div>
                  <strong>Envío</strong>
                  <div>{orden.direccionEnvio || "Sin dirección"}</div>
                </div>
                <div>
                  <strong>Pago</strong>
                  <div>{orden.metodoPago || "No especificado"}</div>
                  <div>Total: <strong>{monedaMXN.format(orden.total || 0)}</strong></div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                <strong>Artículos</strong>
                {detalles.length === 0 ? (
                  <p style={{ margin: "6px 0 0", color: "#64748b" }}>Sin detalle de productos.</p>
                ) : detalles.map((detalle) => (
                  <div key={detalle.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "5px 0" }}>
                    <span>{detalle.producto?.nombre || `Producto ${detalle.productoId}`} × {detalle.cantidad}</span>
                    <span>{monedaMXN.format((detalle.precioUnitario || 0) * (detalle.cantidad || 0))}</span>
                  </div>
                ))}
              </div>

              {orden.estadoOrden === "Enviado" && orden.numeroGuia && (
                <p style={{ margin: "12px 0 0", color: "#475569" }}>
                  Envío: <strong>{orden.paqueteria}</strong> · Guía: <strong>{orden.numeroGuia}</strong>
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                {siguiente ? (
                  siguiente === "Enviado" ? (
                    envioEnEdicion?.ordenId === orden.id ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          avanzarEstado(orden, {
                            paqueteria: envioEnEdicion.paqueteria,
                            numeroGuia: envioEnEdicion.numeroGuia,
                          });
                        }}
                        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", width: "100%" }}
                      >
                        <input
                          aria-label={`Paquetería de la orden ${orden.id}`}
                          list="paqueterias-disponibles"
                          placeholder="Paquetería"
                          value={envioEnEdicion.paqueteria}
                          onChange={(event) => setEnvioEnEdicion((actual) => ({ ...actual, paqueteria: event.target.value }))}
                          required
                          maxLength={100}
                          style={inputStyle}
                        />
                        <datalist id="paqueterias-disponibles">
                          <option value="DHL" />
                          <option value="Estafeta" />
                          <option value="FedEx" />
                          <option value="UPS" />
                          <option value="Redpack" />
                          <option value="Paquetexpress" />
                        </datalist>
                        <input
                          aria-label={`Número de guía de la orden ${orden.id}`}
                          placeholder="Número de guía"
                          value={envioEnEdicion.numeroGuia}
                          onChange={(event) => setEnvioEnEdicion((actual) => ({ ...actual, numeroGuia: event.target.value }))}
                          required
                          maxLength={100}
                          style={inputStyle}
                        />
                        <button type="submit" disabled={actualizandoId === orden.id} style={buttonPrimary}>
                          {actualizandoId === orden.id ? "Guardando..." : "Confirmar envío"}
                        </button>
                        <button type="button" onClick={() => setEnvioEnEdicion(null)} style={buttonSecondary}>
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEnvioEnEdicion({ ordenId: orden.id, paqueteria: "", numeroGuia: "" })}
                        style={buttonPrimary}
                      >
                        Registrar guía y marcar enviado
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => avanzarEstado(orden)}
                      disabled={actualizandoId === orden.id}
                      style={buttonPrimary}
                    >
                      {actualizandoId === orden.id ? "Guardando..." : `Marcar: ${siguiente}`}
                    </button>
                  )
                ) : esPendiente ? (
                  <span style={{ color: "#975a16", fontSize: "0.9rem" }}>Esperando confirmación del pago; no se puede avanzar el pedido.</span>
                ) : pagoNoCompletado ? (
                  <span style={{ color: "#9b2c2c", fontSize: "0.9rem" }}>
                    No se recibió confirmación de pago. No se puede preparar este pedido.
                  </span>
                ) : (
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Pedido finalizado.</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  background: "white",
};

const cardStyle = {
  padding: "16px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
};

const badgeStyle = {
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const buttonPrimary = {
  padding: "9px 14px",
  border: 0,
  borderRadius: "6px",
  background: "#1a365d",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const buttonSecondary = {
  ...buttonPrimary,
  background: "#e2e8f0",
  color: "#1f2937",
};
