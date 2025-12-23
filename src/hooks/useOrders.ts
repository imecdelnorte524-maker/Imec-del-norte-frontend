// src/hooks/useOrders.ts

import { useState, useEffect } from 'react';
import {
  getAllOrdersRequest,
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

        // El backend ya filtra por rol usando el token:
        // - Admin / Secretaria / Supervisor: todas
        // - Técnico: solo sus órdenes
        // - Cliente: solo sus órdenes
        let response: Order[] = await getAllOrdersRequest();

        // Filtros adicionales en frontend (solo admin)
        let filteredOrders = response;
        if (userRole === 'admin') {
          if (filter === 'pending') {
            // Pendientes sin técnico asignado
            filteredOrders = response.filter(
              (order) =>
                order.estado === 'Pendiente' && !order.tecnico_id,
            );
          } else if (filter === 'assigned') {
            // Cualquier orden con técnico asignado
            filteredOrders = response.filter((order) => !!order.tecnico_id);
          }
        }

        setOrders(filteredOrders);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Error al cargar las órdenes';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, filter]);

  return { orders, loading, error };
};