import axios from 'axios';

const api = axios.create({
  // CAMBIA ESTA LÍNEA: Ahora sí leerá tu puerto 5104 del .env
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para asegurar que el token se envíe siempre
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Quitamos comillas si existen al recuperar
    config.headers.Authorization = `Bearer ${token.replace(/['"]+/g, '')}`;
  }
  return config;
});

export default api;