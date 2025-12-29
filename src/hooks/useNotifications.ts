import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";

export interface Notification {
  notificacionId: number;
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  data: any;
  leida: boolean;
  fechaCreacion: string;
}

interface UseNotificationsOptions {
  token: string | null;
  httpBaseUrl: string; // ej: https://.../api
  wsBaseUrl: string;   // ej: https://...  (sin /api)
}

export function useNotifications({
  token,
  httpBaseUrl,
  wsBaseUrl,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .catch(() => {
        // El navegador puede bloquear el autoplay si no hubo interacción previa
      });
  }, []);

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (!token || !httpBaseUrl) return;

    axios
      .get<Notification[]>(`${httpBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.leida).length);
      })
      .catch((err) => {
        console.error("Error cargando notificaciones", err);
      });
  }, [token, httpBaseUrl]);

  // WebSocket
  useEffect(() => {
    if (!token || !wsBaseUrl) return;

    const socket = io(wsBaseUrl, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {});

    socket.on("connect_error", (err) => {
      console.error("[WS] Error de conexión:", err.message);
    });

    socket.on("notification", (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      if (!notif.leida) {
        setUnreadCount((prev) => prev + 1);
      }
      playSound();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, wsBaseUrl, playSound]);

  const markAsRead = async (id: number) => {
    if (!token || !httpBaseUrl) return;

    await axios.patch(
      `${httpBaseUrl}/notifications/${id}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setNotifications((prev) =>
      prev.map((n) =>
        n.notificacionId === id ? { ...n, leida: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!token || !httpBaseUrl) return;

    await axios.patch(
      `${httpBaseUrl}/notifications/read-all`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}