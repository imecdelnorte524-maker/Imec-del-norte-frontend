// src/interfaces/SubAreaInterfaces.ts
import type { Area } from "./AreaInterfaces";

export interface SubArea {
  idSubArea: number;
  nombreSubArea: string;
  areaId: number;
  parentSubAreaId?: number;
  area?: Area;
  parentSubArea?: SubArea;
  children?: SubArea[];
  createdAt: string;
  updatedAt: string;
}

// Estructura simplificada para árbol de subáreas en el frontend
export interface SubAreaSimple {
  idSubArea: number;
  nombreSubArea: string;
  idAreaPadre: number;
  parentSubAreaId: number | null;
  subAreas?: SubAreaSimple[];
}

// Alias para usar también SimpleSubArea si lo necesitas
export type SimpleSubArea = SubAreaSimple;

export interface CreateSubAreaDto {
  nombreSubArea: string;
  areaId: number;
  parentSubAreaId?: number;
}

export interface SubAreaFormData {
  id?: number;
  nombreSubArea: string;
  areaId?: number;
  parentSubAreaId?: number;
}

export interface SubAreaWithChildren {
  id: number;
  nombre: string;
  children?: SubAreaWithChildren[];
}

export interface UpdateSubAreaDto extends Partial<CreateSubAreaDto> {}

// Respuesta de /sub-areas/:id/hierarchy
export interface SubAreaHierarchy {
  subArea: {
    idSubArea: number;
    nombreSubArea: string;
  };
  area: {
    idArea: number;
    nombreArea: string;
  };
  cliente: {
    idCliente: number;
    nombre: string;
    nit: string;
  };
  usuarioContacto: {
    usuarioId: number;
    nombre: string;
    email: string;
  };
}