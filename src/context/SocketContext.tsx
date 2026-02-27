import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticatedAndReady } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const isConnecting = useRef<boolean>(false);
  // 👈 Usamos ReturnType<typeof setTimeout> que es number en el navegador
  const reconnectTimeout = useRef<number | undefined>(undefined);

  // Función para limpiar socket
  const cleanupSocket = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
    if (socket) {
      disconnectSocket();
      setSocket(null);
    }
    isConnecting.current = false;
  };

  useEffect(() => {
    // Si no está autenticado y listo, limpiar socket
    if (!isAuthenticatedAndReady) {
      cleanupSocket();
      return;
    }

    // Si ya estamos conectados o conectando, no hacer nada
    if (socket?.connected) {
      return;
    }

    if (isConnecting.current) {
      return;
    }

    // Iniciar conexió
    isConnecting.current = true;

    const s = connectSocket();
    setSocket(s);

    // Manejadores de eventos
    const handleConnect = () => {
      isConnecting.current = false;
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Error conectando socket:", error.message);
      isConnecting.current = false;

      // Intentar reconectar después de 3 segundos
      reconnectTimeout.current = window.setTimeout(() => {
        setSocket(null); // Forzar recreación
      }, 3000);
    };

    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        // El servidor desconectó, intentar reconectar
        reconnectTimeout.current = window.setTimeout(() => {
          setSocket(null);
        }, 1000);
      }
    };

    s.on("connect", handleConnect);
    s.on("connect_error", handleConnectError);
    s.on("disconnect", handleDisconnect);

    // Cleanup
    return () => {
      s.off("connect", handleConnect);
      s.off("connect_error", handleConnectError);
      s.off("disconnect", handleDisconnect);

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
      }
    };
  }, [isAuthenticatedAndReady]);

  // Escuchar evento de logout
  useEffect(() => {
    const handleLogout = () => {
      cleanupSocket();
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
