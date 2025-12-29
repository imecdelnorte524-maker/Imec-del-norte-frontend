// src/hooks/useOrders.ts

import { useState, useEffect } from "react";
import { getAllOrdersRequest } from "../api/orders";
import type { Order } from "../interfaces/OrderInterfaces";
import { playErrorSound } from "../utils/sounds";

export const useOrders = (
  userRole: "cliente" | "tecnico" | "admin",
  filter?: string
) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todas las órdenes (el backend filtra por rol)
        let response: Order[] = await getAllOrdersRequest();

        // Aplicar filtros adicionales en frontend
        let filteredOrders = response;

        if (userRole === "admin" && filter && filter !== "all") {
          // Mapear los valores del filtro a los estados reales de las órdenes
          const filterMap: Record<string, string> = {
            pending: "Pendiente",
            assigned: "Asignada",
            completed: "Completado",
            cancelled: "Cancelada",
          };

          const targetEstado = filterMap[filter];

          if (targetEstado) {
            // Filtrar por estado
            filteredOrders = response.filter(
              (order) => order.estado === targetEstado
            );

            // Caso especial para 'pending': también verificar que no tenga técnico
            if (filter === "pending") {
              filteredOrders = filteredOrders.filter(
                (order) => !order.tecnico_id
              );
            }

            // Caso especial para 'assigned': debe tener estado "Asignada" Y tener técnico
            if (filter === "assigned") {
              filteredOrders = filteredOrders.filter(
                (order) => order.tecnico_id
              );
            }
          }
        }

        setOrders(filteredOrders);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar las órdenes";
        setError(errorMessage);
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userRole, filter]);

  return { orders, loading, error };
};
