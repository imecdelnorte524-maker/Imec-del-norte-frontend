// src/api/services.ts

import api from "./axios";
import type {
  MetricsResponse,
  ServicesResponse,
} from "../interfaces/ServicesInterface";

// Obtener métricas del dashboard
export const getServicesMetricsRequest = async (): Promise<MetricsResponse> => {
  try {
    const response = await api.get("/dashboard/metricas");
    return response.data.data;
  } catch (error: any) {
    console.error("Error obteniendo métricas:", error);
    throw new Error(error.response?.data?.error || "Error al obtener métricas");
  }
};

// Obtener todas las órdenes (para admin)
export const getServicesRequest = async (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<ServicesResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters?.status) params.append("estado", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.startDate) params.append("fecha_inicio", filters.startDate);
    if (filters?.endDate) params.append("fecha_fin", filters.endDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await api.get(
      `/dashboard/ordenes-servicio?${params.toString()}`,
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error obteniendo servicios:", error);
    throw new Error(
      error.response?.data?.error || "Error al obtener servicios",
    );
  }
};

// Obtener mis servicios (para técnicos)
export const getMyServicesRequest = async (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ServicesResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters?.status) params.append("estado", filters.status);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.startDate) params.append("fecha_inicio", filters.startDate);
    if (filters?.endDate) params.append("fecha_fin", filters.endDate);

    const response = await api.get(
      `/dashboard/mis-servicios?${params.toString()}`,
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error obteniendo mis servicios:", error);
    throw new Error(
      error.response?.data?.error || "Error al obtener mis servicios",
    );
  }
};

export const getServicesByStatusRequest = async (
  status: string,
  limit: number = 5,
): Promise<ServicesResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("estado", status);
    params.append("limit", limit.toString());
    params.append("page", "1");

    const response = await api.get(
      `/dashboard/ordenes-servicio?${params.toString()}`,
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Error obteniendo órdenes por estado:", error);
    throw new Error(
      error.response?.data?.error || "Error al obtener órdenes por estado",
    );
  }
};
