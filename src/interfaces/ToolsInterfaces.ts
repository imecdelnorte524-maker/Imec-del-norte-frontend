// src/interfaces/ToolsInterfaces.ts

export const ToolStatus = {
  DISPONIBLE: "Disponible",
  EN_USO: "En Uso",
  EN_MANTENIMIENTO: "En Mantenimiento",
  DAÑADO: "Dañado",
  RETIRADO: "Retirado",
} as const;

export type ToolStatus = (typeof ToolStatus)[keyof typeof ToolStatus];

export const ToolType = {
  HERRAMIENTA: "Herramienta",
  INSTRUMENTO: "Instrumento",
  EQUIPO: "Equipo",
  MAQUINARIA: "Maquinaria",
  ELECTRONICO: "Electrónico",
} as const;

export type ToolType = (typeof ToolType)[keyof typeof ToolType];

export const ToolEliminationReason = {
  DAÑADO: "Dañado",
  ROBADO: "Robado",
  OBSOLETO: "Obsoleto",
  DONADO: "Donado",
  VENDIDO: "Vendido",
  PERDIDO: "Perdido",
  RETIRADO: "Retirado",
  OTRO: "Otro",
} as const;

export type ToolEliminationReason =
  (typeof ToolEliminationReason)[keyof typeof ToolEliminationReason];

export interface ToolBodegaSummary {
  bodegaId: number;
  nombre: string;
}

export interface OrderToolDetail {
  detalleHerramientaId: number;
  tiempoUso: string;
  nombreHerramienta: string;
  marca: string;
  serial?: string;
  modelo?: string;
  tipo?: ToolType;
}

export interface Tool {
  herramientaId: number;
  nombre: string;
  marca: string;
  serial: string;
  modelo: string;
  caracteristicasTecnicas: string;
  observacion: string;
  fechaRegistro: string;
  fechaEliminacion?: string;
  tipo: ToolType;
  estado: ToolStatus;
  motivoEliminacion?: ToolEliminationReason;
  observacionEliminacion?: string;
  valorUnitario: number;
  cantidadActual: number;
  inventarioId?: number;
  bodega?: ToolBodegaSummary;
  imagenes?: string[];
}

export interface CreateToolPayload {
  nombre: string;
  tipo: ToolType;
  estado: ToolStatus;
  valorUnitario: number;

  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  bodegaId?: number;
  ubicacion?: string;
}

export interface UpdateToolPayload {
  nombre?: string;
  marca?: string | null;
  serial?: string | null;
  modelo?: string | null;
  caracteristicasTecnicas?: string | null;
  observacion?: string | null;
  tipo?: ToolType;
  estado?: ToolStatus;
  valorUnitario?: number;
  bodegaId?: number | null;
}

export interface DeleteToolPayload {
  motivo: ToolEliminationReason;
  observacion?: string;
}

export interface UpdateToolStatusPayload {
  estado: ToolStatus;
}

export interface ToolStats {
  total: number;
  disponibles: number;
  enUso: number;
  enMantenimiento: number;
  dañados: number;
  retirados: number;
  totalValue: number;
}

export interface ToolSequenceDiagnosisResponse {
  message: string;
  corrected: boolean;
}

export interface ToolTableDiagnosis {
  sequence: any;
  uniqueConstraints: any;
  duplicateData: any[];
  stats: ToolStats;
  recommendations: string[];
}

export interface ToolTableDiagnosisResponse {
  message: string;
  data: ToolTableDiagnosis;
}

export interface ToolEliminationReasonsResponse {
  message: string;
  data: ToolEliminationReason[];
}

export interface ToolApiResponse<T> {
  message: string;
  data: T;
}
