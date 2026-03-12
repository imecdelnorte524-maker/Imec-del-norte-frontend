// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://imec-del-norte-backend.onrender.com/api";

// Extraer la URL base (sin /api)
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

// 🔥 CONSTRUCTOR DE LA URL DEL WEBSOCKET
const WS_URL = import.meta.env.VITE_WS_URL || `${BASE_URL}`;

export function connectSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("authToken");

    console.log(`🔌 Conectando a WebSocket: ${WS_URL}`);

    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      rememberUpgrade: true,
      forceNew: true,
    });

    socket.on("connect", () => {
      console.log("✅ WebSocket conectado, ID:", socket?.id);
      localStorage.setItem("socketId", socket?.id || "");
      connectionAttempts = 0;
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket desconectado:", reason);
      localStorage.removeItem("socketId");

      if (reason === "io server disconnect") {
        // El servidor desconectó, intentar reconectar manualmente
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
        `🔴 Error de conexión WS (intento ${connectionAttempts}):`,
        err.message,
      );

      if (connectionAttempts > MAX_RECONNECT_ATTEMPTS) {
        console.error("🔴 Demasiados intentos fallidos, dejando de reconectar");
        socket?.disconnect();
      }
    });

    socket.on("connected", (data) => {
      console.log("🎉 Confirmación de conexión:", data);
    });

    socket.on("error", (error) => {
      console.error("⚠️ Error del servidor:", error);
    });

    // Para debug: mostrar todos los eventos
    socket.onAny((event, ...args) => {
      if (event !== "pong" && event !== "ping") {
        console.log(`📡 Evento recibido: ${event}`, args);
      }
    });
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
    console.log("🔌 Desconectando WebSocket...");
    socket.disconnect();
    socket = null;
    localStorage.removeItem("socketId");
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected || false;
}

// Nueva función para verificar estado y reconectar si es necesario
export function ensureSocketConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    if (socket?.connected) {
      resolve(true);
      return;
    }

    if (!socket) {
      connectSocket();
    }

    const checkInterval = setInterval(() => {
      if (socket?.connected) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    // Timeout después de 5 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, 5000);
  });
}
