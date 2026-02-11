// src/hooks/useEquipmentList.ts
import { useState, useCallback } from "react";
import {
  getEquipmentByClientRequest,
  getEquipmentRequest,
} from "../api/equipment";
import type { Equipment } from "../interfaces/EquipmentInterfaces";
import { useSocket } from "../context/SocketContext"; // <-- NUEVO
import { useSocketEvent } from "./useSocketEvent"; // <-- NUEVO

type EquipmentFilters = {
  clientId?: number;
  areaId?: number;
  subAreaId?: number;
  search?: string;
};

export function useEquipmentList(clientId?: number) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<EquipmentFilters | undefined>( // <-- NUEVO
    undefined,
  );
  const socket = useSocket(); // <-- NUEVO

  const loadEquipments = useCallback(
    async (search?: string) => {
      if (!clientId) {
        setEquipments([]);
        return;
      }

      try {
        setLoading(true);
        const data = await getEquipmentByClientRequest(clientId, search);
        setEquipments(data);
        setError(null);
        setLastFilters(undefined); // <-- NUEVO: recordamos que estamos en modo por cliente
      } catch (err: any) {
        console.error("Error cargando equipos:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al cargar los equipos",
        );
        setEquipments([]);
      } finally {
        setLoading(false);
      }
    },
    [clientId],
  );

  const loadEquipmentWithFilters = useCallback(
    async (filters?: EquipmentFilters) => {
      try {
        setLoading(true);
        const data = await getEquipmentRequest(filters);
        setEquipments(data);
        setError(null);
        setLastFilters(filters); // <-- NUEVO: recordamos último filtro
      } catch (err: any) {
        console.error("Error cargando equipos:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al cargar los equipos",
        );
        setEquipments([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refresh = () => {
    if (lastFilters) {
      loadEquipmentWithFilters(lastFilters);
    } else if (clientId) {
      loadEquipments();
    }
  };

  // 🔴 Tiempo real: ante cambios de equipos, refrescar
  useSocketEvent(socket, "equipment.created", () => {
    refresh();
  });
  useSocketEvent(socket, "equipment.updated", () => {
    refresh();
  });
  useSocketEvent(socket, "equipment.deleted", () => {
    refresh();
  });
  useSocketEvent(socket, "equipment.statusUpdated", () => {
    refresh();
  });
  useSocketEvent(socket, "equipment.maintenancePlanUpdated", () => {
    refresh();
  });

  return {
    equipments,
    loading,
    error,
    setError,
    loadEquipments,
    loadEquipmentWithFilters,
    refresh,
  };
}
