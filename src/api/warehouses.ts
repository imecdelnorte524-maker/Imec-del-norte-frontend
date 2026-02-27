import api from "./axios";

export interface Warehouse {
  bodegaId: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  activa: boolean;
  clienteId?: number | null; // 👈 AGREGAR clienteId
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export const warehouses = {
  // Obtener todas las bodegas
  getAll: async (includeInactive = false): Promise<Warehouse[]> => {
    try {
      const params = includeInactive ? { inactive: true } : {};
      const response = await api.get("/warehouses", { params });
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo bodegas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener bodegas",
      );
    }
  },

  // Obtener bodegas por cliente
  getByClient: async (clientId: number): Promise<Warehouse[]> => {
    try {
      const response = await api.get(`/warehouses/cliente/${clientId}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo bodegas del cliente:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener bodegas del cliente",
      );
    }
  },

  // Obtener bodega por ID
  getById: async (id: number): Promise<Warehouse> => {
    try {
      const response = await api.get(`/warehouses/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo bodega:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener bodega",
      );
    }
  },

  // Crear bodega (ahora acepta clienteId)
  create: async (warehouseData: {
    nombre: string;
    descripcion?: string;
    direccion?: string;
    clienteId?: number | null; // 👈 AGREGAR clienteId
  }): Promise<Warehouse> => {
    try {
      const response = await api.post("/warehouses", warehouseData);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creando bodega:", error);
      throw new Error(error.response?.data?.message || "Error al crear bodega");
    }
  },

  // Actualizar bodega
  update: async (
    id: number,
    updateData: {
      nombre?: string;
      descripcion?: string;
      direccion?: string;
      activa?: boolean;
      clienteId?: number | null; // 👈 AGREGAR
    },
  ): Promise<Warehouse> => {
    try {
      const response = await api.patch(`/warehouses/${id}`, updateData);
      return response.data.data;
    } catch (error: any) {
      console.error("Error actualizando bodega:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar bodega",
      );
    }
  },

  // Eliminar bodega (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/warehouses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error eliminando bodega:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar bodega",
      );
    }
  },

  // Obtener estadísticas de bodega
  getStats: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/warehouses/${id}/stats`);
      return response.data.data;
    } catch (error: any) {
      console.error("Error obteniendo estadísticas:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener estadísticas",
      );
    }
  },
};
