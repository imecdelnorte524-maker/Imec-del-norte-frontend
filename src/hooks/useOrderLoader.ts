import { useState, useCallback } from "react";
import type { Order } from "../interfaces/OrderInterfaces";
import { getOrdersByClientAndCategoryRequest } from "../api/orders";

interface OrdersCache {
  [key: string]: {
    orders: Order[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

export function useOrderLoader() {
  const [ordersCache, setOrdersCache] = useState<OrdersCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (clientId: number, category: string): Promise<Order[]> => {
      const cacheKey = `${clientId}-${category}`;
      const now = Date.now();

      // Verificar si tenemos datos en caché y si aún son válidos
      const cachedData = ordersCache[cacheKey];
      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setError(null);
        return cachedData.orders;
      }

      // Si no está en caché o expiró, hacer la llamada
      setLoading(true);
      setError(null);

      try {
        const orders = await getOrdersByClientAndCategoryRequest(
          clientId,
          category,
        );

        // Guardar en caché
        setOrdersCache((prev) => ({
          ...prev,
          [cacheKey]: {
            orders,
            timestamp: now,
          },
        }));

        return orders;
      } catch (err: any) {
        console.error("Error loading orders:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          `Error al cargar órdenes para categoría ${category}`;

        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ordersCache],
  );

  const clearCache = useCallback((key?: string) => {
    if (key) {
      // Limpiar cache específico
      setOrdersCache((prev) => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      // Limpiar todo el cache
      setOrdersCache({});
    }
  }, []);

  return {
    loadOrders,
    loading,
    error,
    clearCache,
    cacheSize: Object.keys(ordersCache).length,
  };
}
