// src/api/users.ts
import type { CreateUsuarioDto, UpdateUsuarioDto, Usuario } from "../interfaces/UserInterfaces";
import type { Rol } from "../interfaces/RolesInterfaces";
import api from "./axios";

// Mapear datos del backend al frontend para Usuario
const mapUsuarioFromBackend = (data: any): Usuario => ({
  usuarioId: data.usuarioId ?? data.id,
  nombre: data.nombre ?? "",
  apellido: data.apellido ?? "",
  tipoCedula: data.tipoCedula ?? data.documentType ?? "",
  cedula: data.cedula ?? data.document ?? "",
  email: data.email ?? "",
  username: data.username ?? data.user_name ?? "",
  telefono: data.telefono ?? null,
  activo:
    typeof data.activo === "boolean"
      ? data.activo
      : data.activo === 1 || data.activo === "1",
  fechaCreacion: data.fechaCreacion ?? data.createdAt ?? new Date().toISOString(),
  fechaNacimiento: data.fechaNacimiento ?? data.birthdate ?? null,
  genero: data.genero ?? null,
  resetToken: data.resetToken ?? null,
  resetTokenExpiry: data.resetTokenExpiry ?? null,
  mustChangePassword: data.mustChangePassword ?? false,

  // Nuevos campos (con varios posibles nombres desde backend)
  ubicacionResidencia: data.ubicacionResidencia ?? data.ubicacion ?? data.address ?? null,
  arl: data.arl ?? data.arlName ?? null,
  eps: data.eps ?? null,
  afp: data.afp ?? null,
  contactoEmergenciaNombre:
    data.contactoEmergencia?.nombre ??
    data.contactoEmergenciaNombre ??
    data.emergencyContact?.name ??
    null,
  contactoEmergenciaTelefono:
    data.contactoEmergencia?.telefono ??
    data.contactoEmergenciaTelefono ??
    data.emergencyContact?.phone ??
    null,
  contactoEmergenciaParentesco:
    data.contactoEmergencia?.parentesco ??
    data.contactoEmergenciaParentesco ??
    data.emergencyContact?.relation ??
    null,

  role: {
    rolId: data.role?.rolId ?? data.rolId ?? data.roleId ?? 0,
    nombreRol:
      data.role?.nombreRol ??
      data.role?.name ??
      data.nombreRol ??
      data.roleNombre ??
      "Usuario",
    descripcion: data.role?.descripcion ?? null,
    fechaCreacion: data.role?.fechaCreacion ?? null,
  } as Rol,
});

// Mapear datos del frontend al backend para creación de usuario
const mapCreateUserToBackend = (data: CreateUsuarioDto) => {
  const mapped: any = {
    nombre: data.nombre,
    apellido: data.apellido,
    tipoCedula: data.tipoCedula,
    cedula: data.cedula,
    email: data.email,
    username: data.username,
    password: data.password,
    telefono: data.telefono || null,
    rolId: data.rolId,
    activo: data.activo ?? true,
  };

  if (data.fechaNacimiento && data.fechaNacimiento.trim() !== "") {
    mapped.fechaNacimiento = data.fechaNacimiento;
  }

  if (data.genero && data.genero.trim() !== "") {
    mapped.genero = data.genero;
  }

  // nuevos campos opcionales
  if (data.ubicacionResidencia !== undefined)
    mapped.ubicacionResidencia = data.ubicacionResidencia;
  if (data.arl !== undefined) mapped.arl = data.arl;
  if (data.eps !== undefined) mapped.eps = data.eps;
  if (data.afp !== undefined) mapped.afp = data.afp;
  if (data.contactoEmergenciaNombre !== undefined)
    mapped.contactoEmergenciaNombre = data.contactoEmergenciaNombre;
  if (data.contactoEmergenciaTelefono !== undefined)
    mapped.contactoEmergenciaTelefono = data.contactoEmergenciaTelefono;
  if (data.contactoEmergenciaParentesco !== undefined)
    mapped.contactoEmergenciaParentesco = data.contactoEmergenciaParentesco;

  return mapped;
};

