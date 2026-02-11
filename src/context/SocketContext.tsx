// src/context/SocketContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Si no está autenticado, nos aseguramos de cerrar el socket
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    // Si está autenticado, conectamos (si no existía)
    const s = connectSocket();
    setSocket(s);

    return () => {
      // No desconectamos aquí: solo limpiamos handlers locales.
      // El disconnect real se hace cuando se cierre sesión o se desmonte la app.
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}