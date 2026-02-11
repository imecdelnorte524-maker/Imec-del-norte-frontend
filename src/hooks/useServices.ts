// src/hooks/useServices.ts (AJUSTAR este archivo)
import { useQuery } from "@tanstack/react-query";
import {
  getServicesMetricsRequest,
  getServicesRequest,
  getMyServicesRequest,
} from "../api/services";
import { QUERY_KEYS } from "../api/keys";
import type {
  MetricsResponse,
  ServicesResponse,
} from "../interfaces/ServicesInterface";
import { useSocket } from "../context/SocketContext"; // <-- NUEVO
import { useSocketEvent } from "./useSocketEvent"; // <-- NUEVO

// Métricas
export const useServicesMetrics = () => {
  const socket = useSocket();
  const { data, isLoading, error, refetch } = useQuery<MetricsResponse, Error>({
    queryKey: [QUERY_KEYS.metrics],
    queryFn: getServicesMetricsRequest,
  });

  // Opcional: refrescar métricas cuando cambien servicios
  useSocketEvent(socket, "services.created", () => refetch());
  useSocketEvent(socket, "services.updated", () => refetch());
  useSocketEvent(socket, "services.deleted", () => refetch());

  return {
    metrics: data ?? null,
    loading: isLoading,
    error: error ? error.message : null,
  };
};

// Servicios
export const useServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const socket = useSocket();
  const { data, isLoading, error, refetch } = useQuery<ServicesResponse, Error>(
    {
      queryKey: [QUERY_KEYS.services, filters],
      queryFn: () => getServicesRequest(filters),
      // @ts-expect-error
      keepPreviousData: true,
    },
  );

  // Tiempo real
  useSocketEvent(socket, "services.created", () => refetch());
  useSocketEvent(socket, "services.updated", () => refetch());
  useSocketEvent(socket, "services.deleted", () => refetch());

  const safeData = (data ?? {
    services: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }) as ServicesResponse;

  return {
    services: safeData.services,
    pagination: {
      total: safeData.total,
      page: safeData.page,
      limit: safeData.limit,
      totalPages: safeData.totalPages,
    },
    loading: isLoading,
    error: error ? error.message : null,
  };
};

// Mis servicios (técnico)
export const useMyServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const socket = useSocket();
  const { data, isLoading, error, refetch } = useQuery<ServicesResponse, Error>(
    {
      queryKey: [QUERY_KEYS.myServices, filters],
      queryFn: () => getMyServicesRequest(filters),
      // @ts-expect-error
      keepPreviousData: true,
    },
  );

  // Si quieres que también reaccione a cambios de servicios:
  useSocketEvent(socket, "services.updated", () => refetch());

  const safeData = (data ?? {
    services: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  }) as ServicesResponse;

  return {
    services: safeData.services,
    pagination: {
      total: safeData.total,
      page: safeData.page,
      limit: safeData.limit,
      totalPages: safeData.totalPages,
    },
    loading: isLoading,
    error: error ? error.message : null,
  };
};
