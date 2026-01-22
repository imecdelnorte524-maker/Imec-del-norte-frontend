// src/hooks/useEquipmentList.ts
import { useState, useCallback } from "react";
import { getEquipmentByClientRequest, getEquipmentRequest } from "../api/equipment";
import type { Equipment } from "../interfaces/EquipmentInterfaces";

export function useEquipmentList(clientId?: number) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEquipments = useCallback(async (search?: string) => {
    if (!clientId) {
      setEquipments([]);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getEquipmentByClientRequest(clientId, search);
      setEquipments(data);
      setError(null);
    } catch (err: any) {
      console.error("Error cargando equipos:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error al cargar los equipos"
      );
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadEquipmentWithFilters = useCallback(async (filters?: {
    clientId?: number;
    areaId?: number;
    subAreaId?: number;
    search?: string;
  }) => {
    try {
      setLoading(true);
      const data = await getEquipmentRequest(filters);
      setEquipments(data);
      setError(null);
    } catch (err: any) {
      console.error("Error cargando equipos:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error al cargar los equipos"
      );
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = () => {
    if (clientId) {
      loadEquipments();
    }
  };

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