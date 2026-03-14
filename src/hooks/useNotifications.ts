// src/hooks/useNotifications.ts - VERSIÓN QUE SUENA CON TODO
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useSocketEvent } from "./useSocketEvent";
import axios from "axios";
import type { Notification } from "../interfaces/NotificationInterfaces";
import { playNotificationSound } from "../utils/sounds";

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
  const socket = useSocket();

  // Cargar notificaciones iniciales
  useEffect(() => {
    if (!token || !httpBaseUrl) return;

    axios
      .get<Notification[]>(`${httpBaseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n) => !n.leida).length);
      })
      .catch((err) => console.error("Error cargando notificaciones", err));
  }, [token, httpBaseUrl]);

  // 👇🏻 VERSIÓN DEBUG - Reproduce sonido con CADA evento de socket
  useSocketEvent<any>(socket, "entity.updated", (data) => {
    playNotificationSound(); // 🔈 SUENA CON TODO

    if (data.entity === "notification") {
      const notif = data.data as Notification;
      setNotifications((prev) => [notif, ...prev]);
      if (!notif.leida) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  });

  // 👇🏻 También con cada notification directa
  useSocketEvent<Notification>(socket, "notification", (notif) => {
    playNotificationSound(); // 🔈 SUENA CON TODO

    setNotifications((prev) => [notif, ...prev]);
    if (!notif.leida) {
      setUnreadCount((prev) => prev + 1);
    }
  });

  // 👇🏻 Y con cada workOrder.updated (por si acaso)
  useSocketEvent<any>(socket, "workOrders.updated", () => {
    playNotificationSound();
  });

  useSocketEvent<any>(socket, "workOrders.statusUpdated", () => {
    playNotificationSound();
  });

  useSocketEvent<any>(socket, "workOrders.assigned", () => {
    playNotificationSound();
  });

  // Escuchar unread-count
  useSocketEvent<{ total: number }>(socket, "unread-count", (data) => {
    setUnreadCount(data.total);
  });

  const markAsRead = async (id: number) => {
    if (!token || !httpBaseUrl) return;

    try {
      await axios.patch(
        `${httpBaseUrl}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotifications((prev) =>
        prev.map((n) => (n.notificacionId === id ? { ...n, leida: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!token || !httpBaseUrl) return;

    try {
      await axios.patch(
        `${httpBaseUrl}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
