// src/context/SocketContext.tsx
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
  const reconnectTimeout = useRef<number | undefined>(undefined);

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
    if (!isAuthenticatedAndReady) {
      cleanupSocket();
      return;
    }

    if (socket?.connected) {
      return;
    }

    if (isConnecting.current) {
      return;
    }

    isConnecting.current = true;

    const s = connectSocket();
    setSocket(s);

    const handleConnect = () => {
      isConnecting.current = false;
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Error conectando socket:", error.message);
      isConnecting.current = false;
      reconnectTimeout.current = window.setTimeout(() => {
        setSocket(null);
      }, 3000);
    };

    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        reconnectTimeout.current = window.setTimeout(() => {
          setSocket(null);
        }, 1000);
      }
    };

    s.on("connect", handleConnect);
    s.on("connect_error", handleConnectError);
    s.on("disconnect", handleDisconnect);

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
