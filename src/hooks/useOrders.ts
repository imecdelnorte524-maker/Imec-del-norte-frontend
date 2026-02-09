import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  getAllOrdersRequest,
  getOrderByIdRequest,
  createOrderRequest,
  updateOrderRequest,
  assignTechniciansRequest,
  unassignTechnicianRequest,
  removeSpecificTechnicianRequest,
  cancelOrderRequest,
  startTimerRequest,
  stopTimerRequest,
  addPauseRequest,
  endPauseRequest,
  getOrdersByClientAndCategoryRequest,
} from "../api/orders";
import {
  getDashboardOrdersRequest,
  getMyServicesRequest,
  getDashboardMetricsRequest,
} from "../api/dashboard";
import { QUERY_KEYS } from "../api/keys";
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
} from "../interfaces/OrderInterfaces";

// ---------------------------------------------------------------------------
// Hook para la LISTA de órdenes del dashboard (admin/secretaria) - /dashboard/orders
// ---------------------------------------------------------------------------
export const useDashboardOrders = (filters?: {
  estado?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  tecnicoId?: number;
  clienteId?: number;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.dashboardOrders, filters],
    queryFn: () => getDashboardOrdersRequest(filters),
  });

  return {
    orders: data?.services || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshOrders: () =>
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      }),
  };
};

// ---------------------------------------------------------------------------
// Hook para mis órdenes (técnico/cliente) usando /work-orders
// (lo puedes usar si quieres una vista “mis órdenes” aparte)
// ---------------------------------------------------------------------------
export const useMyOrders = (filters?: {
  estado?: string; // "Pendiente", "Asignada", "En Proceso", ...
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.orders, "my", filters],
    queryFn: async () => {
      const response = await getAllOrdersRequest(); // GET /work-orders
      let list: Order[] = response.services || [];

      if (filters?.estado) {
        list = list.filter((o) => o.estado === filters.estado);
      }

      return {
        services: list,
        total: list.length,
        page: 1,
        limit: list.length,
        totalPages: 1,
      };
    },
  });

  return {
    orders: data?.services || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || (data?.services?.length || 0),
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshOrders: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] }),
  };
};

// ---------------------------------------------------------------------------
// Hook para MIS SERVICIOS según rol (Técnico/Cliente) - /dashboard/mis-servicios
// ---------------------------------------------------------------------------
export const useMyServices = (filters: {
  userRole: string;
  userId: number;
  estado?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.myServices, filters],
    queryFn: () => getMyServicesRequest(filters),
  });

  return {
    orders: data?.services || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshServices: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] }),
  };
};

// ---------------------------------------------------------------------------
// Hook para MÉTRICAS del dashboard - /dashboard/metricas
// ---------------------------------------------------------------------------
export const useDashboardMetrics = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.dashboardMetrics],
    queryFn: getDashboardMetricsRequest,
    refetchInterval: 30000,
  });

  return {
    metrics: data,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshMetrics: refetch,
  };
};

// ---------------------------------------------------------------------------
// Hook para la LISTA de órdenes en OrdersPage (usa /work-orders para TODOS los roles)
// ---------------------------------------------------------------------------
export const useOrders = (
  userRole: "cliente" | "tecnico" | "admin" | "secretaria",
  filter: "all" | "pending" | "assigned" | "completed" | "cancelled" = "all",
) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.orders, userRole, filter],
    queryFn: async () => {
      const response = await getAllOrdersRequest(); // GET /work-orders
      let list: Order[] = response.services || [];

      const filterMap: Record<
        "pending" | "assigned" | "completed" | "cancelled",
        Order["estado"]
      > = {
        pending: "Pendiente",
        assigned: "Asignada",
        completed: "Completado",
        cancelled: "Cancelada",
      };

      if (filter !== "all") {
        const targetEstado = filterMap[filter];

        if (targetEstado) {
          // Primero filtramos por estado
          list = list.filter((o) => o.estado === targetEstado);

          // Para admin/secretaria, separamos “Pendiente sin técnico” vs “Asignada”
          if (userRole === "admin" || userRole === "secretaria") {
            if (filter === "pending") {
              // Pendiente sin técnicos
              list = list.filter(
                (o) => (o.technicians?.length || 0) === 0,
              );
            }
            if (filter === "assigned") {
              // Asignada con al menos 1 técnico
              list = list.filter(
                (o) => (o.technicians?.length || 0) > 0,
              );
            }
          }
        }
      }

      return {
        services: list,
        total: list.length,
        page: 1,
        limit: list.length,
        totalPages: 1,
      };
    },
  });

  const services = data?.services || [];

  return {
    orders: services,
    total: data?.total || services.length,
    page: data?.page || 1,
    limit: data?.limit || services.length,
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshOrders: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] }),
  };
};

