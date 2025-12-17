import { useState, useEffect } from 'react';
import { 
  getServicesMetricsRequest, 
  getServicesRequest, 
  getMyServicesRequest 
} from '../api/services';
import type { MetricsResponse, ServiceFromAPI, ServicesResponse } from '../interfaces/ServicesInterface';

// Hook para métricas del dashboard
export const useServicesMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getServicesMetricsRequest();
        setMetrics(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar las métricas');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  return { metrics, loading, error };
};

// Hook para servicios (admin) - CORREGIDO
export const useServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const [services, setServices] = useState<ServiceFromAPI[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: ServicesResponse = await getServicesRequest(filters);
        setServices(response.services);
        setPagination({
          total: response.total,
          page: response.page || 1,
          limit: response.limit || 10,
          totalPages: response.totalPages || Math.ceil(response.total / (response.limit || 10))
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar los servicios');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [filters]);

  return { services, pagination, loading, error };
};

// Hook para mis servicios (técnico) - CORREGIDO
export const useMyServices = (filters?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const [services, setServices] = useState<ServiceFromAPI[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMyServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: ServicesResponse = await getMyServicesRequest(filters);
        setServices(response.services);
        setPagination({
          total: response.total,
          page: response.page || 1,
          limit: response.limit || 10,
          totalPages: response.totalPages || Math.ceil(response.total / (response.limit || 10))
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar mis servicios');
      } finally {
        setLoading(false);
      }
    };

    loadMyServices();
  }, [filters]);

  return { services, pagination, loading, error };
};

// Hook para acciones de servicios
// export const useServiceActions = () => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const updateServiceStatus = async (orderId: number, status: string) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       // Aquí iría la llamada a la API para actualizar el estado
//       // await updateServiceStatusRequest(orderId, status);
//       return true;
//     } catch (err: any) {
//       setError(err.response?.data?.error || 'Error al actualizar el servicio');
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const assignTechnician = async (orderId: number, technicianId: number) => {
//     setLoading(true);
//     setError(null);
    
//     try {
//       // Aquí iría la llamada a la API para asignar técnico
//       // await assignTechnicianRequest(orderId, technicianId);
//       return true;
//     } catch (err: any) {
//       setError(err.response?.data?.error || 'Error al asignar técnico');
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     updateServiceStatus,
//     assignTechnician,
//     loading,
//     error
//   };
// };