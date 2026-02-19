// src/hooks/useWorkOrders.ts
import { useState, useEffect, useCallback } from "react";
import { getSocket, connectSocket } from "../lib/socket";
import { useSocketEvent } from "./useSocketEvent";
import api from "../lib/axios";
import type { Order } from "../interfaces/OrderInterfaces";

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socket = getSocket() || connectSocket();

  // Cargar órdenes iniciales
  useEffect(() => {
    const loadWorkOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/work-orders");
        setWorkOrders(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Error al cargar órdenes");
        console.error("Error loading work orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkOrders();
  }, []);

  // Escuchar eventos de WebSocket
  useSocketEvent(socket, "workOrders.created", (newOrder: Order) => {
    console.log("📥 Orden creada:", newOrder);
    setWorkOrders((prev) => [newOrder, ...prev]);
  });

  useSocketEvent(socket, "workOrders.updated", (updatedOrder: Order) => {
    console.log("📥 Orden actualizada:", updatedOrder);
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.orden_id === updatedOrder.orden_id ? updatedOrder : order,
      ),
    );
  });

  useSocketEvent(socket, "workOrders.statusUpdated", (updatedOrder: Order) => {
    console.log("📥 Estado actualizado:", updatedOrder.estado);
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.orden_id === updatedOrder.orden_id ? updatedOrder : order,
      ),
    );
  });

  useSocketEvent(socket, "workOrders.deleted", ({ id }: { id: number }) => {
    console.log("📥 Orden eliminada:", id);
    setWorkOrders((prev) => prev.filter((order) => order.orden_id !== id));
  });

  // Métodos CRUD que usan axios con socket ID automático
  const createOrder = useCallback(async (data: any) => {
    try {
      const response = await api.post("/work-orders", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error al crear orden");
    }
  }, []);

  const updateOrder = useCallback(async (id: number, data: any) => {
    try {
      const response = await api.patch(`/work-orders/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al actualizar orden",
      );
    }
  }, []);

  const deleteOrder = useCallback(async (id: number) => {
    try {
      await api.delete(`/work-orders/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al eliminar orden",
      );
    }
  }, []);

  const assignTechnicians = useCallback(
    async (
      id: number,
      technicianIds: number[],
      leaderTechnicianId?: number,
    ) => {
      try {
        const response = await api.post(
          `/work-orders/${id}/assign-technicians`,
          {
            technicianIds,
            leaderTechnicianId,
          },
        );
        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.message || "Error al asignar técnicos",
        );
      }
    },
    [],
  );

  return {
    workOrders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    assignTechnicians,
    refresh: () => {
      setLoading(true);
      api
        .get("/work-orders")
        .then((response) => setWorkOrders(response.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
  };
}
