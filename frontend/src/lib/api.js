import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7107/api',
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