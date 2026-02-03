// src/api/axios.ts
import axios from "axios";
import { playErrorSound } from "../utils/sounds";

// Configuración base de axios
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://imec-del-norte-backend.onrender.com/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Error en request:", error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || "";

    console.error(
      "❌ Error en response:",
      status,
      error.response?.data
    );

    if (status && status >= 400) {
      playErrorSound();
    }

    // ============================
    // 401 - NO redirigir en /auth/login
    // ============================
    if (status === 401) {
      // Endpoints de autenticación "públicos" donde NO queremos recargar la SPA
      const isLoginRequest = url.includes("/auth/login");
      const isRegisterRequest = url.includes("/auth/register");
      const isPasswordResetPublic =
        url.includes("/auth/request-password-reset") ||
        url.includes("/auth/reset-password");

      const isPublicAuthRequest =
        isLoginRequest || isRegisterRequest || isPasswordResetPublic;

      if (!isPublicAuthRequest) {
        // Solo tratamos como sesión expirada si hay token guardado
        const hasToken = !!localStorage.getItem("authToken");
        if (hasToken) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          // Para sesión expirada en rutas protegidas
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;