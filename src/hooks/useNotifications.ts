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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socket = useSocket();
  const enableSoundButtonRef = useRef<HTMLButtonElement | null>(null);
  const hasUserInteracted = useRef(false);

  // Detectar interacción del usuario
  useEffect(() => {
    const handleUserInteraction = () => {
      hasUserInteracted.current = true;
      // Intentar habilitar audio automáticamente
      if (audioRef.current && !audioEnabled) {
        audioRef.current
          .play()
          .then(() => {
            setAudioEnabled(true);
            audioRef.current?.pause();
            console.log("🔊 Audio habilitado por interacción del usuario");
          })
          .catch(() => {});
      }
    };

    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });
    window.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [audioEnabled]);

  // Inicializar audio
  useEffect(() => {
    try {
      // Crear múltiples instancias de audio para diferentes formatos
      audioRef.current = new Audio();

      // Intentar con MP3 primero
      audioRef.current.src = "/sounds/notification.mp3";
      audioRef.current.volume = 0.7;
      audioRef.current.load();

      console.log("🔊 Audio de notificación inicializado");

      // Verificar si el audio puede reproducirse
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioEnabled(true);
            audioRef.current?.pause();
            console.log("✅ Audio permitido automáticamente");
          })
          .catch((error) => {
            console.log("🔇 Autoplay bloqueado:", error.message);
            setAudioEnabled(false);
            createEnableSoundButton();
          });
      }
    } catch (error) {
      console.error("❌ Error inicializando audio:", error);
    }

    return () => {
      if (enableSoundButtonRef.current) {
        enableSoundButtonRef.current.remove();
        enableSoundButtonRef.current = null;
      }
    };
  }, []);

  const createEnableSoundButton = useCallback(() => {
    if (enableSoundButtonRef.current) {
      enableSoundButtonRef.current.remove();
    }

    const button = document.createElement("button");
    button.innerText = "🔊 Habilitar notificaciones con sonido";
    button.style.position = "fixed";
    button.style.bottom = "20px";
    button.style.right = "20px";
    button.style.zIndex = "9999";
    button.style.padding = "15px 25px";
    button.style.backgroundColor = "#2563eb";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.fontSize = "16px";
    button.style.fontWeight = "bold";
    button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    button.style.animation = "pulse 2s infinite";

    button.onclick = () => {
      if (audioRef.current) {
        // Intentar con diferentes formatos
        const playSound = () => {
          audioRef.current!.currentTime = 0;
          return audioRef.current!.play();
        };

        playSound()
          .then(() => {
            console.log("🔊 Sonido habilitado por el usuario");
            setAudioEnabled(true);
            audioRef.current?.pause();
            button.remove();
            enableSoundButtonRef.current = null;

            // Mostrar confirmación
            const toast = document.createElement("div");
            toast.innerText = "✅ Notificaciones con sonido activadas";
            toast.style.position = "fixed";
            toast.style.bottom = "80px";
            toast.style.right = "20px";
            toast.style.backgroundColor = "#10b981";
            toast.style.color = "white";
            toast.style.padding = "12px 24px";
            toast.style.borderRadius = "8px";
            toast.style.zIndex = "9999";
            toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 3000);
          })
          .catch((e) => {
            console.error("❌ Error reproduciendo audio:", e);

            // Intentar con formato alternativo
            const audio2 = new Audio("/sounds/notification.wav");
            audio2
              .play()
              .then(() => {
                setAudioEnabled(true);
                button.remove();
              })
              .catch((e2) => {
                console.error("❌ También falló el formato alternativo:", e2);
              });
          });
      }
    };

    document.body.appendChild(button);
    enableSoundButtonRef.current = button;

    setTimeout(() => {
      if (enableSoundButtonRef.current) {
        enableSoundButtonRef.current.remove();
        enableSoundButtonRef.current = null;
      }
    }, 30000);
  }, []);

  const playSound = useCallback(() => {
    if (!audioRef.current) {
      console.warn("⚠️ Audio no disponible");
      return;
    }

    if (!audioEnabled && !hasUserInteracted.current) {
      console.log("🔇 Audio deshabilitado - esperando interacción del usuario");
      if (!enableSoundButtonRef.current) {
        createEnableSoundButton();
      }
      return;
    }

    // Si el audio está habilitado o el usuario ya interactuó, reproducir
    audioRef.current.currentTime = 0;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("🔊 Sonido reproducido");
        })
        .catch((error) => {
          console.log("🔇 No se pudo reproducir:", error.message);
          if (!enableSoundButtonRef.current) {
            createEnableSoundButton();
          }
        });
    }
  }, [audioEnabled, createEnableSoundButton]);

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
        console.log("📋 Notificaciones iniciales cargadas:", res.data.length);
      })
      .catch((err) => {
        console.error("Error cargando notificaciones", err);
      });
  }, [token, httpBaseUrl]);

  // Escuchar entity.updated para notificaciones
  useSocketEvent<any>(socket, "entity.updated", (data) => {
    console.log("📦 entity.updated:", data);

    if (data.entity === "notification") {
      const notif = data.data as Notification;
      console.log("🔔 Notificación recibida:", notif);

      setNotifications((prev) => [notif, ...prev]);
      if (!notif.leida) {
        setUnreadCount((prev) => prev + 1);
        playSound(); // 🎵 Intentar reproducir sonido
      }
    }
  });

  // Escuchar evento específico de notification
  useSocketEvent<Notification>(socket, "notification", (notif) => {
    console.log("🔔 Notificación directa:", notif);
    setNotifications((prev) => [notif, ...prev]);
    if (!notif.leida) {
      setUnreadCount((prev) => prev + 1);
      playSound();
    }
  });

  // Escuchar contador de no leídas
  useSocketEvent<{ total: number }>(socket, "unread-count", (data) => {
    console.log("📊 unread-count:", data);
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

  const enableSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setAudioEnabled(true);
          audioRef.current?.pause();
          console.log("🔊 Sonido habilitado manualmente");

          if (enableSoundButtonRef.current) {
            enableSoundButtonRef.current.remove();
            enableSoundButtonRef.current = null;
          }
        })
        .catch((error) => {
          console.error("❌ Error habilitando sonido:", error);
        });
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    audioEnabled,
    enableSound,
  };
}
