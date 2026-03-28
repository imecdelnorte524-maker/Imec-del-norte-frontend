import axios, { type InternalAxiosRequestConfig } from "axios";
import { playErrorSound } from "../utils/sounds";
import { getSocketId } from "../lib/socket";

// Contador interno (HTTP)
let activeRequests = 0;

const emitGlobalLoading = (active: boolean, message?: string) => {
  window.dispatchEvent(
    new CustomEvent("globalLoading", {
      detail: { active, source: "http", message },
    }),
  );
};

type LoadingAwareConfig = InternalAxiosRequestConfig & {
  __countedForGlobalLoading?: boolean;
  skipGlobalLoading?: boolean;
};

console.log("VITE_API_URL =>", import.meta.env.VITE_API_URL);
console.log("VITE_API_BASE_URL =>", import.meta.env.VITE_API_BASE_URL);
console.log("MODE =>", import.meta.env.MODE);

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("Falta VITE_API_URL. Revisa tu .env y reinicia Vite.");
}
if (!baseURL || !/^https?:\/\//.test(baseURL)) {
  throw new Error(
    `VITE_API_URL inválida: "${baseURL}". Debe iniciar con http:// o https://`,
  );
}

const api = axios.create({
  baseURL: baseURL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: LoadingAwareConfig) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const socketId = getSocketId();
    if (socketId) config.headers["x-socket-id"] = socketId;

    // Permite saltar loader por request
    const skip =
      config.skipGlobalLoading === true ||
      config.headers?.["x-skip-global-loading"] === "1";

    if (!skip) {
      config.__countedForGlobalLoading = true;
      activeRequests += 1;
      if (activeRequests === 1) {
        emitGlobalLoading(true, "Cargando...");
      }
    } else {
      config.__countedForGlobalLoading = false;
    }

    return config;
  },
  (error) => {
    console.error("Error en request:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const config = response.config as LoadingAwareConfig;

    if (config.__countedForGlobalLoading) {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) emitGlobalLoading(false);
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url || "";
    const config = (error.config || {}) as LoadingAwareConfig;

    console.error("❌ Error en response:", status, error.response?.data);

    if (config.__countedForGlobalLoading) {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) emitGlobalLoading(false);
    }

    if (status && status >= 400) {
      playErrorSound();
    }

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
