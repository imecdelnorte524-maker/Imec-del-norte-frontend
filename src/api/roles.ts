// src/api/roles.ts
import type { Rol, CreateRolDto, UpdateRolDto } from "../interfaces/RolesInterfaces";
import type { Module as ModuleInterface } from "../interfaces/ModulesInterfaces";
import api from "./axios";

/**
 * Extrae mensaje legible de la respuesta de error del backend
 */
const extractErrorMessage = (error: any): string => {
  const resp = error?.response?.data;
  if (!resp) return error?.message || "Error desconocido";

  // Si backend manda message como array -> join
  if (Array.isArray(resp.message)) {
    return resp.message.join(", ");
  }

  // Si manda message como string u otro
  if (typeof resp.message === "string") {
    return resp.message;
  }

  // si manda error
  if (typeof resp.error === "string") {
    return resp.error;
  }

  // fallback a todo el body
  try {
    return JSON.stringify(resp);
  } catch {
    return String(resp);
  }
};

// Mapear módulo del backend al frontend
const mapModuleFromBackend = (data: any): ModuleInterface => ({
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
  })) : [],
});

// Mapear rol del backend al frontend
const mapRolFromBackend = (data: any): Rol => ({
  rolId: data.rolId,
  nombreRol: data.nombreRol,
  descripcion: data.descripcion,
  fechaCreacion: data.fechaCreacion,
  // Algunos endpoints devuelven 'modules', otros 'modulos' (seguridad)
  modules: (data.modules || data.modulos || []).map((mod: any) => ({
    moduloId: mod.moduloId,
    nombreModulo: mod.nombreModulo,
    descripcion: mod.descripcion,
    activo: mod.activo,
    orden: mod.orden,
    rutaFrontend: mod.rutaFrontend,
    icono: mod.icono,
    codigoInterno: mod.codigoInterno,
    fechaCreacion: mod.fechaCreacion,
    fechaActualizacion: mod.fechaActualizacion,
  })) || []
});

// Mapear datos del frontend al backend para creación de rol
// IMPORTANTE: enviamos solo los campos que el backend espera (nombreRol, descripcion).
const mapCreateRolToBackend = (data: CreateRolDto) => ({
  nombreRol: data.nombreRol,
  descripcion: data.descripcion ?? null,
});

// Mapear datos del frontend al backend para actualización de rol
const mapUpdateRolToBackend = (data: UpdateRolDto) => {
  const mapped: any = {};
  if (data.nombreRol !== undefined) mapped.nombreRol = data.nombreRol;
  if (data.descripcion !== undefined) mapped.descripcion = data.descripcion;
  // NO incluimos moduleIds aquí; las asociaciones de módulos se hacen con endpoints específicos (/roles/:id/modulos)
  return mapped;
};

export const rolesApi = {
  getAllRoles: async (): Promise<Rol[]> => {
    try {
      const response = await api.get("/roles");
      return response.data.data.map(mapRolFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo roles:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  getRoleById: async (id: number): Promise<Rol> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`Error obteniendo rol con ID ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  // ----- Permisos (módulos) -----
  getRoleModules: async (id: number): Promise<ModuleInterface[]> => {
    try {
      const response = await api.get(`/roles/${id}/modulos`);
      const data = response.data.data || [];
      return data.map(mapModuleFromBackend);
    } catch (error: any) {
      console.error(`Error obteniendo módulos del rol ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  setRoleModules: async (id: number, moduloIds: number[]): Promise<Rol> => {
    try {
      const response = await api.patch(`/roles/${id}/modulos`, { moduloIds });
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`Error asignando módulos al rol ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  addModuleToRole: async (id: number, moduloId: number): Promise<Rol> => {
    try {
      const response = await api.post(`/roles/${id}/modulos/${moduloId}`);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error(`Error añadiendo módulo ${moduloId} al rol ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  removeModuleFromRole: async (id: number, moduloId: number): Promise<void> => {
    try {
      await api.delete(`/roles/${id}/modulos/${moduloId}`);
    } catch (error: any) {
      console.error(`Error removiendo módulo ${moduloId} del rol ${id}:`, error);
      throw new Error(extractErrorMessage(error));
    }
  },

  // ----- CRUD roles -----
  createRole: async (data: CreateRolDto): Promise<Rol> => {
    try {
      const backendData = mapCreateRolToBackend(data);
      const response = await api.post("/roles", backendData);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error creando rol:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  updateRole: async (id: number, data: UpdateRolDto): Promise<Rol> => {
    try {
      const backendData = mapUpdateRolToBackend(data);
      const response = await api.patch(`/roles/${id}`, backendData);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error actualizando rol:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  getActiveRoles: async (): Promise<Rol[]> => {
    try {
      const response = await api.get("/roles/active");
      return response.data.data.map(mapRolFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo roles activos:", error);
      throw new Error(extractErrorMessage(error));
    }
  },

  deleteRole: async (id: number): Promise<void> => {
    try {
      await api.delete(`/roles/${id}`);
    } catch (error: any) {
      console.error("Error eliminando rol:", error);
      throw new Error(extractErrorMessage(error));
    }
  },
};