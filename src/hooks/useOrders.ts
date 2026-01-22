import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllOrdersRequest, getOrderByIdRequest } from "../api/orders"; // <--- Asegúrate de importar getOrderByIdRequest
import { QUERY_KEYS } from "../api/keys";
import type { Order } from "../interfaces/OrderInterfaces";

// Hook para la LISTA de órdenes
export const useOrders = (
  userRole: "cliente" | "tecnico" | "admin",
  filter?: string
) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.orders, userRole, filter],
    queryFn: async () => {
      const response = await getAllOrdersRequest();

      if (userRole === "admin" && filter && filter !== "all") {
        const filterMap: Record<string, string> = {
          pending: "Pendiente",
          assigned: "Asignada",
          completed: "Completado",
          cancelled: "Cancelada",
        };

        const targetEstado = filterMap[filter];
        if (targetEstado) {
          let filtered = response.filter((o) => o.estado === targetEstado);
          
          if (filter === "pending") filtered = filtered.filter((o) => !o.tecnico_id);
          if (filter === "assigned") filtered = filtered.filter((o) => o.tecnico_id);
          
          return filtered;
        }
      }
      return response;
    },
  });

  return { 
    orders, 
    loading: isLoading, 
    error: error ? (error as Error).message : null,
    refreshOrders: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] })
  };
};

// --- NUEVO HOOK ESPECÍFICO PARA DETALLE ---
export const useOrderDetail = (orderId: number, initialData?: Order) => {
  const queryClient = useQueryClient();

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["orderDetail", orderId], // Clave única por orden
    queryFn: () => getOrderByIdRequest(orderId),
    initialData: initialData, // Muestra datos inmediatos mientras carga
    
    // AQUÍ ESTÁ LA MAGIA DEL "TIEMPO REAL" (POLLING)
    // Consulta al servidor cada 4 segundos si hay cambios (sin sockets)
    refetchInterval: 4000, 
    refetchIntervalInBackground: true, // Sigue actualizando si cambias de pestaña
  });

  return {
    order: order || initialData, // Fallback a datos iniciales si no ha cargado
    loading: isLoading,
    error: error ? (error as Error).message : null,
    // Esta función la llamaremos después de añadir/quitar insumos para actualizar YA
    refreshOrder: async () => {
      await refetch();
      // Opcional: Actualizar también la lista general para que los estados coincidan
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
    }
  };
};