// ---------------------------------------------------------------------------
// Hook para DETALLE de orden - GET /work-orders/:id
// ---------------------------------------------------------------------------
export const useOrderDetail = (orderId: number, initialData?: Order) => {
  const queryClient = useQueryClient();

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.orderDetail, orderId],
    queryFn: () => getOrderByIdRequest(orderId),
    initialData,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  });

  return {
    order: order || initialData,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshOrder: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
    },
  };
};

// ---------------------------------------------------------------------------
// Mutaciones para órdenes (crear/actualizar/asignar/cancelar)
// ---------------------------------------------------------------------------
export const useOrderMutations = () => {
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderData) => createOrderRequest(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
    onError: (error: any) => {
      console.error("Error creando orden:", error);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: number;
      data: UpdateOrderData;
    }) => updateOrderRequest(orderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
    onError: (error: any) => {
      console.error("Error actualizando orden:", error);
    },
  });

  const assignTechnicianMutation = useMutation({
    mutationFn: ({
      orderId,
      technicians,
    }: {
      orderId: number;
      technicians: { tecnicoId: number; isLeader?: boolean }[];
    }) => {
      const technicianIds = technicians.map((t) => t.tecnicoId);
      const leaderTechnicianId =
        technicians.find((t) => t.isLeader)?.tecnicoId ||
        technicians[0]?.tecnicoId;

      return assignTechniciansRequest(orderId, {
        technicianIds,
        leaderTechnicianId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
    onError: (error: any) => {
      console.error("Error asignando técnicos:", error);
    },
  });

  const unassignTechnicianMutation = useMutation({
    mutationFn: ({
      orderId,
      tecnicoId,
    }: {
      orderId: number;
      tecnicoId?: number;
    }) => {
      if (tecnicoId) {
        return removeSpecificTechnicianRequest(orderId, tecnicoId);
      } else {
        return unassignTechnicianRequest(orderId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
    onError: (error: any) => {
      console.error("Error desasignando técnico:", error);
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => cancelOrderRequest(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
    onError: (error: any) => {
      console.error("Error cancelando orden:", error);
    },
  });

  return {
    createOrder: createOrderMutation,
    updateOrder: updateOrderMutation,
    assignTechnician: assignTechnicianMutation,
    unassignTechnician: unassignTechnicianMutation,
    cancelOrder: cancelOrderMutation,
  };
};

// ---------------------------------------------------------------------------
// Mutaciones para timers y pausas
// ---------------------------------------------------------------------------
export const useOrderTimerMutations = (orderId: number) => {
  const queryClient = useQueryClient();

  const startTimerMutation = useMutation({
    mutationFn: () => startTimerRequest(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
    },
    onError: (error: any) => {
      console.error("Error iniciando timer:", error);
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => stopTimerRequest(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
    },
    onError: (error: any) => {
      console.error("Error deteniendo timer:", error);
    },
  });

  const addPauseMutation = useMutation({
    mutationFn: (payload: { observacion: string; userId: number }) =>
      addPauseRequest(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
    },
    onError: (error: any) => {
      console.error("Error agregando pausa:", error);
    },
  });

  const endPauseMutation = useMutation({
    mutationFn: () => endPauseRequest(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.dashboardOrders],
      });
    },
    onError: (error: any) => {
      console.error("Error finalizando pausa:", error);
    },
  });

  return {
    startTimer: startTimerMutation,
    stopTimer: stopTimerMutation,
    addPause: addPauseMutation,
    endPause: endPauseMutation,
  };
};

// ---------------------------------------------------------------------------
// Hook para cargar órdenes por cliente/categoría (usado en otras vistas)
// ---------------------------------------------------------------------------
interface OrdersCache {
  [key: string]: {
    orders: Order[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useOrderLoader() {
  const [ordersCache, setOrdersCache] = useState<OrdersCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (clientId: number, category: string): Promise<Order[]> => {
      const cacheKey = `${clientId}-${category}`;
      const now = Date.now();

      const cachedData = ordersCache[cacheKey];
      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setError(null);
        return cachedData.orders;
      }

      setLoading(true);
      setError(null);

      try {
        const orders = await getOrdersByClientAndCategoryRequest(
          clientId,
          category,
        );

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
      setOrdersCache((prev) => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
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