import { useState, useEffect } from 'react';
import {
  getAllOrdersRequest,
  getMyAssignedOrdersRequest,
  getMyClientOrdersRequest,
} from '../api/orders';
import type { Order } from '../interfaces/OrderInterfaces';

export const useOrders = (
  userRole: 'cliente' | 'tecnico' | 'admin',
  filter?: string,
) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        let response: Order[] = [];

        // El backend ya filtra por rol, así que podemos usar un solo endpoint
        switch (userRole) {
          case 'admin':
            response = await getAllOrdersRequest();
            break;
          case 'tecnico':
            response = await getMyAssignedOrdersRequest();
            break;
          case 'cliente':
            response = await getMyClientOrdersRequest();
            break;
          default:
            response = [];
        }

        // Filtros adicionales en frontend (solo admin)
        let filteredOrders = response;
        if (userRole === 'admin') {
          if (filter === 'pending') {
            // Pendientes sin técnico
            filteredOrders = response.filter(
              (order) =>
                order.estado === 'Pendiente' && !order.tecnico_id,
            );
          } else if (filter === 'assigned') {
            // Cualquier orden con técnico asignado
            filteredOrders = response.filter((order) => order.tecnico_id);
          }
        }

        setOrders(filteredOrders);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || 'Error al cargar las órdenes';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, filter]);

  return { orders, loading, error };
};