// src/api/axios.ts

import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://imec-del-norte-backend.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Mantener true cuando el backend esté configurado
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    // ✅ Para withCredentials: true, el token debe ir en el header Authorization
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;