// src/api/inventory.ts
import api from "./axios";
import type {
  InventoryItem,
  CreateInventoryPayload,
  UpdateInventoryPayload,
  InventoryApiResponse,
  InventoryDeleteCompleteResponse,
} from "../interfaces/InventoryInterfaces";

export const inventory = {
  // ✅ Obtener todo el inventario
  getAllInventory: async (): Promise<InventoryItem[]> => {
    try {
      const response =
        await api.get<InventoryApiResponse<InventoryItem[]>>("/inventory");

      const data = response.data.data;
      if (!data || !Array.isArray(data)) {
        console.error("❌ ERROR: Datos de inventario no son un array");
        return [];
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error obteniendo inventario:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener inventario",
      );
    }
  },

  // ✅ Crear registro de inventario
  createInventory: async (
    data: CreateInventoryPayload,
  ): Promise<InventoryItem> => {
    try {
      const response = await api.post<InventoryApiResponse<InventoryItem>>(
        "/inventory",
        data,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error al crear registro de inventario",
      );
    }
  },

  // ✅ Actualizar inventario
  updateInventory: async (
    id: number,
    data: UpdateInventoryPayload,
  ): Promise<InventoryItem> => {
    try {
      const response = await api.patch<InventoryApiResponse<InventoryItem>>(
        `/inventory/${id}`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al actualizar inventario",
      );
    }
  },

  // ✅ Eliminar inventario solo (soft delete)
  deleteInventory: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/${id}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al eliminar inventario",
      );
    }
  },

  // ✅ Eliminar inventario + item asociado (hard delete)
  deleteInventoryAndItem: async (
    inventarioId: number,
  ): Promise<InventoryDeleteCompleteResponse> => {
    try {
      const response = await api.delete<InventoryDeleteCompleteResponse>(
        `/inventory/complete/${inventarioId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al eliminar completamente",
      );
    }
  },

  // ✅ Buscar en inventario
  searchInventory: async (keyword: string): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<InventoryItem[]>>(
        "/inventory",
        {
          params: { search: keyword },
        },
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al buscar inventario",
      );
    }
  },

  // ✅ Obtener items con stock bajo
  getLowStock: async (): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<InventoryItem[]>>(
        "/inventory",
        {
          params: { "low-stock": true }, // ⚠️ nombre correcto del query param
        },
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al obtener stock bajo",
      );
    }
  },

  // ✅ Actualizar stock de un registro de inventario
  updateStock: async (id: number, cantidad: number): Promise<InventoryItem> => {
    try {
      const response = await api.patch<InventoryApiResponse<InventoryItem>>(
        `/inventory/${id}/stock`,
        { cantidad },
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error al actualizar stock",
      );
    }
  },
};
