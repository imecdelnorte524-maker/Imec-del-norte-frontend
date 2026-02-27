// src/api/tools.ts
import api from "./axios";
import type {
  Tool,
  CreateToolPayload,
  UpdateToolPayload,
  DeleteToolPayload,
  ToolStatus,
  ToolEliminationReason,
  ToolApiResponse,
  ToolEliminationReasonsResponse,
} from "../interfaces/ToolsInterfaces";

export const toolsApi = {
  // ✅ Obtener herramientas (con filtros opcionales)
  getAll: async (params?: {
    search?: string;
    estado?: ToolStatus;
    tipo?: string;
    deleted?: boolean;
  }): Promise<Tool[]> => {
    try {
      const response = await api.get<ToolApiResponse<Tool[]>>("/tools", {
        params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramientas",
      );
    }
  },

  // ✅ Obtener herramienta por ID
  getById: async (id: number): Promise<Tool> => {
    try {
      const response = await api.get<ToolApiResponse<Tool>>(`/tools/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramienta",
      );
    }
  },

  // ✅ Crear herramienta
  create: async (toolData: CreateToolPayload): Promise<Tool> => {
    try {
      const payload: CreateToolPayload = {
        ...toolData,
        valorUnitario: Number(toolData.valorUnitario) || 0,
      };

      const response = await api.post<ToolApiResponse<Tool>>("/tools", payload);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al crear herramienta",
      );
    }
  },

  // ✅ Actualizar herramienta
  updateTool: async (
    herramientaId: number,
    data: UpdateToolPayload,
  ): Promise<Tool> => {
    try {
      const response = await api.patch<ToolApiResponse<Tool>>(
        `/tools/${herramientaId}`,
        data,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar herramienta",
      );
    }
  },

  // ✅ Soft delete con motivo
  softDelete: async (
    id: number,
    deleteData: DeleteToolPayload,
  ): Promise<void> => {
    try {
      await api.delete(`/tools/${id}/soft`, { data: deleteData });
    } catch (error: any) {
      console.error("Error eliminando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta",
      );
    }
  },

  // ✅ Delete permanente
  deletePermanent: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tools/${id}`);
    } catch (error: any) {
      console.error("Error eliminando herramienta permanentemente:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta",
      );
    }
  },

  // ✅ Restaurar herramienta (soft-deleted)
  restore: async (id: number): Promise<Tool> => {
    try {
      const response = await api.patch<ToolApiResponse<Tool>>(
        `/tools/${id}/restore`,
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error restaurando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al restaurar herramienta",
      );
    }
  },

  // ✅ Actualizar estado
  updateStatus: async (id: number, estado: ToolStatus): Promise<Tool> => {
    try {
      const response = await api.patch<ToolApiResponse<Tool>>(
        `/tools/${id}/status`,
        { estado },
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando estado:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar estado",
      );
    }
  },

  // ✅ Obtener solo herramientas eliminadas
  getDeleted: async (): Promise<Tool[]> => {
    try {
      const response = await api.get<ToolApiResponse<Tool[]>>("/tools", {
        params: { deleted: true },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas eliminadas:", error);
      throw new Error(
        error.response?.data?.message ||
          "Error al obtener herramientas eliminadas",
      );
    }
  },

  // ✅ Motivos de eliminación
  getEliminationReasons: async (): Promise<ToolEliminationReason[]> => {
    try {
      const response = await api.get<ToolEliminationReasonsResponse>(
        "/tools/motivos-eliminacion",
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo motivos de eliminación:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener motivos",
      );
    }
  },

  // ✅ Catálogo de herramientas disponibles (reutiliza getAll sin filtros)
  getAvailableHerramientas: async (): Promise<Tool[]> => {
    try {
      const response = await api.get<ToolApiResponse<Tool[]>>("/tools");
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramientas",
      );
    }
  },

  // ✅ Crear herramienta desde catálogo (+ imagen opcional)
  createHerramienta: async (
    herramientaData: CreateToolPayload,
    file?: File,
  ): Promise<Tool> => {
    try {
      const payload: CreateToolPayload = {
        ...herramientaData,
        valorUnitario: Number(herramientaData.valorUnitario) || 0,
      };

      const response = await api.post<ToolApiResponse<Tool>>("/tools", payload);
      const herramientaCreada = response.data.data;

      if (file && herramientaCreada.herramientaId) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          await api.post(
            `/images/tool/${herramientaCreada.herramientaId}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          );
        } catch (imgError: any) {
          console.warn("⚠️ No se pudo subir la imagen:", imgError?.message);
        }
      }

      return herramientaCreada;
    } catch (error: any) {
      console.error("❌ ERROR CREANDO HERRAMIENTA:", error);
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
          "Error al crear herramienta",
      );
    }
  },

  uploadHerramientaPhoto: async (herramientaId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/images/tool/${herramientaId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Error subiendo imagen:", error);
      throw error;
    }
  },

  // ✅ Eliminar herramienta (permanente) por ID (alias)
  deleteHerramienta: async (herramientaId: number): Promise<void> => {
    try {
      await api.delete(`/tools/${herramientaId}`);
    } catch (error: any) {
      console.error("❌ Error eliminando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta",
      );
    }
  },
};
