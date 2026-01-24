// src/interfaces/UserInterfaces.ts
import type { Rol } from "./RolesInterfaces";

/**
 * Interface para un Usuario del sistema
 */
export interface Usuario {
  usuarioId: number;
  nombre: string;
  apellido: string;
  tipoCedula: string;
  cedula: string;
  email: string;
  username: string;
  telefono: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaNacimiento?: string | null;
  genero?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
  mustChangePassword?: boolean;
  role: Rol;

  // Nuevos campos de perfil (opcionales)
  ubicacionResidencia?: string | null;
  arl?: string | null;
  eps?: string | null;
  afp?: string | null;

  // Contacto de emergencia
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
}

/**
 * DTO para crear un Usuario
 */
export interface CreateUsuarioDto {
  nombre: string;
  apellido: string;
  tipoCedula: string;
  cedula: string;
  email: string;
  username: string;
  password: string;
  telefono: string;
  rolId: number;
  activo?: boolean;
  fechaNacimiento?: string;
  genero?: string;

  // Opcionales
  ubicacionResidencia?: string;
  arl?: string;
  eps?: string;
  afp?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
}

/**
 * DTO para actualizar un Usuario
 */
export interface UpdateUsuarioDto {
  nombre?: string;
  apellido?: string;
  tipoCedula?: string;
  cedula?: string;
  email?: string;
  username?: string;
  password?: string;
  telefono?: string;
  rolId?: number;
  activo?: boolean;
  fechaNacimiento?: string | null;
  genero?: string | null;

  // Nuevos campos opcionales (permitir null para limpiar)
  ubicacionResidencia?: string | null;
  arl?: string | null;
  eps?: string | null;
  afp?: string | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
}