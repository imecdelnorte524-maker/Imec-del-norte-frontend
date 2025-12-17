import type { Usuario as UserUsuario } from './UserInterfaces';

export interface UsuarioContacto {
  usuarioId: number;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  role?: {
    rolId: number;
    nombreRol: string;
  };
}

export interface SubArea {
  idSubArea: number;
  nombreSubArea: string;
  areaId: number;
  area?: Area;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  idArea: number;
  nombreArea: string;
  clienteId: number;
  cliente?: Client;
  subAreas?: SubArea[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  idCliente: number;
  nombre: string;
  nit: string;
  direccion: string;
  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  idUsuarioContacto: number;
  usuarioContacto?: UsuarioContacto;
  areas?: Area[];
  createdAt: string;
  updatedAt: string;
}

// DTOs para crear/actualizar
export interface CreateClientDto {
  nombre: string;
  nit: string;
  direccion: string;
  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  idUsuarioContacto?: number; // ✅ ahora opcional
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface CreateAreaDto {
  nombreArea: string;
  clienteId: number;
}

export interface UpdateAreaDto extends Partial<CreateAreaDto> {}

export interface CreateSubAreaDto {
  nombreSubArea: string;
  areaId: number;
}

export interface UpdateSubAreaDto extends Partial<CreateSubAreaDto> {}

// Para formularios paso a paso
export interface ClientFormData {
  nombre: string;
  nit: string;
  direccion: string;
  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  idUsuarioContacto: number | null;
  areas: AreaFormData[];
}

export interface AreaFormData {
  id?: number;
  nombreArea: string;
  subAreas: SubAreaFormData[];
}

export interface SubAreaFormData {
  id?: number;
  nombreSubArea: string;
  areaId?: number;
}

// Alias para evitar conflictos
export type Usuario = UserUsuario;