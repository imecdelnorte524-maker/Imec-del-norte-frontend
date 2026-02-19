// src/lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://imec-del-norte-backend.onrender.com/api";

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
      // Importante: forzar la reconexión y mantener el ID
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // Usamos el operador '?' por seguridad dentro del callback
      console.log("Transporte:", socket?.io.engine.transport.name);
      console.log("🔌 Socket conectado:", socket?.id);
      localStorage.setItem("socketId", socket?.id || "");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket desconectado:", reason);
      localStorage.removeItem("socketId");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Error de conexión WS:", err.message);
    });

    // Escuchar eventos del servidor (opcional, para debug)
    socket.on("connected", (data) => {
      console.log("📡 Confirmación de conexión:", data);
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
    socket.disconnect();
    socket = null;
    localStorage.removeItem("socketId");
  }
}
