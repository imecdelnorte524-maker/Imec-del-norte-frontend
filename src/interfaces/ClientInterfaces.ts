// src/interfaces/ClientInterfaces.ts
import type { Area, AreaFormData } from './AreaInterfaces';
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

export interface ClientImage {
  id: number;
  url: string;
  public_id: string;
  folder: string;
  isLogo: boolean;
  created_at: string;
}

export interface Client {
  idCliente: number;
  nombre: string;
  nit: string;

  // Campos desglosados para edición
  direccionBase: string;
  barrio: string;
  ciudad: string;
  departamento: string;
  pais: string;

  // Campo completo para visualización
  direccionCompleta: string;
  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  fechaCreacionEmpresa: string;
  idUsuarioContacto: number;
  usuarioContacto?: UsuarioContacto;
  areas?: Area[];
  images?: ClientImage[];
  createdAt: string;
  updatedAt: string;
}

// DTOs para crear/actualizar
export interface CreateClientDto {
  nombre: string;
  nit: string;

  // Nuevos campos obligatorios
  direccionBase: string;
  barrio: string;
  ciudad: string;
  departamento: string;
  pais: string;

  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  fechaCreacionEmpresa: string;
  idUsuarioContacto?: number;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

// Para formularios paso a paso
export interface ClientFormData {
  nombre: string;
  nit: string;

  // Campos de formulario separados
  direccionBase: string;
  barrio: string;
  ciudad: string;
  departamento: string;
  pais: string;

  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  idUsuarioContacto: number | null;
  fecha_creacion: string;
  areas: AreaFormData[];
}

// Alias para evitar conflictos
export type Usuario = UserUsuario;