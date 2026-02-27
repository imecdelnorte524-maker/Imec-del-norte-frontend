// src/api/supplies.ts
import api from "./axios";
import type {
  Supply,
  CreateSupplyPayload,
  UpdateSupplyPayload,
  SuppliesStats,
  SupplyApiResponse,
} from "../interfaces/SuppliesInterfaces";

export const suppliesApi = {
  // ✅ Obtener todos los insumos (no eliminados)
  getAvailableInsumos: async (): Promise<Supply[]> => {
    try {
      const response = await api.get<SupplyApiResponse<Supply[]>>("/supplies");
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo insumos:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener insumos",
      );
    }
  },

  // ✅ Crear insumo (+ opcionalmente subir imagen)
  createInsumo: async (
    insumoData: CreateSupplyPayload,
    file?: File,
  ): Promise<Supply> => {
    try {
      const payload: CreateSupplyPayload = {
        ...insumoData,
        valorUnitario: Number(insumoData.valorUnitario) || 0,
        stockMin:
          insumoData.stockMin !== undefined
            ? Number(insumoData.stockMin)
            : undefined,
        cantidadInicial:
          insumoData.cantidadInicial !== undefined
            ? Number(insumoData.cantidadInicial)
            : undefined,
      };

      const response = await api.post<SupplyApiResponse<Supply>>(
        "/supplies",
        payload,
      );
      const insumoCreado = response.data.data;

      // Subir imagen si se proporciona
      if (file && insumoCreado.insumoId) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          await api.post(`/images/supply/${insumoCreado.insumoId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } catch (imgError: any) {
          console.warn("⚠️ No se pudo subir la imagen:", imgError?.message);
        }
      }

      return insumoCreado;
    } catch (error: any) {
      console.error("❌ ERROR CREANDO INSUMO:", error);
      console.error("🔍 Detalles del error:", error.response?.data);

      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        const messages = Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage;
        throw new Error(messages);
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Error al crear insumo",
      );
    }
  },

  uploadInsumoPhoto: async (insumoId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(`/images/supply/${insumoId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("❌ Error subiendo imagen:", error);
      throw error;
    }
  },

  deleteInsumo: async (insumoId: number): Promise<void> => {
    try {
      await api.delete(`/supplies/${insumoId}`);
    } catch (error: any) {
      console.error("❌ Error eliminando insumo:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar insumo",
      );
    }
  },

  // ✅ Actualizar insumo
  updateSupply: async (
    insumoId: number,
    data: UpdateSupplyPayload,
  ): Promise<Supply> => {
    try {
      const response = await api.patch<SupplyApiResponse<Supply>>(
        `/supplies/${insumoId}`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando insumo:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar insumo",
      );
    }
  },

  // (Opcional) ✅ Obtener estadísticas de insumos
  getStats: async (): Promise<SuppliesStats> => {
    try {
      const response = await api.get<SupplyApiResponse<SuppliesStats>>(
        "/supplies",
        {
          params: { stats: true },
        },
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error al obtener estadísticas de insumos",
      );
    }
  },
};
