// src/utils/sounds.ts

let errorAudio: HTMLAudioElement | null = null;
let lastErrorPlayAt = 0;
const MIN_ERROR_INTERVAL = 400; // ms, para no sonar 20 veces seguidas

export function playErrorSound() {
  try {
    const now = Date.now();
    if (now - lastErrorPlayAt < MIN_ERROR_INTERVAL) {
      return;
    }
    lastErrorPlayAt = now;

    if (!errorAudio) {
      errorAudio = new Audio('/sounds/error.mp3');
    } else {
      errorAudio.currentTime = 0;
    }

    errorAudio
      .play()
      .catch(() => {
        // Si el navegador bloquea el autoplay, simplemente no sonará.
      });
  } catch {
    // no romper la app por un fallo de audio
  }
}