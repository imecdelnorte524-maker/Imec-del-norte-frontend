// src/api/supplies.ts
import api from "./axios";

export interface SupplyUpdateData {
  nombre?: string;
  estado?: string;
  valorUnitario?: number;
  unidadMedida?: string;
  stockMin?: number;
  categoria?: string;
}

export const suppliesApi = {
  getAvailableInsumos: async () => {
    try {
      const response = await api.get("/supplies");
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo insumos:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener insumos"
      );
    }
  },

  createInsumo: async (insumoData: any, file?: File) => {
    try {
      const valorUnitario = parseFloat(insumoData.valorUnitario) || 0;
      const stockMin = parseFloat(insumoData.stockMin) || 0;
      const cantidadInicial = parseFloat(insumoData.cantidadInicial) || 0;

      const datosParaEnviar = {
        nombre: insumoData.nombre || "",
        categoria: insumoData.categoria || "General",
        unidadMedida: insumoData.unidadMedida || "Unidad",
        stockMin,
        valorUnitario,
        estado: insumoData.estado || "Disponible",
        cantidadInicial,
        ubicacion: insumoData.ubicacion || "",
      };

      // 1. Crear insumo (inventario se crea con cantidadInicial)
      const response = await api.post("/supplies", datosParaEnviar);

      const insumoCreado = response.data.data;

      // 2. Si hay archivo, subirlo a Cloudinary via /images/supply/:id
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

      if (error.response?.data?.message) {
        const messages = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(", ")
          : error.response.data.message;
        console.error("📢 Mensajes del backend:", messages);
        throw new Error(messages);
      }

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Error al crear insumo"
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

  deleteInsumo: async (insumoId: number) => {
    try {
      const response = await api.delete(`/supplies/${insumoId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error eliminando insumo:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar insumo"
      );
    }
  },

  updateSupply: async (insumoId: number, data: SupplyUpdateData) => {
    try {
      const response = await api.patch(`/supplies/${insumoId}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error actualizando insumo:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar insumo"
      );
    }
  },
};
