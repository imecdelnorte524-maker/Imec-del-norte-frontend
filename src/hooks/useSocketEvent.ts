// hooks/useSocketEvent.ts
import { useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";

/**
 * Suscribe un handler a un evento de socket y lo desuscribe automáticamente.
 * Incluye manejo mejorado para cuando el socket no está conectado inmediatamente.
 */
export function useSocketEvent<T = any>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
  debug: boolean = false,
) {
  const handlerRef = useRef(handler);
  const isMounted = useRef(true);
  const pendingEvents = useRef<T[]>([]); // Para eventos que llegan antes de conectar

  // Actualizar la referencia cuando el handler cambie
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Procesar eventos pendientes cuando el handler cambia
  useEffect(() => {
    if (pendingEvents.current.length > 0) {
      if (debug)
        console.log(
          `📦 Procesando ${pendingEvents.current.length} eventos pendientes para ${event}`,
        );
      pendingEvents.current.forEach((data) => {
        try {
          handlerRef.current(data);
        } catch (error) {
          console.error(`Error en handler pendiente para ${event}:`, error);
        }
      });
      pendingEvents.current = [];
    }
  }, [handler, event, debug]);

  // Manejador wrapper con logs
  const wrappedHandler = useCallback(
    (data: T) => {
      if (!isMounted.current) return;

      if (debug) {
        console.log(`📡 Evento recibido: ${event}`, data);
      }

      try {
        handlerRef.current(data);
      } catch (error) {
        console.error(`Error en handler para evento ${event}:`, error);
      }
    },
    [event, debug],
  );

  useEffect(() => {
    isMounted.current = true;

    if (!socket) {
      if (debug)
        console.log(
          `⚠️ Socket no disponible para evento ${event}, guardando en cola...`,
        );
      return;
    }

    // Función para manejar cuando el socket se conecta
    const onConnect = () => {
      if (debug)
        console.log(`🔌 Socket conectado, registrando evento ${event}`);

      // Registrar el evento después de conectar
      socket.on(event, wrappedHandler);

      // Si hay eventos pendientes, podríamos solicitarlos
      if (pendingEvents.current.length > 0 && debug) {
        console.log(
          `📋 Hay ${pendingEvents.current.length} eventos pendientes para ${event}`,
        );
      }
    };

    // Si el socket ya está conectado, registrar inmediatamente
    if (socket.connected) {
      if (debug)
        console.log(`🔌 Socket ya conectado, registrando evento ${event}`);
      socket.on(event, wrappedHandler);
    } else {
      // Si no está conectado, esperar a que conecte
      if (debug)
        console.log(
          `⏳ Socket conectándose, evento ${event} se registrará al conectar`,
        );
      socket.on("connect", onConnect);
    }

    // Cleanup
    return () => {
      isMounted.current = false;

      if (socket) {
        socket.off(event, wrappedHandler);
        socket.off("connect", onConnect);
      }

      if (debug) console.log(`🧹 Cleanup: evento ${event} desregistrado`);
    };
  }, [socket, event, wrappedHandler, debug]);

  // Método para agregar eventos manualmente (útil para respuestas HTTP)
  const addPendingEvent = useCallback(
    (data: T) => {
      if (debug)
        console.log(`📥 Agregando evento pendiente para ${event}:`, data);
      pendingEvents.current.push(data);
    },
    [event, debug],
  );

  return { addPendingEvent };
}
