import api from "./axios";
import type {
  InventoryItem,
  CreateInventoryPayload,
  UpdateInventoryPayload,
  UpdateInventoryStockPayload,
  InventoryApiResponse,
  InventoryDeleteCompleteResponse,
  InventoryStats,
} from "../interfaces/InventoryInterfaces";

// ────────────────────────────────────────────────────────────────
// Mapeadores Backend → Frontend
// ────────────────────────────────────────────────────────────────

const mapInventoryFromBackend = (data: any): InventoryItem => {
  // Determinar el subtipo (para herramientas/equipos)
  let subtipo = undefined;
  if (data.tipo === "herramienta" && data.tool?.tipo) {
    subtipo = data.tool.tipo; // "Herramienta" o "Equipo"
  } else if (data.tipo === "insumo") {
    subtipo = "Insumo";
  }

  return {
    inventarioId: data.inventarioId,
    cantidadActual: Number(data.cantidadActual),
    ubicacion: data.ubicacion,
    estado: data.estado,
    fechaUltimaActualizacion: data.fechaUltimaActualizacion,
    tipo: data.tipo as "insumo" | "herramienta",
    nombreItem: data.nombreItem,
    unidadMedida: data.unidadMedida,
    valorUnitario: Number(data.valorUnitario),
    descripcion: data.descripcion,
    codigo: data.codigo,
    subtipo, // 👈 NUEVO: "Herramienta", "Equipo" o "Insumo"
    bodega: data.bodega
      ? {
          bodegaId: data.bodega.bodegaId,
          nombre: data.bodega.nombre,
          descripcion: data.bodega.descripcion,
          direccion: data.bodega.direccion,
          activa: data.bodega.activa,
          clienteId: data.bodega.clienteId,
          clienteNombre: data.bodega.clienteNombre,
        }
      : undefined,
    supply: data.supply
      ? {
          insumoId: data.supply.insumoId,
          nombre: data.supply.nombre,
          categoria: data.supply.categoria,
          unidadMedida: data.supply.unidadMedida,
          stockMin: Number(data.supply.stockMin),
          estado: data.supply.estado,
          valorUnitario: Number(data.supply.valorUnitario),
          descripcion: data.supply.descripcion,
          codigo: data.supply.codigo,
        }
      : undefined,
    tool: data.tool
      ? {
          herramientaId: data.tool.herramientaId,
          nombre: data.tool.nombre,
          marca: data.tool.marca,
          serial: data.tool.serial,
          modelo: data.tool.modelo,
          estado: data.tool.estado,
          valorUnitario: Number(data.tool.valorUnitario),
          descripcion: data.tool.descripcion,
          codigo: data.tool.codigo,
          caracteristicasTecnicas: data.tool.caracteristicasTecnicas,
          observacion: data.tool.observacion,
          tipo: data.tool.tipo,
        }
      : undefined,
  };
};

const mapStatsFromBackend = (data: any): InventoryStats => {
  return {
    totalItems: Number(data.totalItems || 0),
    suppliesCount: Number(data.suppliesCount || 0),
    herramientasCount: Number(data.herramientasCount || 0),
    lowStockCount: Number(data.lowStockCount || 0),
    totalValue: Number(data.totalValue || 0),
    porBodega: Array.isArray(data.porBodega)
      ? data.porBodega.map((b: any) => ({
          bodegaId: b.bodegaId,
          bodegaNombre: b.bodegaNombre,
          totalItems: Number(b.totalItems),
          insumos: Number(b.insumos),
          herramientas: Number(b.herramientas),
          totalInsumos: Number(b.totalInsumos),
        }))
      : [],
    porEstado: Array.isArray(data.porEstado)
      ? data.porEstado.map((e: any) => ({
          estado: e.estado,
          cantidad: Number(e.cantidad),
        }))
      : [],
  };
};

// ────────────────────────────────────────────────────────────────
// Mapeadores Frontend → Backend (separados por tipo)
// ────────────────────────────────────────────────────────────────

