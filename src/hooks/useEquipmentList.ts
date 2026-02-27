// src/hooks/useEquipmentList.ts
import { useState, useCallback, useEffect, useRef } from "react";
import {
  getEquipmentByClientRequest,
  getEquipmentRequest,
} from "../api/equipment";
import type { Equipment } from "../interfaces/EquipmentInterfaces";
import { useSocket } from "../context/SocketContext";
import { useSocketEvent } from "./useSocketEvent";
import { equipmentCache } from "../services/EquipmentCache";

type EquipmentFilters = {
  clientId?: number;
  areaId?: number;
  subAreaId?: number;
  search?: string;
};

export function useEquipmentList(clientId?: number) {
  const instanceId = useRef(
    `equipment-list-${Math.random().toString(36).substr(2, 9)}`,
  ).current;

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<EquipmentFilters | undefined>(
    undefined,
  );
  const [currentSearch, setCurrentSearch] = useState<string>("");

  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const currentClientIdRef = useRef(clientId);

  useEffect(() => {
    currentClientIdRef.current = clientId;
  }, [clientId]);

  const socket = useSocket();

  // Suscribirse a invalidaciones del cache
  useEffect(() => {
    if (!clientId) {
      return;
    }

    const unsubscribe = equipmentCache.subscribe((invalidatedClientId) => {
      if (invalidatedClientId === clientId && mountedRef.current) {
        loadEquipments(currentSearch);
      }
    });

    return unsubscribe;
  }, [clientId, instanceId]);

  const loadEquipments = useCallback(
    async (search?: string) => {
      setCurrentSearch(search || "");

      if (!clientId) {
        setEquipments([]);
        return;
      }

      if (loadingRef.current) {
        return;
      }

      // Verificar cache solo si no hay búsqueda
      const cached = equipmentCache.get(clientId);
      if (cached && !search) {
        setEquipments(cached);
        setError(null);
        setLastFilters(undefined);
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        const data = await getEquipmentByClientRequest(clientId, search);

        if (mountedRef.current) {
          setEquipments(data);
          setError(null);
          setLastFilters(undefined);

          // Guardar en cache solo si no es búsqueda
          if (!search) {
            equipmentCache.set(clientId, data);
          }
        }
      } catch (err: any) {
        console.error(`❌ [${instanceId}] Error cargando equipos:`, err);
        if (mountedRef.current) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Error al cargar los equipos",
          );
          setEquipments([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        loadingRef.current = false;
      }
    },
    [clientId, instanceId],
  );

  const loadMyEquipments = useCallback(async () => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      const data = await getEquipmentRequest();

      if (mountedRef.current) {
        setEquipments(data);
        setError(null);
        setLastFilters(undefined);
      }
    } catch (err: any) {
      console.error(`❌ [${instanceId}] Error cargando mis equipos:`, err);
      if (mountedRef.current) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error al cargar los equipos",
        );
        setEquipments([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [instanceId]);

  const loadEquipmentWithFilters = useCallback(
    async (filters?: EquipmentFilters) => {
      try {
        loadingRef.current = true;
        setLoading(true);
        const data = await getEquipmentRequest(filters);

        if (mountedRef.current) {
          setEquipments(data);
          setError(null);
          setLastFilters(filters);
        }
      } catch (err: any) {
        console.error(
          `❌ [${instanceId}] Error cargando equipos con filtros:`,
          err,
        );
        if (mountedRef.current) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Error al cargar los equipos",
          );
          setEquipments([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        loadingRef.current = false;
      }
    },
    [instanceId],
  );

  const refresh = useCallback(() => {
    if (!clientId) {
      loadMyEquipments();
    } else if (lastFilters) {
      loadEquipmentWithFilters(lastFilters);
    } else {
      equipmentCache.invalidate(clientId);
      loadEquipments(currentSearch);
    }
  }, [
    clientId,
    lastFilters,
    currentSearch,
    loadEquipments,
    loadEquipmentWithFilters,
    loadMyEquipments,
    instanceId,
  ]);

  // Eventos de socket
  useSocketEvent(socket, "equipment.created", (data: any) => {
    if (!clientId) return;
    if (data?.clientId === clientId) {
      equipmentCache.invalidate(clientId);
    }
  });

  useSocketEvent(socket, "equipment.updated", (data: any) => {
    if (!clientId) return;
    if (data?.clientId === clientId) {
      equipmentCache.invalidate(clientId);
    }
  });

  useSocketEvent(socket, "equipment.deleted", (data: any) => {
    if (!clientId) return;
    if (data?.clientId === clientId) {
      equipmentCache.invalidate(clientId);
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [instanceId]);

  return {
    equipments,
    loading,
    error,
    setError,
    loadEquipments,
    loadMyEquipments,
    loadEquipmentWithFilters,
    refresh,
    invalidateCache: useCallback(
      (targetClientId?: number) => {
        const idToInvalidate = targetClientId || clientId;
        if (idToInvalidate) {
          equipmentCache.invalidate(idToInvalidate);
        }
      },
      [clientId, instanceId],
    ),
  };
}
