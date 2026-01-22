// src/hooks/useCreateEquipment.ts
import { useState } from "react";
import { createEquipmentRequest } from "../api/equipment";
import type { CreateEquipmentData, Equipment } from "../interfaces/EquipmentInterfaces";

export function useCreateEquipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEquipment, setCreatedEquipment] = useState<Equipment | null>(null);

  const createEquipment = async (data: CreateEquipmentData): Promise<Equipment | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const equipment = await createEquipmentRequest(data);
      setCreatedEquipment(equipment);
      
      return equipment;
    } catch (err: any) {
      console.error("Error creando equipo:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Error al crear el equipo"
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCreatedEquipment(null);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    error,
    createdEquipment,
    createEquipment,
    reset,
  };
}