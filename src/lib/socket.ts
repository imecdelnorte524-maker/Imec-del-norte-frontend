import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://imec-del-norte-backend.onrender.com/api";

// Extraer la URL base (sin /api)
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

// 🔥 CONSTRUCTOR DE LA URL DEL WEBSOCKET
const WS_URL = import.meta.env.VITE_WS_URL || `${BASE_URL}/notifications`;

export function connectSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("authToken");
    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      rememberUpgrade: true,
    });

    socket.on("connect", () => {
      localStorage.setItem("socketId", socket?.id || "");
    });

    socket.on("disconnect", () => {
      localStorage.removeItem("socketId");
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Error de conexión WS:", err.message);
    });

    socket.on("connected", () => {});

    socket.on("error", (error) => {
      console.error("⚠️ Error del servidor:", error);
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
