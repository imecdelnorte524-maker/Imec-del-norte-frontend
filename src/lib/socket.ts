// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Detectar URL del WS a partir del .env o de la API
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://imec-del-norte-backend.onrender.com/api";

// Si VITE_API_URL termina en /api, usamos el host base
const DEFAULT_WS_URL = API_URL.replace(/\/api\/?$/, "");

const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export function connectSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("authToken");

    socket = io(WS_URL, {
      transports: ["websocket"],
      auth: {
        token: token || "",
      },
    });

    socket.on("connect", () => {
      console.log("🔌 Socket conectado:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket desconectado:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Error de conexión WS:", err.message);
    });
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}