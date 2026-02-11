// src/api/dashboard.ts
import api from "./axios";
import type { Order } from "../interfaces/OrderInterfaces";
import { mapApiOrderToOrder } from "./orders";

// 🔧 Obtener órdenes del dashboard (paginadas) - /dashboard/orders
export const getDashboardOrdersRequest = async (filters?: {
  estado?: string;
  search?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
  tecnicoId?: number;
  clienteId?: number;
}): Promise<{
  services: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const params = new URLSearchParams();
  if (filters?.estado) params.append("estado", filters.estado);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.startDate) params.append("fecha_inicio", filters.startDate);
  if (filters?.endDate) params.append("fecha_fin", filters.endDate);
  if (filters?.page) params.append("page", (filters.page || 1).toString());
  if (filters?.limit) params.append("limit", (filters.limit || 20).toString());
  if (filters?.tecnicoId)
    params.append("tecnicoId", filters.tecnicoId.toString());
  if (filters?.clienteId)
    params.append("clienteId", filters.clienteId.toString());

  const url = `/dashboard/orders${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await api.get(url);

  const backendData = response.data?.data || {};

  let services = backendData?.services || response.data?.services || [];
  const total = backendData?.total || response.data?.total || 0;
  const page = backendData?.page || response.data?.page || 1;
  const limit = backendData?.limit || response.data?.limit || 20;
  const totalPages = backendData?.totalPages || response.data?.totalPages || 1;

  const mappedServices = Array.isArray(services)
    ? services.map(mapApiOrderToOrder)
    : [];

  return {
    services: mappedServices,
    total,
    page,
    limit,
    totalPages,
  };
};

// 🔧 Obtener "mis servicios" según rol - /dashboard/mis-servicios
// Mantengo firma compatible con tu hook actual (userRole, userId) aunque
// el backend ahora no los use en query (usa req.user).
export const getMyServicesRequest = async (filters: {
  userRole: string;  // se ignora en backend
  userId: number;    // se ignora en backend
  estado?: string;
  search?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
}): Promise<{
  services: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const params = new URLSearchParams();
  if (filters?.estado) params.append("estado", filters.estado);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.startDate) params.append("fecha_inicio", filters.startDate);
  if (filters?.endDate) params.append("fecha_fin", filters.endDate);
  if (filters?.page) params.append("page", (filters.page || 1).toString());
  if (filters?.limit) params.append("limit", (filters.limit || 20).toString());

  const url = `/dashboard/mis-servicios${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await api.get(url);

  const backendData = response.data?.data || {};

  let services = backendData?.services || response.data?.services || [];
  const total = backendData?.total || response.data?.total || 0;
  const page = backendData?.page || response.data?.page || 1;
  const limit = backendData?.limit || response.data?.limit || 20;
  const totalPages = backendData?.totalPages || response.data?.totalPages || 1;

  const mappedServices = Array.isArray(services)
    ? services.map(mapApiOrderToOrder)
    : [];

  return {
    services: mappedServices,
    total,
    page,
    limit,
    totalPages,
  };
};

// 🔧 Métricas del dashboard - /dashboard/metricas
export const getDashboardMetricsRequest = async (): Promise<any> => {
  const response = await api.get("/dashboard/metricas");
  return response.data;
};