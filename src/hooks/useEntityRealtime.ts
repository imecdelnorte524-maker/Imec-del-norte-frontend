// src/hooks/useEntityRealtime.ts
import { useSocket } from "../context/SocketContext";
import { useSocketEvent } from "./useSocketEvent";
import { useQueryClient } from "@tanstack/react-query";

// MAPEO ÚNICO - TODAS las entidades en un solo lugar
const entityConfig = {
  workOrders: {
    queryKey: "workOrders",
    detailKey: "orderDetail", // 👈 KEY ESPECÍFICA PARA DETALLE
    hasDetail: true,
  },
  equipment: { queryKey: "equipment", hasDetail: true },
  clients: { queryKey: "clients", hasDetail: true },
  inventory: { queryKey: "inventory", hasDetail: true },
  users: { queryKey: "users", hasDetail: true },
  supplies: { queryKey: "supplies", hasDetail: true },
  tools: { queryKey: "tools", hasDetail: true },
  areas: { queryKey: "areas", hasDetail: true },
  subAreas: { queryKey: "subAreas", hasDetail: true },
  notifications: { queryKey: "notifications", hasDetail: false },
} as const;

type EntityType = keyof typeof entityConfig;

export function useRealtime() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useSocketEvent<any>(socket, "entity.updated", (data) => {
    const { entity, data: payload } = data;

    if (!(entity in entityConfig)) {
      console.warn(`⚠️ Entidad no configurada: ${entity}`);
      return;
    }

    const config = entityConfig[entity as EntityType];

    // 🔥 CORRECCIÓN 1: Invalidación MÚLTIPLE para workOrders
    if (entity === "workOrders") {
      // Invalidar lista principal
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });

      // Invalidar detalle si hay ID
      const orderId = payload?.ordenId;
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["orderDetail", orderId] });

        // También invalidar cualquier otra variante
        queryClient.invalidateQueries({ queryKey: ["workOrders", orderId] });
      }
    } else {
      // Para otras entidades
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });

      let entityId = payload?.id || payload?.ordenId || payload?.equipmentId;
      if (config.hasDetail && entityId) {
        queryClient.invalidateQueries({
          queryKey: [config.queryKey, entityId],
        });
      }
    }
  });

  useSocketEvent<any>(socket, "entity.detail.updated", (data) => {
    const { entity, entityId } = data;

    if (!(entity in entityConfig)) return;

    const config = entityConfig[entity as EntityType];

    if (entity === "workOrders") {
      queryClient.invalidateQueries({ queryKey: ["orderDetail", entityId] });
      queryClient.invalidateQueries({ queryKey: ["workOrders", entityId] });
    } else if (config.hasDetail) {
      queryClient.invalidateQueries({ queryKey: [config.queryKey, entityId] });
    }
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });
  });

  return socket;
}
