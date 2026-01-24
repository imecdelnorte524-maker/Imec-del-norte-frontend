// src/api/maintenance.ts
import api from "./axios";
import type { MaintenanceType } from "../interfaces/OrderInterfaces";

export const getMaintenanceTypesRequest = async (): Promise<MaintenanceType[]> => {
  const response = await api.get("/maintenance-types");
  // El backend devuelve un array directo
  return response.data; 
};