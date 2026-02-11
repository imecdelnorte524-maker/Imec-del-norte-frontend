// src/hooks/useSocketEvent.ts
import { useEffect } from "react";
import type { Socket } from "socket.io-client";

/**
 * Suscribe un handler a un evento de socket y lo desuscribe automáticamente.
 */
export function useSocketEvent<T = any>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
) {
  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}