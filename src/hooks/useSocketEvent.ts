// hooks/useSocketEvent.ts
import { useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";

export function useSocketEvent<T = any>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
) {
  const handlerRef = useRef(handler);
  const isMounted = useRef(true);
  const pendingEvents = useRef<T[]>([]);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (pendingEvents.current.length > 0) {
      pendingEvents.current.forEach((data) => {
        try {
          handlerRef.current(data);
        } catch (error) {
          console.error(`Error en handler pendiente para ${event}:`, error);
        }
      });
      pendingEvents.current = [];
    }
  }, [handler, event]);

  const wrappedHandler = useCallback(
    (data: T) => {
      if (!isMounted.current) return;

      try {
        handlerRef.current(data);
      } catch (error) {
        console.error(`Error en handler para evento ${event}:`, error);
      }
    },
    [event],
  );

  useEffect(() => {
    isMounted.current = true;

    if (!socket) return;

    const onConnect = () => {
      socket.on(event, wrappedHandler);
    };

    if (socket.connected) {
      socket.on(event, wrappedHandler);
    } else {
      socket.on("connect", onConnect);
    }

    return () => {
      isMounted.current = false;

      if (socket) {
        socket.off(event, wrappedHandler);
        socket.off("connect", onConnect);
      }
    };
  }, [socket, event, wrappedHandler]);

  const addPendingEvent = useCallback((data: T) => {
    pendingEvents.current.push(data);
  }, []);

  return { addPendingEvent };
}
