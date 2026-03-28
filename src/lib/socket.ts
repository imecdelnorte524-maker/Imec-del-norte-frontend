// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const API_URL =
  import.meta.env.VITE_API_URL;

// Extraer la URL base (sin /api)
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

// 🔥 CONSTRUCTOR DE LA URL DEL WEBSOCKET - CORREGIDO
// IMPORTANTE: Socket.IO NO usa el path /api, usa /socket.io por defecto
const WS_URL = import.meta.env.VITE_WS_URL || BASE_URL;

export function connectSocket(): Socket {
  if (!socket) {
    // 🔥 CORRECCIÓN 1: Usar el token correcto
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("authToken");

    socket = io(WS_URL, {
      // 🔥 CORRECCIÓN 2: Orden de transports - websocket primero, polling como fallback
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
      },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // 🔥 CORRECCIÓN 3: NO usar forceNew a menos que sea necesario
      forceNew: false,
      // 🔥 CORRECCIÓN 4: Añadir withCredentials para CORS
      withCredentials: true,
      // 🔥 CORRECCIÓN 5: Path explícito (por defecto es /socket.io)
      path: "/socket.io",
    });

    // 🔥 CORRECCIÓN 6: Eventos con logs detallados
    socket.on("connect", () => {
      localStorage.setItem("socketId", socket?.id || "");
      connectionAttempts = 0;
    });

    socket.on("disconnect", (reason) => {
      localStorage.removeItem("socketId");

      if (reason === "io server disconnect") {
        setTimeout(() => {
          if (socket) {
            socket.connect();
          }
        }, 1000);
      }
    });

    socket.on("connect_error", (err) => {
      connectionAttempts++;
      console.error(
        `🔴 Error de conexión WS (intento ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`,
        err.message,
      );
      console.error("📡 URL intentada:", WS_URL);

      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("🔴 Demasiados intentos fallidos, dejando de reconectar");
        socket?.disconnect();
        socket = null;
      }
    });

    socket.on("error", (error) => {
      console.error("⚠️ Error del servidor:", error);
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function getSocketId(): string | null {
  return socket?.id || localStorage.getItem("socketId");
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    localStorage.removeItem("socketId");
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

// 🔥 CORRECCIÓN 8: Mejorar ensureSocketConnection
export function ensureSocketConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    if (socket?.connected) {
      resolve(true);
      return;
    }

    if (!socket) {
      connectSocket();
    }

    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo (30 * 100ms)

    const checkInterval = setInterval(() => {
      attempts++;
      if (socket?.connected) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

// 🔥 NUEVA FUNCIÓN: Reconnect manual
export function reconnectSocket(): Socket | null {
  disconnectSocket();
  return connectSocket();
}
