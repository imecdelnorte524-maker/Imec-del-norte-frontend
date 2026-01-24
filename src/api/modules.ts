// src/api/modules.ts
import type { Module, CreateModuleDto, UpdateModuleDto} from "../interfaces/ModulesInterfaces";
import type { Rol } from "../interfaces/RolesInterfaces";
import api from "./axios";

// Mapear módulo del backend al frontend
const mapModuleFromBackend = (data: any): Module => ({
  moduloId: data.moduloId,
  nombreModulo: data.nombreModulo,
  descripcion: data.descripcion,
  activo: data.activo,
  orden: data.orden,
  rutaFrontend: data.rutaFrontend,
  icono: data.icono,
  codigoInterno: data.codigoInterno,
  fechaCreacion: data.fechaCreacion,
  fechaActualizacion: data.fechaActualizacion,
  roles: data.roles ? data.roles.map((r: any) => ({
    rolId: r.rolId,
    nombreRol: r.nombreRol,
    descripcion: r.descripcion,
    fechaCreacion: r.fechaCreacion,
  } as Rol)) : [],
});

// Mapear datos del frontend al backend para creación de módulo
const mapCreateModuleToBackend = (data: CreateModuleDto) => ({
  nombreModulo: data.nombreModulo,
  descripcion: data.descripcion || null,
  activo: data.activo ?? true,
  orden: data.orden ?? 0,
  rutaFrontend: data.rutaFrontend || null,
  icono: data.icono || null,
  codigoInterno: data.codigoInterno || null,
  roles: data.roles || [],
});

// Mapear datos del frontend al backend para actualización de módulo
const mapUpdateModuleToBackend = (data: UpdateModuleDto) => {
  const mapped: any = {};

  if (data.nombreModulo !== undefined) mapped.nombreModulo = data.nombreModulo;
  if (data.descripcion !== undefined) mapped.descripcion = data.descripcion;
  if (data.activo !== undefined) mapped.activo = data.activo;
  if (data.orden !== undefined) mapped.orden = data.orden;
  if (data.rutaFrontend !== undefined) mapped.rutaFrontend = data.rutaFrontend;
  if (data.icono !== undefined) mapped.icono = data.icono;
  if (data.codigoInterno !== undefined) mapped.codigoInterno = data.codigoInterno;
  if (data.roles !== undefined) mapped.roles = data.roles;

  return mapped;
};

export const modulesApi = {
  // ========== MÓDULOS ==========
  getAllModules: async (): Promise<Module[]> => {
    try {
      const response = await api.get("/modulos"); // Endpoint correcto a /modulos
      return response.data.data.map(mapModuleFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo módulos:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener módulos"
      );
    }
  },

  getModuleById: async (id: number): Promise<Module> => {
    try {
      const response = await api.get(`/modulos/${id}`);
      return mapModuleFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`Error obteniendo módulo con ID ${id}:`, error);
      throw new Error(
        error.response?.data?.message || `Error al obtener módulo con ID ${id}`
      );
    }
  },

  createModule: async (data: CreateModuleDto): Promise<Module> => {
    try {
      const backendData = mapCreateModuleToBackend(data);
      const response = await api.post("/modulos", backendData);
      return mapModuleFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error creando módulo:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear módulo";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },

  updateModule: async (id: number, data: UpdateModuleDto): Promise<Module> => {
    try {
      const backendData = mapUpdateModuleToBackend(data);
      const response = await api.patch(`/modulos/${id}`, backendData);
      return mapModuleFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error actualizando módulo:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar módulo"
      );
    }
  },

  deleteModule: async (id: number): Promise<void> => {
    try {
      await api.delete(`/modulos/${id}`);
    } catch (error: any) {
      console.error("Error eliminando módulo:", error);
      const errorMessage =
        error.response?.data?.message || "Error al eliminar módulo";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },
};