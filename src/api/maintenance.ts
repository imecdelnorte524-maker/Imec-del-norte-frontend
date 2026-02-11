// src/api/maintenance.ts
import api from "./axios";
import type { MaintenanceType } from "../interfaces/OrderInterfaces";

export const getMaintenanceTypesRequest = async (): Promise<MaintenanceType[]> => {
  const response = await api.get("/maintenance-types");
  // El backend devuelve un array directo
  return response.data;
};

export const createMaintenanceTypeRequest = async (data: {
  nombre: string;
  descripcion?: string;
}): Promise<MaintenanceType> => {
  const response = await api.post("/maintenance-types", data);

  // Si tu backend devuelve el objeto directo:
  //   return response.data;
  //
  // Si en algún momento lo cambias a { data: objeto }, esto sigue funcionando
  return (response.data?.data ?? response.data) as MaintenanceType;
};