// Mapear datos del frontend al backend para actualización de usuario
const mapUpdateUserToBackend = (data: UpdateUsuarioDto) => {
  const mapped: any = {};

  if (data.nombre !== undefined) mapped.nombre = data.nombre;
  if (data.apellido !== undefined) mapped.apellido = data.apellido;
  if (data.tipoCedula !== undefined) mapped.tipoCedula = data.tipoCedula;
  if (data.cedula !== undefined) mapped.cedula = data.cedula;
  if (data.email !== undefined) mapped.email = data.email;
  if (data.username !== undefined) mapped.username = data.username;
  if (data.telefono !== undefined) mapped.telefono = data.telefono;
  if (data.rolId !== undefined) mapped.rolId = data.rolId;
  if (data.activo !== undefined) mapped.activo = data.activo;

  if (data.fechaNacimiento !== undefined) {
    mapped.fechaNacimiento = data.fechaNacimiento || null;
  }

  if (data.genero !== undefined) {
    mapped.genero = data.genero || null;
  }

  if (data.password && data.password.trim() !== "") {
    mapped.password = data.password;
  }

  // nuevos campos
  if (data.ubicacionResidencia !== undefined)
    mapped.ubicacionResidencia = data.ubicacionResidencia;
  if (data.arl !== undefined) mapped.arl = data.arl;
  if (data.eps !== undefined) mapped.eps = data.eps;
  if (data.afp !== undefined) mapped.afp = data.afp;
  if (data.contactoEmergenciaNombre !== undefined)
    mapped.contactoEmergenciaNombre = data.contactoEmergenciaNombre;
  if (data.contactoEmergenciaTelefono !== undefined)
    mapped.contactoEmergenciaTelefono = data.contactoEmergenciaTelefono;
  if (data.contactoEmergenciaParentesco !== undefined)
    mapped.contactoEmergenciaParentesco = data.contactoEmergenciaParentesco;

  return mapped;
};

const parseUserResponse = (responseData: any) => {
  // backend puede devolver { data: user } o { user } o directamente user
  const payload = responseData?.data ?? responseData?.user ?? responseData;
  return mapUsuarioFromBackend(payload);
};

export const usersApi = {
  // ========== USUARIOS ==========
  getAllUsers: async (): Promise<Usuario[]> => {
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

  getUserById: async (id: number): Promise<Usuario> => {
    try {
      const response = await api.get(`/users/${id}`);
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error("Error obteniendo usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener usuario"
      );
    }
  },

  // Obtener mi perfil (GET /users/me)
  getMe: async (): Promise<Usuario> => {
    try {
      const response = await api.get("/users/me");
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error("Error obteniendo perfil propio:", error);
      throw new Error(
        error.response?.data?.message || "Error al obtener perfil"
      );
    }
  },

  createUser: async (data: CreateUsuarioDto): Promise<Usuario> => {
    try {
      const backendData = mapCreateUserToBackend(data);

      const response = await api.post("/users", backendData);
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error("Error creando usuario:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear usuario";
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      );
    }
  },

  updateUser: async (id: number, data: UpdateUsuarioDto): Promise<Usuario> => {
    try {
      const backendData = mapUpdateUserToBackend(data);

      const response = await api.patch(`/users/${id}`, backendData);
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error(
        "Error actualizando usuario:",
        error.response?.data || error
      );
      throw new Error(
        error.response?.data?.message || "Error al actualizar usuario"
      );
    }
  },

  deactivateUser: async (id: number): Promise<Usuario> => {
    try {
      const response = await api.patch(`/users/${id}/deactivate`);
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error("Error desactivando usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al desactivar usuario"
      );
    }
  },

  activateUser: async (id: number): Promise<Usuario> => {
    try {
      const response = await api.patch(`/users/${id}/activate`);
      return parseUserResponse(response.data);
    } catch (error: any) {
      console.error("Error activando usuario:", error);
      throw new Error(
        error.response?.data?.message || "Error al activar usuario"
      );
    }
  },

  getTechnicians: async (): Promise<Usuario[]> => {
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

  getClients: async (): Promise<Usuario[]> => {
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

  getUserPhoto: async (id: number) => {
    try {
      const response = await api.get(`/users/${id}/photo`);
      return response.data;
    } catch (error: any) {
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
      formData.append("file", file);

      const response = await api.post(`/users/${id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
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