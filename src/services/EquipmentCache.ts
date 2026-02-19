// src/services/EquipmentCache.ts
import type { Equipment } from "../interfaces/EquipmentInterfaces";

interface CacheEntry {
  data: Equipment[];
  timestamp: number;
  clientId: number;
}

class EquipmentCacheService {
  private cache = new Map<number, CacheEntry>();
  private subscribers = new Set<(clientId: number) => void>();

  // Tiempo de vida del cache: 5 minutos
  private readonly TTL = 5 * 60 * 1000;

  // Obtener datos del cache
  get(clientId: number): Equipment[] | null {
    const entry = this.cache.get(clientId);

    if (!entry) return null;

    // Verificar si el cache aún es válido
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(clientId);
      return null;
    }

    return entry.data;
  }

  // Guardar datos en cache
  set(clientId: number, data: Equipment[]): void {
    this.cache.set(clientId, {
      data,
      timestamp: Date.now(),
      clientId,
    });
  }

  // Invalidar cache de un cliente específico
  invalidate(clientId: number): void {
    this.cache.delete(clientId);
    // Notificar a los suscriptores
    this.subscribers.forEach((callback) => callback(clientId));
  }

  // Invalidar todos los caches
  invalidateAll(): void {
    const clientIds = Array.from(this.cache.keys());
    this.cache.clear();
    clientIds.forEach((clientId) => {
      this.subscribers.forEach((callback) => callback(clientId));
    });
  }

  // Suscribirse a invalidaciones
  subscribe(callback: (clientId: number) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Limpiar cache expirado
  cleanExpired(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([clientId, entry]) => {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(clientId);
      }
    });
  }

  // Obtener estadísticas del cache (útil para debugging)
  getStats(): { size: number; clients: number[] } {
    return {
      size: this.cache.size,
      clients: Array.from(this.cache.keys()),
    };
  }
}

// Singleton global
export const equipmentCache = new EquipmentCacheService();

// Limpiar cache expirado cada minuto
if (typeof window !== "undefined") {
  setInterval(() => {
    equipmentCache.cleanExpired();
  }, 60 * 1000);
}
