import type {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  Rol,
  CreateRolDto,
  UpdateRolDto,
} from "../interfaces/UserInterfaces";
import api from "./axios";

// Mapear datos del backend al frontend
const mapUsuarioFromBackend = (data: any) => ({
  usuarioId: data.usuarioId,
  nombre: data.nombre,
  apellido: data.apellido,
  tipoCedula: data.tipoCedula,
  cedula: data.cedula,
  email: data.email,
  username: data.username,
  telefono: data.telefono,
  activo: data.activo,
  fechaCreacion: data.fechaCreacion,
  resetToken: data.resetToken,
  resetTokenExpiry: data.resetTokenExpiry,
  role: data.role,
});

// Mapear rol del backend al frontend
const mapRolFromBackend = (data: any): Rol => ({
  rolId: data.rolId,
  nombreRol: data.nombreRol,
  descripcion: data.descripcion,
  fechaCreacion: data.fechaCreacion,
});

// Mapear datos del frontend al backend para creación de rol
const mapCreateRolToBackend = (data: CreateRolDto) => ({
  nombreRol: data.nombreRol,
  descripcion: data.descripcion || null,
});

// Mapear datos del frontend al backend para actualización de rol
const mapUpdateRolToBackend = (data: UpdateRolDto) => {
  const mapped: any = {};

  if (data.nombreRol !== undefined) {
    mapped.nombreRol = data.nombreRol;
  }

  if (data.descripcion !== undefined) {
    mapped.descripcion = data.descripcion;
  }

  return mapped;
};

// Mapear datos del frontend al backend para creación de usuario
const mapCreateToBackend = (data: CreateUsuarioDto) => ({
  nombre: data.nombre,
  apellido: data.apellido,
  tipoCedula: data.tipoCedula,
  cedula: data.cedula,
  email: data.email,
  username: data.username,
  password: data.password,
  telefono: data.telefono,
  rolId: data.rolId,
  activo: data.activo ?? true,
});

// Mapear datos del frontend al backend para actualización de usuario
const mapUpdateToBackend = (data: UpdateUsuarioDto) => {
  const mapped: any = {
    nombre: data.nombre,
    apellido: data.apellido,
    tipoCedula: data.tipoCedula,
    cedula: data.cedula,
    email: data.email,
    username: data.username,
    telefono: data.telefono,
    activo: data.activo,
  };

  if (data.rolId) {
    mapped.rolId = data.rolId;
  }

  if (data.password && data.password.trim() !== "") {
    mapped.password = data.password;
  }

  return mapped;
};

export const users = {
  // ========== USUARIOS ==========
  getAllUsers: async () => {
    try {
      const response = await api.get("/users");
      return response.data.data.map(mapUsuarioFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo usuarios:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener usuarios"
      );
    }
  },

  getUserById: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}`);
      return mapUsuarioFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error obteniendo usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener usuario"
      );
    }
  },

  createUser: async (data: CreateUsuarioDto) => {
    try {
      const backendData = mapCreateToBackend(data);
      const response = await api.post("/users", backendData);
      return mapUsuarioFromBackend(response.data.user || response.data.data);
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear usuario";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },

  updateUser: async (id: number, data: UpdateUsuarioDto) => {
    try {
      const backendData = mapUpdateToBackend(data);
      const response = await api.patch(`/users/${id}`, backendData);
      return mapUsuarioFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar usuario"
      );
    }
  },

  deactivateUser: async (id: number) => {
    try {
      const response = await api.patch(`/users/${id}/deactivate`);
      return mapUsuarioFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error desactivando usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al desactivar usuario"
      );
    }
  },

  activateUser: async (id: number) => {
    try {
      const response = await api.patch(`/users/${id}/activate`);
      return mapUsuarioFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error activando usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al activar usuario"
      );
    }
  },

  getTechnicians: async () => {
    try {
      const response = await api.get("/users/technicians");
      return response.data.data.map(mapUsuarioFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo técnicos:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener técnicos"
      );
    }
  },

  getClients: async () => {
    try {
      const response = await api.get("/users/clients");
      return response.data.data.map(mapUsuarioFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo clientes:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener clientes"
      );
    }
  },

  // ========== ROLES ==========
  getAllRoles: async (): Promise<Rol[]> => {
    try {
      const response = await api.get("/roles");
      return response.data.data.map(mapRolFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo roles:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener roles"
      );
    }
  },

  getRoleById: async (id: number): Promise<Rol> => {
    try {
      const response = await api.get(`/roles/${id}`);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error obteniendo rol:", error);
      throw new Error(error.response?.data?.message || "Error al obtener rol");
    }
  },

  createRole: async (data: CreateRolDto): Promise<Rol> => {
    try {
      const backendData = mapCreateRolToBackend(data);
      const response = await api.post("/roles", backendData);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error creando rol:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear rol";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },

  updateRole: async (id: number, data: UpdateRolDto): Promise<Rol> => {
    try {
      const backendData = mapUpdateRolToBackend(data);
      const response = await api.patch(`/roles/${id}`, backendData);
      return mapRolFromBackend(response.data.data);
    } catch (error: any) {
      console.error("Error actualizando rol:", error);
      throw new Error(
        error.response?.data?.message || "Error al actualizar rol"
      );
    }
  },

  deleteRole: async (id: number): Promise<void> => {
    try {
      await api.delete(`/roles/${id}`);
    } catch (error: any) {
      console.error("Error eliminando rol:", error);
      const errorMessage =
        error.response?.data?.message || "Error al eliminar rol";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },

  getActiveRoles: async (): Promise<Rol[]> => {
    try {
      const response = await api.get("/roles");
      return response.data.data.map(mapRolFromBackend);
    } catch (error: any) {
      console.error("Error obteniendo roles activos:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener roles activos"
      );
    }
  },

  getUserPhoto: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}/photo`);
      // El backend puede devolver { ...image } o null
      return response.data;
    } catch (error: any) {
      // Si devuelve 404 (usuario no existe) => lo dejamos fallar
      if (error.response?.status === 404) {
        throw new Error("Usuario no encontrado");
      }

      console.error("Error obteniendo foto de usuario:", error);
      throw new Error("Error al obtener foto de usuario");
    }
  },

  uploadUserPhoto: async (id: number, file: File) => {
    try {
      const formData = new FormData();
      // IMPORTANTE: el backend usa FileInterceptor('file')
      formData.append("file", file);

      const response = await api.post(`/users/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data; // debería ser el objeto Image con { id, url, ... }
    } catch (error: any) {
      console.error("Error subiendo foto de usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir foto de usuario"
      );
    }
  },

  deleteUserPhoto: async (id: number) => {
    try {
      const response = await api.delete(`/users/${id}/photo`);
      return response.data;
    } catch (error: any) {
      console.error("Error eliminando foto de usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar foto de usuario"
      );
    }
  },
};
