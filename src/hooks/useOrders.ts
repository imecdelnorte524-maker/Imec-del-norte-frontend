import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  getAllOrdersRequest,
  getAllOrdersForTechniciansRequest,
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
  rateTechniciansRequest,
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
import { useSocket } from "../context/SocketContext";
import { useSocketEvent } from "./useSocketEvent";

// ---------------------------------------------------------------------------
// Helper global de tiempo real para órdenes - 🔥 CORREGIDO
// ---------------------------------------------------------------------------
function useWorkOrdersRealtime() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
  };

  const invalidateMetrics = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardMetrics] });
  };

  const invalidateDetails = (orderId?: number) => {
    if (orderId) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
    } else {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orderDetail] });
    }
  };

  // 🔥 ESCUCHAR entity.updated (el evento que emite tu backend)
  useSocketEvent<any>(socket, "entity.updated", (data) => {
    const { entity, data: payload } = data;

    if (entity === "workOrders") {
      invalidateLists();
      invalidateMetrics();

      // Si hay ID específico, invalidar detalle
      const orderId = payload?.ordenId || payload?.id;
      if (orderId) {
        invalidateDetails(orderId);
      } else {
        invalidateDetails();
      }
    }
  });

  // 🔥 ESCUCHAR entity.detail.updated (para detalles específicos)
  useSocketEvent<any>(socket, "entity.detail.updated", (data) => {
    const { entity, entityId } = data;

    if (entity === "workOrders") {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, entityId],
      });
    }
  });
}

// ---------------------------------------------------------------------------
// LISTA de órdenes del dashboard (/dashboard/orders)
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
  useWorkOrdersRealtime();

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] }),
  };
};

// ---------------------------------------------------------------------------
// MIS ÓRDENES (técnico/cliente) usando /work-orders
// ---------------------------------------------------------------------------
export const useMyOrders = (filters?: { estado?: string }) => {
  const queryClient = useQueryClient();
  useWorkOrdersRealtime();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.orders, "my", filters],
    queryFn: async () => {
      const response = await getAllOrdersRequest();
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
    limit: data?.limit || data?.services?.length || 0,
    totalPages: data?.totalPages || 1,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshOrders: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] }),
  };
};

// ---------------------------------------------------------------------------
// MIS SERVICIOS (/dashboard/mis-servicios)
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
  useWorkOrdersRealtime();

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
// MÉTRICAS dashboard (/dashboard/metricas)
// ---------------------------------------------------------------------------
export const useDashboardMetrics = () => {
  useWorkOrdersRealtime();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEYS.dashboardMetrics],
    queryFn: getDashboardMetricsRequest,
  });

  return {
    metrics: data,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refreshMetrics: refetch,
  };
};

// ---------------------------------------------------------------------------
// LISTA de órdenes en OrdersPage (/work-orders)
// ---------------------------------------------------------------------------
export const useOrders = (
  userRole: "cliente" | "tecnico" | "admin" | "secretaria",
  filter:
    | "all"
    | "pending"
    | "assigned"
    | "in_progress"
    | "pausada"
    | "completed"
    | "cancelled" = "all",
) => {
  const queryClient = useQueryClient();
  useWorkOrdersRealtime();

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.orders, userRole, filter],
    queryFn: async () => {
      let list: Order[] = [];

      // Si es técnico pero queremos todas las órdenes (viene de TechnicianOrdersView con userRole="admin")
      if (userRole === "admin") {
        // Usamos el endpoint especial para obtener TODAS las órdenes
        const response = await getAllOrdersForTechniciansRequest();
        list = Array.isArray(response) ? response : [];
      } else {
        // Comportamiento normal para otros roles
        const response = await getAllOrdersRequest();
        list = response.services || [];
      }

      const filterMap: Record<
        | "pending"
        | "assigned"
        | "in_progress"
        | "pausada"
        | "completed"
        | "cancelled",
        Order["estado"]
      > = {
        pending: "Pendiente",
        assigned: "Asignada",
        in_progress: "En Proceso",
        pausada: "Pausada",
        completed: "Completado",
        cancelled: "Cancelada",
      };

      if (filter !== "all") {
        const targetEstado = filterMap[filter];
        if (targetEstado) {
          list = list.filter((o) => o.estado === targetEstado);
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
// DETALLE de orden
// ---------------------------------------------------------------------------
export const useOrderDetail = (orderId: number, initialData?: Order) => {
  const queryClient = useQueryClient();
  useWorkOrdersRealtime();

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.orderDetail, orderId],
    queryFn: () => getOrderByIdRequest(orderId),
    initialData,
    enabled: !!orderId,
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
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
      }
      return unassignTechnicianRequest(orderId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => cancelOrderRequest(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
  });

  const rateTechniciansMutation = useMutation({
    mutationFn: ({
      orderId,
      ratings,
    }: {
      orderId: number;
      ratings: { technicianId: number; rating: number }[];
    }) => rateTechniciansRequest(orderId, ratings),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboardOrders] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.orderDetail, variables.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.myServices] });
    },
  });

  return {
    createOrder: createOrderMutation,
    updateOrder: updateOrderMutation,
    assignTechnician: assignTechnicianMutation,
    unassignTechnician: unassignTechnicianMutation,
    cancelOrder: cancelOrderMutation,
    rateTechnicians: rateTechniciansMutation,
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
  });

  return {
    startTimer: startTimerMutation,
    stopTimer: stopTimerMutation,
    addPause: addPauseMutation,
    endPause: endPauseMutation,
  };
};

// ---------------------------------------------------------------------------
// Órdenes por cliente/categoría (con cache local)
// ---------------------------------------------------------------------------
interface OrdersCache {
  [key: string]: {
    orders: Order[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000;

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
