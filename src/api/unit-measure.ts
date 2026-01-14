// src/api/unit-measure.ts
import api from "./axios";

export interface UnitMeasure {
  unidadMedidaId: number;
  nombre: string;
  abreviatura?: string;
  activa: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export const unitMeasureApi = {
  // Obtener todas las unidades
  getAll: async (includeInactive = false): Promise<UnitMeasure[]> => {
    try {
      const params = includeInactive ? { inactive: true } : {};
      const response = await api.get("/unit-measure", { params });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo unidades:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener unidades"
      );
    }
  },

  // Buscar unidades por término
  search: async (keyword: string): Promise<UnitMeasure[]> => {
    try {
      const response = await api.get("/unit-measure/search", {
        params: { q: keyword },
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error buscando unidades:", error);
      throw new Error(
        error.response?.data?.message || "Error al buscar unidades"
      );
    }
  },

  // Crear o encontrar unidad (para autocompletado)
  findOrCreate: async (nombre: string): Promise<UnitMeasure> => {
    try {
      const response = await api.post("/unit-measure/find-or-create", {
        nombre,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error creando/buscando unidad:", error);
      throw new Error(
        error.response?.data?.message || "Error al procesar unidad"
      );
    }
  },

  // Crear unidad (nueva)
  create: async (unitData: {
    nombre: string;
    abreviatura?: string;
  }): Promise<UnitMeasure> => {
    try {
      const response = await api.post("/unit-measure", unitData);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creando unidad:", error);
      throw new Error(
        error.response?.data?.message || "Error al crear unidad"
      );
    }
  },

  // Actualizar unidad
  update: async (
    id: number,
    updateData: {
      nombre?: string;
      abreviatura?: string;
      activa?: boolean;
    }
  ): Promise<UnitMeasure> => {
    try {
      const response = await api.patch(`/unit-measure/${id}`, updateData);
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando unidad:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar unidad"
      );
    }
  },

  // Eliminar unidad
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/unit-measure/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error eliminando unidad:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar unidad"
      );
    }
  },
};