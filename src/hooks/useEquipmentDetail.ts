// src/hooks/useEquipmentDetail.ts
import { useState, useEffect, useCallback } from "react";
import {
  getEquipmentByIdRequest,
  updateEquipmentRequest,
} from "../api/equipment";
import type { Equipment } from "../interfaces/EquipmentInterfaces";

export function useEquipmentDetail(equipmentId: number | null) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar/recargar datos frescos
  const loadEquipment = useCallback(async () => {
    if (!equipmentId) return;
    try {
      // No ponemos loading=true aquí para evitar parpadeos si es una recarga silenciosa
      // o puedes manejar un estado 'reloading' si prefieres.
      const data = await getEquipmentByIdRequest(equipmentId);
      setEquipment(data);
      setError(null);
    } catch (err: any) {
      console.error("Error cargando equipo:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar el equipo",
      );
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  // Efecto para cargar al inicio
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Función para actualizar y recargar automáticamente
  const updateEquipment = async (payload: any) => {
    if (!equipmentId) return;
    setSaving(true);
    setError(null);
    try {
      // 1. Enviar PATCH
      await updateEquipmentRequest(equipmentId, payload);

      // 2. Recargar datos frescos del backend (GET)
      await loadEquipment();

      return true; // Éxito
    } catch (err: any) {
      console.error("Error actualizando equipo:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al actualizar el equipo",
      );
      return false; // Error
    } finally {
      setSaving(false);
    }
  };

  return {
    equipment,
    loading,
    saving,
    error,
    setError,
    reload: loadEquipment,
    updateEquipment,
    setEquipment, // Por si necesitas actualizar optimísticamente algo local
  };
}