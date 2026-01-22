// src/api/tools.ts
import api from "./axios";
import { ToolStatus, ToolType } from "../shared/enums/inventory.enum";

export interface Tool {
  herramientaId: number;
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  fechaRegistro: Date;
  fechaActualizacion: Date;
  fechaEliminacion?: Date;
  tipo: ToolType;
  estado: ToolStatus;
  motivoEliminacion?: string;
  observacionEliminacion?: string;
  valorUnitario: number;
  inventarioId?: number;
  cantidadActual?: number;
  bodega?: {
    bodegaId: number;
    nombre: string;
  };
  imagenes?: string[];
}

export interface CreateToolDto {
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  tipo: ToolType;
  estado: ToolStatus;
  valorUnitario: number;
  bodegaId?: number;
}

export interface UpdateToolDto {
  nombre?: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  tipo?: ToolType;
  estado?: ToolStatus;
  valorUnitario?: number;
  bodegaId?: number;
}

export interface ToolUpdateData {
  nombre?: string;
  estado?: string;
  valorUnitario?: number;
  marca?: string;
  serial?: string;
  modelo?: string;
}

export interface DeleteToolDto {
  motivo: string;
  observacion?: string;
}

export const toolsApi = {
  getAll: async (params?: {
    search?: string;
    estado?: string;
    tipo?: string;
    deleted?: boolean;
  }): Promise<Tool[]> => {
    try {
      const response = await api.get("/tools", { params });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramientas"
      );
    }
  },

  getById: async (id: number): Promise<Tool> => {
    try {
      const response = await api.get(`/tools/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramienta"
      );
    }
  },

  create: async (toolData: CreateToolDto): Promise<Tool> => {
    try {
      const response = await api.post("/tools", toolData);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al crear herramienta"
      );
    }
  },

  updateTool: async (herramientaId: number, data: ToolUpdateData) => {
    try {
      const response = await api.patch(`/tools/${herramientaId}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error actualizando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar herramienta"
      );
    }
  },

  softDelete: async (id: number, deleteData: DeleteToolDto): Promise<void> => {
    try {
      await api.delete(`/tools/${id}/soft`, { data: deleteData });
    } catch (error: any) {
      console.error("Error eliminando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta"
      );
    }
  },

  deletePermanent: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tools/${id}`);
    } catch (error: any) {
      console.error("Error eliminando herramienta permanentemente:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta"
      );
    }
  },

  restore: async (id: number): Promise<Tool> => {
    try {
      const response = await api.patch(`/tools/${id}/restore`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error restaurando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al restaurar herramienta"
      );
    }
  },

  updateStatus: async (id: number, estado: ToolStatus): Promise<Tool> => {
    try {
      const response = await api.patch(`/tools/${id}/status`, { estado });
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando estado:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar estado"
      );
    }
  },

  getDeleted: async (): Promise<Tool[]> => {
    try {
      const response = await api.get("/tools", { params: { deleted: true } });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas eliminadas:", error);
      throw new Error(
        error.response?.data?.message ||
          "Error al obtener herramientas eliminadas"
      );
    }
  },

  getEliminationReasons: async (): Promise<string[]> => {
    try {
      const response = await api.get("/tools/motivos-eliminacion");
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo motivos de eliminación:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener motivos"
      );
    }
  },

  getAvailableHerramientas: async () => {
    try {
      const response = await api.get("/tools");
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo herramientas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener herramientas"
      );
    }
  },

  createHerramienta: async (herramientaData: any, file?: File) => {
    try {
      const valorUnitario = parseFloat(herramientaData.valorUnitario) || 0;
      
      // ⚠️ CORREGIDO: Solo campos permitidos por el backend
      const datosParaEnviar: any = {
        nombre: herramientaData.nombre || "",
        marca: herramientaData.marca || "",
        serial: herramientaData.serial || "",
        modelo: herramientaData.modelo || "",
        caracteristicasTecnicas: herramientaData.caracteristicasTecnicas || "",
        observacion: herramientaData.observacion || "",
        tipo: herramientaData.tipo || "Herramienta",
        estado: herramientaData.estado || "Disponible",
        valorUnitario,
      };

      // Solo incluir bodegaId si tiene valor (es opcional)
      if (herramientaData.bodegaId !== undefined && herramientaData.bodegaId !== null) {
        datosParaEnviar.bodegaId = herramientaData.bodegaId;
      }

      // 1. Crear herramienta
      const response = await api.post("/tools", datosParaEnviar);

      const herramientaCreada = response.data.data;

      // 2. Si hay archivo, subirlo a Cloudinary
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
            }
          );
        } catch (imgError: any) {
          console.warn("⚠️ No se pudo subir la imagen:", imgError?.message);
        }
      }

      return herramientaCreada;
    } catch (error: any) {
      console.error("❌ ERROR CREANDO HERRAMIENTA:", error);
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
          "Error al crear herramienta"
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
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Error subiendo imagen:", error);
      throw error;
    }
  },

  deleteHerramienta: async (herramientaId: number) => {
    try {
      const response = await api.delete(`/tool/${herramientaId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error eliminando herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar herramienta"
      );
    }
  },
};