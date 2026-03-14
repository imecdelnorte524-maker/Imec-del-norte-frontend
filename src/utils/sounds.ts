// src/utils/sounds.ts
let audio: HTMLAudioElement | null = null;
let errorAudio: HTMLAudioElement | null = null;
let lastErrorPlayAt = 0;
const MIN_ERROR_INTERVAL = 400;
let isAudioReady = false;

// Crear audio pero mantenerlo suspendido hasta interacción
try {
  audio = new Audio("/sounds/notification.mp3");
  audio.volume = 0.7;
  audio.loop = false;
  audio.preload = "auto";
  audio.load();
} catch (error) {
  console.error("Error inicializando audio:", error);
}

// Esta función SOLO debe llamarse DESPUÉS de un clic del usuario
export function enableAudio() {
  if (!audio || isAudioReady) return;

  // Reproducir y pausar inmediatamente para "desbloquear" el audio
  audio
    .play()
    .then(() => {
      audio!.pause();
      audio!.currentTime = 0;
      isAudioReady = true;
    })
    .catch((err) => {
      console.warn("No se pudo activar audio:", err.message);
    });
}

export function playNotificationSound() {
  if (!audio) {
    console.error("❌ Audio no disponible");
    return;
  }

  if (!isAudioReady) {
    return;
  }

  // Resetear al inicio
  audio.currentTime = 0;

  // Intentar reproducir
  audio
    .play()
    .then(() => {})
    .catch((err) => {
      console.error("❌ Error reproduciendo:", err.message);
      isAudioReady = false; // Intentar reactivar después
    });
}

export function playErrorSound() {
  try {
    const now = Date.now();
    if (now - lastErrorPlayAt < MIN_ERROR_INTERVAL) return;
    lastErrorPlayAt = now;

    if (!errorAudio) {
      errorAudio = new Audio("/sounds/error.mp3");
      errorAudio.volume = 0.7;
      errorAudio.load();
    }

    errorAudio.currentTime = 0;
    errorAudio.play().catch(() => {});
  } catch {}
}
