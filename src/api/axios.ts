// src/api/axios.ts
import axios from "axios";
import { playErrorSound } from "../utils/sounds";
import { getSocketId } from "../lib/socket";

// Event emitter para loading global (sin contexto)
let activeRequests = 0;

const setGlobalLoading = (loading: boolean) => {
  window.dispatchEvent(new CustomEvent("globalLoading", { detail: loading }));
};

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

// Interceptor para token y socket ID (combinado)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const socketId = getSocketId();
    if (socketId) {
      config.headers["x-socket-id"] = socketId;
    }

    // Incrementar contador de peticiones activas
    activeRequests++;
    if (activeRequests === 1) {
      setGlobalLoading(true);
    }

    return config;
  },
  (error) => {
    console.error("Error en request:", error);
    return Promise.reject(error);
  },
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    // Decrementar contador de peticiones activas
    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || "";

    console.error("❌ Error en response:", status, error.response?.data);

    // Decrementar contador de peticiones activas
    activeRequests--;
    if (activeRequests === 0) {
      setGlobalLoading(false);
    }

    if (status && status >= 400) {
      playErrorSound();
    }

    // 401 - Manejo de sesión
    if (status === 401) {
      const isLoginRequest = url.includes("/auth/login");
      const isRegisterRequest = url.includes("/auth/register");
      const isPasswordResetPublic =
        url.includes("/auth/request-password-reset") ||
        url.includes("/auth/reset-password");

      const isPublicAuthRequest =
        isLoginRequest || isRegisterRequest || isPasswordResetPublic;

      if (!isPublicAuthRequest) {
        const hasToken = !!localStorage.getItem("authToken");
        if (hasToken) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
