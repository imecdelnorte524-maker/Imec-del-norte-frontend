// src/interfaces/SuppliesInterfaces.ts

export const SupplyCategory = {
  GENERAL: "General",
  ELECTRICO: "Eléctrico",
  MECANICO: "Mecánico",
  PLOMERIA: "Plomería",
  CARPINTERIA: "Carpintería",
  ELECTRONICO: "Electrónico",
  HERRRAJES: "Herrajes",
} as const;
export type SupplyCategory =
  (typeof SupplyCategory)[keyof typeof SupplyCategory];

export const SupplyStatus = {
  DISPONIBLE: "Disponible",
  AGOTADO: "Agotado",
  STOCK_BAJO: "Stock Bajo",
  INACTIVO: "Inactivo",
};

export type SupplyStatus = (typeof SupplyStatus)[keyof typeof SupplyStatus];

export interface SupplyBodegaSummary {
  bodegaId: number;
  nombre: string;
}

export interface Supply {
  insumoId: number;
  nombre: string;
  categoria: SupplyCategory;
  unidadMedida: string;
  stock: number;
  cantidadActual: number;
  estado: SupplyStatus;
  fechaRegistro: string;
  stockMin: number;
  valorUnitario: number;
  bodega?: SupplyBodegaSummary;
  inventarioId?: number;
  imagenes?: string[];
}

export interface CreateSupplyPayload {
  nombre: string;
  categoria: SupplyCategory;
  unidadMedida: string;
  valorUnitario: number;
  estado?: SupplyStatus;
  stockMin?: number;
  cantidadInicial?: number;
  bodegaId?: number;
  ubicacion?: string;
}

export interface UpdateSupplyPayload {
  nombre?: string;
  categoria?: SupplyCategory;
  unidadMedida?: string;
  estado?: SupplyStatus;
  stockMin?: number;
  valorUnitario?: number;
  cantidadActual?: number;
  bodegaId?: number | null;
}

export interface UpdateSupplyStockPayload {
  cantidad: number;
}

export interface ChangeSupplyStockPayload {
  cantidad: number;
}

export interface SuppliesStats {
  total: number;
  disponibles: number;
  agotados: number;
  stockBajo: number;
}

export interface SupplyApiResponse<T> {
  message: string;
  data: T;
}
