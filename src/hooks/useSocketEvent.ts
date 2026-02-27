import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

/**
 * Suscribe un handler a un evento de socket y lo desuscribe automáticamente.
 * Incluye logs para debug y manejo de errores.
 */
export function useSocketEvent<T = any>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
  debug: boolean = false,
) {
  const handlerRef = useRef(handler);

  // Actualizar la referencia cuando el handler cambie
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const wrappedHandler = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(event, wrappedHandler);

    return () => {
      socket.off(event, wrappedHandler);
    };
  }, [socket, event, debug]);
}
