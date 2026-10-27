import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getCurrentProductPricing } from '../../lib/productPricing';
import { enviarMensajeChat } from './chatService';

export default function ChatWidget({ user, onAddToCart }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mensajes, setMensajes] = useState([
        { remitente: 'bot', texto: '¡Hola! Soy el asistente virtual de CAFRI. ¿En qué puedo ayudarte hoy con equipos HVACR o precios?' }
    ]);
    const [inputTexto, setInputTexto] = useState('');
    const [cargando, setCargando] = useState(false);
    const [agregandoProductoId, setAgregandoProductoId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes, isOpen]);

    const enviarTextoAutomatico = async (textoPregunta, productoId = null) => {
        if (cargando) return;
        
        setInputTexto('');
        setMensajes(prev => [...prev, { remitente: 'usuario', texto: textoPregunta }]);
        setCargando(true);

        try {
            const usuarioId = user?.id || user?.usuarioId || user?.userId || null;
            const data = await enviarMensajeChat(usuarioId, textoPregunta, productoId);
            setMensajes(prev => [...prev, {
                remitente: 'bot',
                texto: data.respuesta,
                productoId
            }]);
        } catch {
            setMensajes(prev => [...prev, { remitente: 'bot', texto: 'Lo siento, ocurrió un error al conectar con el servidor.' }]);
        } finally {
            setCargando(false);
        }
    };

    const handleAgregarAlCarrito = async (productoId) => {
        if (agregandoProductoId !== null || !onAddToCart) return;
        setAgregandoProductoId(productoId);

        try {
            const { data: product } = await api.get(`/productos/${productoId}`);
            if (Number(product.stock ?? 0) <= 0) {
                toast.error('Este producto no tiene existencias disponibles.');
                return;
            }

            const imagePath = product.image || product.imageUrl || product.imagenUrl || '';
            const baseUrl = api.defaults.baseURL.replace(/\/api\/?$/, '');
            const imageUrl = imagePath
                ? imagePath.startsWith('http')
                    ? imagePath
                    : `${baseUrl}/productos/${imagePath.replaceAll('\\', '/').split('/').pop()}`
                : 'https://placehold.co/280x180?text=Sin+Imagen';
            const pricing = getCurrentProductPricing(product);

            onAddToCart({
                ...product,
                productoId: product.productoId || product.id || productoId,
                name: product.name || product.nombre,
                price: pricing.price,
                ...pricing,
                urlImagen: imageUrl
            });
            toast.success(`${product.name || product.nombre} agregado al carrito`);
        } catch (error) {
            toast.error(error.response?.data?.mensaje || 'No se pudo agregar el producto al carrito. Inténtalo de nuevo.');
        } finally {
            setAgregandoProductoId(null);
        }
    };

    const handleEnviar = async (e) => {
        e.preventDefault();
        if (!inputTexto.trim() || cargando) return;
        const mensajeUsuario = inputTexto;
        await enviarTextoAutomatico(mensajeUsuario);
    };

    const renderizarContenidoMensaje = (texto) => {
        if (!texto) return null;

        let textoProcesado = texto
            .replace(/👉\s*Haz clic en cualquier equipo para ver sus especificaciones completas\.?/gi, '')
            .replace(/📦\s*Ver equipo:[^\n]*/gi, '');

        const regexMarkdownLink = /\[([^\]]+)\]\(([^)]+)\)/g;
        let parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regexMarkdownLink.exec(textoProcesado)) !== null) {
            if (match.index > lastIndex) {
                parts.push(textoProcesado.substring(lastIndex, match.index));
            }

            const textoEnlace = match[1];
            const urlEnlace = match[2];

            const productInfoMatch = urlEnlace.match(/^chatbot:producto:(\d+)$/);

            if (productInfoMatch) {
                const productoId = Number(productInfoMatch[1]);
                const nombreProducto = textoEnlace.replace(/^Más información:\s*/i, '');
                parts.push(
                    <button
                        key={match.index}
                        type="button"
                        onClick={() => enviarTextoAutomatico(
                            `Quiero más información sobre ${nombreProducto}`,
                            productoId
                        )}
                        disabled={cargando}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#e0f2fe',
                            color: '#075985',
                            padding: '6px 10px',
                            border: '1px solid #7dd3fc',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            margin: '5px 0',
                            cursor: cargando ? 'wait' : 'pointer'
                        }}
                    >
                        ℹ️ Más información
                    </button>
                );
            } else if (urlEnlace.startsWith('https://wa.me/')) {
                parts.push(
                    <a
                        key={match.index}
                        href={urlEnlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#25D366',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            margin: '6px 0',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                    >
                        💬 {textoEnlace}
                    </a>
                );
            } else {
                parts.push(
                    <a
                        key={match.index}
                        href={urlEnlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#3483fa', textDecoration: 'underline' }}
                    >
                        {textoEnlace}
                    </a>
                );
            }

            lastIndex = regexMarkdownLink.lastIndex;
        }

        if (lastIndex < textoProcesado.length) {
            parts.push(textoProcesado.substring(lastIndex));
        }

        return (
            <div style={{ whiteSpace: 'pre-line' }}>
                {parts.map((part, i) => {
                    if (typeof part === 'string') {
                        const subParts = part.split(/(\*\*.*?\*\*)/g);
                        return (
                            <span key={i}>
                                {subParts.map((sub, j) => {
                                    if (sub.startsWith('**') && sub.endsWith('**')) {
                                        return <strong key={j}>{sub.slice(2, -2)}</strong>;
                                    }
                                    return sub;
                                })}
                            </span>
                        );
                    }
                    return part;
                })}
            </div>
        );
    };

    return (
        <div style={{ position: 'fixed', bottom: 'max(12px, env(safe-area-inset-bottom))', right: 'max(12px, env(safe-area-inset-right))', zIndex: 1000, fontFamily: 'sans-serif' }}>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: '#3483fa',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        fontSize: '26px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                    }}
                    title="Abrir chat de asistencia"
                >
                    💬
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: 'min(360px, calc(100vw - 24px))',
                    height: 'min(520px, calc(100dvh - 24px))',
                    minHeight: 'min(280px, calc(100dvh - 24px))',
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        backgroundColor: '#3483fa',
                        color: 'white',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Asistente CAFRI HVACR</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Cerrar chat"
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        padding: '12px',
                        overflowY: 'auto',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {mensajes.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    alignSelf: msg.remitente === 'usuario' ? 'flex-end' : 'flex-start',
                                    backgroundColor: msg.remitente === 'usuario' ? '#3483fa' : '#e2e8f0',
                                    color: msg.remitente === 'usuario' ? 'white' : '#1e293b',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    maxWidth: '85%',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word'
                                }}
                            >
                                {msg.remitente === 'bot' 
                                    ? renderizarContenidoMensaje(msg.texto) 
                                    : <div style={{ whiteSpace: 'pre-line' }}>{msg.texto}</div>}
                                {msg.remitente === 'bot' && msg.productoId && (
                                    <button
                                        type="button"
                                        onClick={() => handleAgregarAlCarrito(msg.productoId)}
                                        disabled={agregandoProductoId !== null}
                                        style={{
                                            display: 'block',
                                            backgroundColor: '#15803d',
                                            color: 'white',
                                            padding: '7px 10px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '700',
                                            fontSize: '0.8rem',
                                            marginTop: '8px',
                                            cursor: agregandoProductoId !== null ? 'wait' : 'pointer',
                                            opacity: agregandoProductoId !== null ? 0.7 : 1
                                        }}
                                    >
                                        {agregandoProductoId === msg.productoId ? 'Agregando...' : '🛒 Agregar al carrito'}
                                    </button>
                                )}
                            </div>
                        ))}
                        {cargando && (
                            <div style={{ alignSelf: 'flex-start', backgroundColor: '#e2e8f0', color: '#64748b', padding: '8px 12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                                Escribiendo respuesta...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
                        <button onClick={() => enviarTextoAutomatico("necesito un minisplit económico")} style={{ whiteSpace: 'nowrap', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>❄️ Minisplits</button>
                        <button onClick={() => enviarTextoAutomatico("equipos piso techo")} style={{ whiteSpace: 'nowrap', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>🏢 Piso Techo</button>
                        <button onClick={() => enviarTextoAutomatico("minisplit mirage")} style={{ whiteSpace: 'nowrap', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>🏷️ Mirage</button>
                        <button onClick={() => enviarTextoAutomatico("cuarto de 4x4 metros")} style={{ whiteSpace: 'nowrap', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>📏 Calcular Espacio</button>
                    </div>

                    <form onSubmit={handleEnviar} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                        <input
                            type="text"
                            maxLength={500}
                            aria-label="Escribe tu mensaje"
                            value={inputTexto}
                            onChange={(e) => setInputTexto(e.target.value)}
                            placeholder="Ej. Mirage, entre 4000 a 7000..."
                            style={{
                                flex: 1,
                                minWidth: 0,
                                padding: '10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                marginLeft: '8px',
                                backgroundColor: '#3483fa',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0 14px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}