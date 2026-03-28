// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const WS_URL = import.meta.env.VITE_WS_URL || BASE_URL;

export function connectSocket(): Socket {
  if (!socket) {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("authToken");

    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: token || "",
      },
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      withCredentials: true,
      path: "/socket.io",
    });

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
    const maxAttempts = 30;

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

export function reconnectSocket(): Socket | null {
  disconnectSocket();
  return connectSocket();
}
