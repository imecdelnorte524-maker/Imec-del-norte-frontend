// src/interfaces/AreaInterfaces.ts
import type { Client } from "./ClientInterfaces";
import type {
  SubArea,
  SubAreaFormData,
  SubAreaWithChildren,
  SubAreaSimple,
} from "./SubAreaInterfaces";

export interface AreaSimple {
  idArea: number;
  nombreArea: string;
  // Se usa para guardar la respuesta completa de /sub-areas/tree/:areaId
  treeData?: any;
  // Lista de subáreas simplificadas para el selector jerárquico
  subAreas: SubAreaSimple[];
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

export interface CreateAreaDto {
  nombreArea: string;
  clienteId: number;
}

export interface UpdateAreaDto extends Partial<CreateAreaDto> {}

export interface AreaFormData {
  id?: number;
  nombreArea: string;
  subAreas: SubAreaFormData[];
}

export interface SimpleArea {
  idArea: number;
  nombreArea: string;
}

// Respuesta para /areas/:id/subareas-count
export interface AreaSubAreasCount {
  areaId: number;
  count: number;
}

// Estructura del árbol devuelto por /sub-areas/tree/:areaId
export interface AreaWithSubAreaTree {
  area: SimpleArea;
  cliente: {
    idCliente: number;
    nombre: string;
  };
  subAreas: SubAreaWithChildren[];
}