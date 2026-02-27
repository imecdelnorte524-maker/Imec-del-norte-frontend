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
  position?: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaNacimiento?: string | null;
  genero?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
  mustChangePassword?: boolean;
  role: Rol;
  ubicacionResidencia?: string | null;
  arl?: string | null;
  eps?: string | null;
  afp?: string | null;
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
  tipoCedula?: string;
  cedula?: string;
  email: string;
  username: string;
  password: string;
  telefono: string;
  rolId: number;
  activo?: boolean;
  fechaNacimiento?: string;
  genero?: string;
  ubicacionResidencia?: string;
  arl?: string;
  eps?: string;
  afp?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
  position?: string;
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
  position?: string | null;
  ubicacionResidencia?: string | null;
  arl?: string | null;
  eps?: string | null;
  afp?: string | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  contactoEmergenciaParentesco?: string | null;
}