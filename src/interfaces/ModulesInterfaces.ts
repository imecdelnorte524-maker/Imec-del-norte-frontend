// src/interfaces/ModulesInterfaces.ts

import { type Rol } from './RolesInterfaces';

/**
 * Interface para un Módulo del sistema
 */

export interface Module {
  moduloId: number;
  nombreModulo: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  rutaFrontend?: string;
  icono?: string; // El nombre del icono (ej: "HomeIcon")
  codigoInterno?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  roles: Rol[]; // Roles que tienen acceso a este módulo
}

/**
 * DTO para crear un Módulo
 */
export interface CreateModuleDto {
  nombreModulo: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
  rutaFrontend?: string;
  icono?: string;
  codigoInterno?: string;
  roles?: number[]; // Array de IDs de roles
}

/**
 * DTO para actualizar un Módulo
 */
export interface UpdateModuleDto {
  nombreModulo?: string;
  descripcion?: string;
  activo?: boolean;
  orden?: number;
  rutaFrontend?: string;
  icono?: string;
  codigoInterno?: string;
  roles?: number[]; // Array de IDs de roles
}