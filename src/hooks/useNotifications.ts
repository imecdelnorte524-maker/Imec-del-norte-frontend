// src/hooks/useNotifications.ts
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext"; 
import { useSocketEvent } from "./useSocketEvent"; 
import axios from "axios";
import type { Notification } from "../interfaces/NotificationInterfaces";

interface UseNotificationsOptions {
  token: string | null;
  httpBaseUrl: string; 
}

export function useNotifications({
  token,
  httpBaseUrl,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socket = useSocket(); // <-- NUEVO

  // Inicializar audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
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

  // Tiempo real: escuchar evento "notification" desde el socket global
  useSocketEvent<Notification>(socket, "notification", (notif) => {
    setNotifications((prev) => [notif, ...prev]);
    if (!notif.leida) {
      setUnreadCount((prev) => prev + 1);
    }
    playSound();
  });

  const markAsRead = async (id: number) => {
    if (!token || !httpBaseUrl) return;

    await axios.patch(
      `${httpBaseUrl}/notifications/${id}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setNotifications((prev) =>
      prev.map((n) => (n.notificacionId === id ? { ...n, leida: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!token || !httpBaseUrl) return;

    await axios.patch(
      `${httpBaseUrl}/notifications/read-all`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
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
