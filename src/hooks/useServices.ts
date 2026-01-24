import { useQuery } from "@tanstack/react-query";
import { 
  getServicesMetricsRequest, 
  getServicesRequest, 
  getMyServicesRequest 
} from "../api/services";
import { QUERY_KEYS } from "../api/keys";
import type { MetricsResponse, ServicesResponse } from "../interfaces/ServicesInterface";

// Hook para métricas del dashboard
export const useServicesMetrics = () => {
  const { data, isLoading, error } = useQuery<MetricsResponse, Error>({
    queryKey: [QUERY_KEYS.metrics],
    queryFn: getServicesMetricsRequest,
  });

  return { 
    metrics: data ?? null, 
    loading: isLoading, 
    error: error ? error.message : null 
  };
};

// Hook para servicios (admin)
export const useServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const { data, isLoading, error } = useQuery<ServicesResponse, Error>({
    queryKey: [QUERY_KEYS.services, filters],
    queryFn: () => getServicesRequest(filters),
    // @ts-expect-error: keepPreviousData no está en los tipos pero funciona
    keepPreviousData: true,
  });

  // 👇 Aquí el truco
  const safeData = (data ?? {
    services: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  }) as ServicesResponse;

  return {
    services: safeData.services,
    pagination: {
      total: safeData.total,
      page: safeData.page,
      limit: safeData.limit,
      totalPages: safeData.totalPages
    },
    loading: isLoading,
    error: error ? error.message : null,
  };
};

// Hook para mis servicios (técnico)
export const useMyServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data, isLoading, error } = useQuery<ServicesResponse, Error>({
    queryKey: [QUERY_KEYS.myServices, filters],
    queryFn: () => getMyServicesRequest(filters),
    // @ts-expect-error: keepPreviousData no está en los tipos pero funciona
    keepPreviousData: true,
  });

  const safeData = (data ?? {
    services: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  }) as ServicesResponse;

  return {
    services: safeData.services,
    pagination: {
      total: safeData.total,
      page: safeData.page,
      limit: safeData.limit,
      totalPages: safeData.totalPages
    },
    loading: isLoading,
    error: error ? error.message : null,
  };
};