const prepareCreateInventoryForBackend = (
  data: CreateInventoryPayload,
): any => {
  const payload: any = {};

  if (data.insumoId !== undefined) payload.insumoId = data.insumoId;
  if (data.herramientaId !== undefined)
    payload.herramientaId = data.herramientaId;
  if (data.cantidadActual !== undefined)
    payload.cantidadActual = Number(data.cantidadActual);
  if (data.bodegaId !== undefined) payload.bodegaId = data.bodegaId;
  if (data.ubicacion !== undefined) payload.ubicacion = data.ubicacion;

  return payload;
};

const prepareUpdateInventoryForBackend = (
  data: UpdateInventoryPayload,
): any => {
  const payload: any = {};

  if (data.cantidadActual !== undefined)
    payload.cantidadActual = Number(data.cantidadActual);
  if (data.bodegaId !== undefined) payload.bodegaId = data.bodegaId;
  if (data.ubicacion !== undefined) payload.ubicacion = data.ubicacion;

  return payload;
};

// ────────────────────────────────────────────────────────────────
// Funciones de API - Objeto principal
// ────────────────────────────────────────────────────────────────

export const inventory = {
  /**
   * Obtener todo el inventario
   */
  getAll: async (): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<any[]>>("/inventory");
      const data = response.data.data;

      if (!Array.isArray(data)) {
        console.warn("getAll: La respuesta no es un array");
        return [];
      }

      return data.map(mapInventoryFromBackend);
    } catch (error: any) {
      console.error("❌ Error en getAll:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener inventario",
      );
    }
  },

  /**
   * Obtener inventario con filtros
   */
  getFiltered: async (params?: {
    search?: string;
    bodegaId?: number;
    tipo?: "insumo" | "herramienta";
    includeDeleted?: boolean;
  }): Promise<InventoryItem[]> => {
    try {
      const queryParams = new URLSearchParams();

      if (params?.search) queryParams.append("search", params.search);
      if (params?.bodegaId)
        queryParams.append("bodega", params.bodegaId.toString());
      if (params?.tipo) queryParams.append("tipo", params.tipo);
      if (params?.includeDeleted) queryParams.append("deleted", "true");

      const url = `/inventory${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await api.get<InventoryApiResponse<any[]>>(url);
      const data = response.data.data;

      return Array.isArray(data) ? data.map(mapInventoryFromBackend) : [];
    } catch (error: any) {
      console.error("❌ Error en getFiltered:", error);
      throw new Error(
        error.response?.data?.message || "Error al filtrar inventario",
      );
    }
  },

  /**
   * Obtener inventario por bodega
   */
  getByBodega: async (bodegaId: number): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<any[]>>(
        `/inventory?bodega=${bodegaId}`,
      );
      const data = response.data.data;
      return Array.isArray(data) ? data.map(mapInventoryFromBackend) : [];
    } catch (error: any) {
      console.error(`❌ Error en getByBodega(${bodegaId}):`, error);
      throw new Error(
        error.response?.data?.message ||
          "Error al obtener inventario por bodega",
      );
    }
  },

  /**
   * Buscar en inventario por término
   */
  search: async (keyword: string): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<any[]>>(
        "/inventory",
        {
          params: { search: keyword },
        },
      );
      const data = response.data.data;
      return Array.isArray(data) ? data.map(mapInventoryFromBackend) : [];
    } catch (error: any) {
      console.error(`❌ Error en search("${keyword}"):`, error);
      throw new Error(
        error.response?.data?.message || "Error al buscar inventario",
      );
    }
  },

  /**
   * Obtener items con stock bajo
   */
  getLowStock: async (): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<any[]>>(
        "/inventory",
        {
          params: { "low-stock": true },
        },
      );
      const data = response.data.data;
      return Array.isArray(data) ? data.map(mapInventoryFromBackend) : [];
    } catch (error: any) {
      console.error("❌ Error en getLowStock:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener stock bajo",
      );
    }
  },

  /**
   * Obtener estadísticas del inventario
   */
  getStats: async (): Promise<InventoryStats> => {
    try {
      const response = await api.get<InventoryApiResponse<any>>("/inventory", {
        params: { stats: true },
      });
      return mapStatsFromBackend(response.data.data);
    } catch (error: any) {
      console.error("❌ Error en getStats:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener estadísticas",
      );
    }
  },

  /**
   * Obtener registros eliminados
   */
  getDeleted: async (): Promise<InventoryItem[]> => {
    try {
      const response = await api.get<InventoryApiResponse<any[]>>(
        "/inventory",
        {
          params: { deleted: true },
        },
      );
      const data = response.data.data;
      return Array.isArray(data) ? data.map(mapInventoryFromBackend) : [];
    } catch (error: any) {
      console.error("❌ Error en getDeleted:", error);
      throw new Error(
        error.response?.data?.message ||
          "Error al obtener registros eliminados",
      );
    }
  },

  /**
   * Obtener un registro de inventario por ID
   */
  getById: async (id: number): Promise<InventoryItem> => {
    try {
      const response = await api.get<InventoryApiResponse<any>>(
        `/inventory/${id}`,
      );
      return mapInventoryFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`❌ Error en getById(${id}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al obtener el registro",
      );
    }
  },

  /**
   * Crear registro de inventario
   */
  create: async (data: CreateInventoryPayload): Promise<InventoryItem> => {
    try {
      const payload = prepareCreateInventoryForBackend(data);
      const response = await api.post<InventoryApiResponse<any>>(
        "/inventory",
        payload,
      );
      return mapInventoryFromBackend(response.data.data);
    } catch (error: any) {
      console.error("❌ Error en create:", error);
      throw new Error(
        error.response?.data?.message ||
          "Error al crear registro de inventario",
      );
    }
  },

  /**
   * Actualizar registro de inventario
   */
  update: async (
    id: number,
    data: UpdateInventoryPayload,
  ): Promise<InventoryItem> => {
    try {
      const payload = prepareUpdateInventoryForBackend(data);
      const response = await api.patch<InventoryApiResponse<any>>(
        `/inventory/${id}`,
        payload,
      );
      return mapInventoryFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`❌ Error en update(${id}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar inventario",
      );
    }
  },

  /**
   * Actualizar stock de un registro
   */
  updateStock: async (id: number, cantidad: number): Promise<InventoryItem> => {
    try {
      const payload: UpdateInventoryStockPayload = { cantidad };
      const response = await api.patch<InventoryApiResponse<any>>(
        `/inventory/${id}/stock`,
        payload,
      );
      return mapInventoryFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`❌ Error en updateStock(${id}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar stock",
      );
    }
  },

  /**
   * Eliminar registro (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/inventory/${id}`);
    } catch (error: any) {
      console.error(`❌ Error en delete(${id}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar inventario",
      );
    }
  },

  /**
   * Eliminar registro + item asociado (hard delete)
   */
  deleteComplete: async (
    inventarioId: number,
  ): Promise<InventoryDeleteCompleteResponse> => {
    try {
      const response = await api.delete<InventoryDeleteCompleteResponse>(
        `/inventory/complete/${inventarioId}`,
      );
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error en deleteComplete(${inventarioId}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar completamente",
      );
    }
  },

  /**
   * Restaurar registro eliminado
   */
  restore: async (id: number): Promise<InventoryItem> => {
    try {
      const response = await api.patch<InventoryApiResponse<any>>(
        `/inventory/${id}/restore`,
        {},
      );
      return mapInventoryFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`❌ Error en restore(${id}):`, error);
      throw new Error(
        error.response?.data?.message || "Error al restaurar registro",
      );
    }
  },

  /**
   * Exportar inventario a Excel
   */
  exportToExcel: async (params?: {
    bodegaId?: number;
    includeDeleted?: boolean;
  }): Promise<void> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.bodegaId)
        queryParams.append("bodegaId", params.bodegaId.toString());
      if (params?.includeDeleted) queryParams.append("includeDeleted", "true");

      const url = `/inventory/export${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await api.get(url, { responseType: "blob" });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `inventario${params?.bodegaId ? `_bodega_${params.bodegaId}` : ""}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error("❌ Error en exportToExcel:", error);
      throw new Error(
        error.response?.data?.message || "Error al exportar inventario",
      );
    }
  },
};
