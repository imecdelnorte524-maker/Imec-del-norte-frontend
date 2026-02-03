import { useState, useEffect, useCallback } from "react";
import {
  getEquipmentByIdRequest,
  updateEquipmentRequest,
} from "../api/equipment";
import type { Equipment, UpdateEquipmentData } from "../interfaces/EquipmentInterfaces";

export function useEquipmentDetail(equipmentId: number | null) {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    if (!equipmentId) {
      setEquipment(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await getEquipmentByIdRequest(equipmentId);
      setEquipment(data);
      setError(null);
    } catch (err: any) {
      console.error("Error cargando equipo:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error al cargar el equipo"
      );
      setEquipment(null);
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const updateEquipment = async (
    updateData: UpdateEquipmentData
  ): Promise<boolean> => {
    if (!equipmentId || !equipment) return false;
    
    setSaving(true);
    setError(null);
    
    try {
      const updated = await updateEquipmentRequest(equipmentId, updateData);
      setEquipment(updated);
      return true;
    } catch (err: any) {
      console.error("Error actualizando equipo:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error al actualizar el equipo"
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateBasicInfo = async (data: {
    areaId?: number | null;
    subAreaId?: number | null;
    status?: string;
    installationDate?: string | null;
    notes?: string | null;
  }): Promise<boolean> => {
    return updateEquipment(data);
  };

  const updateComponents = async (data: {
    evaporators?: any[];
    condensers?: any[];
    planMantenimiento?: any | null;
  }): Promise<boolean> => {
    return updateEquipment(data);
  };

  const updateACType = async (airConditionerTypeId: number | null): Promise<boolean> => {
    return updateEquipment({ airConditionerTypeId });
  };

  return {
    equipment,
    loading,
    saving,
    error,
    setError,
    reload: loadEquipment,
    updateEquipment,
    updateBasicInfo,
    updateComponents,
    updateACType,
    setEquipment,
  };
}