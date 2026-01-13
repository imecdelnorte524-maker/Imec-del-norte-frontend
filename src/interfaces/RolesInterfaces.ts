// src/interfaces/RolesInterfaces.ts
export interface Modulo {
  moduloId: number;
  nombreModulo: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  rutaFrontend?: string;
  icono?: string;
}

export interface Rol {
  rolId: number;
  nombreRol: string;
  descripcion?: string;
  fechaCreacion: string;
  modules?: Modulo[];
}

export interface CreateRolDto {
  nombreRol: string;
  descripcion?: string;
  moduleIds?: number[];
}

export interface UpdateRolDto {
  nombreRol?: string;
  descripcion?: string;
  moduleIds?: number[];
}