// src/components/chatbot/chatService.js
import api from '../../lib/api';

export async function enviarMensajeChat(usuarioId, mensajeUsuario, productoId = null) {
    await new Promise((resolve) => setTimeout(resolve, 300));
  
    try {
      const response = await api.post('/chatbot/enviar', {
        usuarioId: usuarioId ? Number(usuarioId) : null,
        mensaje: mensajeUsuario || '',
        productoId
      });

      return {
        respuesta: response.data.respuesta || response.data.Respuesta || "Respuesta vacía del servidor."
      };
    } catch (error) {
      console.error("Error de conexión con el Chatbot API:", error);
      return { 
        respuesta: error.response?.status === 429
          ? "Has enviado varios mensajes seguidos. Espera un minuto y vuelve a intentarlo."
          : "No se pudo establecer conexión con el asistente virtual en este momento."
      };
    }
  }