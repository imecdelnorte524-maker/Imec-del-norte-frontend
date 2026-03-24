// src/interfaces/ClientInterfaces.ts
import type { Area, AreaFormData } from "./AreaInterfaces";
import type { Usuario as UserUsuario } from "./UserInterfaces";

export type ClientType = "natural" | "juridica";

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
  tipoCliente?: ClientType; // Nuevo campo opcional para compatibilidad
  nit: string;
  verification_digit?: string;

  // Dirección desglosada
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

  // Lista completa de usuarios contacto (ManyToMany)
  usuariosContacto?: UsuarioContacto[];

  areas?: Area[];
  images?: ClientImage[];
  createdAt: string;
  updatedAt: string;
}

// DTOs para crear/actualizar (frontend → backend)
export interface CreateClientDto {
  nombre: string;
  tipoCliente?: ClientType; // Nuevo campo
  nit: string;
  verification_digit?: string;

  // Campos obligatorios de dirección
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

  // IDs de usuarios contacto (ManyToMany)
  usuariosContactoIds?: number[];
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

// Para formularios paso a paso (solo UI)
export interface ClientFormData {
  nombre: string;
  tipoCliente: ClientType; // Nuevo campo UI
  nit: string;
  verification_digit?: string;

  direccionBase: string;
  barrio: string;
  ciudad: string;
  departamento: string;
  pais: string;

  contacto: string;
  email: string;
  telefono: string;
  localizacion: string;
  idUsuarioContacto: number | null; // sólo para marcar principal en UI
  fecha_creacion: string;
  areas: AreaFormData[];
}

// Alias para evitar conflictos
export type Usuario = UserUsuario;
