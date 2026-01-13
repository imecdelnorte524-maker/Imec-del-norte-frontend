import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllOrdersRequest } from "../api/orders";
import { QUERY_KEYS } from "../api/keys";

export const useOrders = (
  userRole: "cliente" | "tecnico" | "admin",
  filter?: string
) => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    // La clave incluye el rol y el filtro, así React Query sabe que son listas distintas
    queryKey: [QUERY_KEYS.orders, userRole, filter],
    queryFn: async () => {
      // 1. Obtenemos TODAS las órdenes del backend (que ya filtra por seguridad/rol)
      const response = await getAllOrdersRequest();

      // 2. Aplicamos filtros de UI (pestañas del frontend)
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
          
          if (filter === "pending") {
            filtered = filtered.filter((o) => !o.tecnico_id);
          }
          if (filter === "assigned") {
            filtered = filtered.filter((o) => o.tecnico_id);
          }
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