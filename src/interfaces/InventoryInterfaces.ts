// src/interfaces/InventoryInterfaces.ts
import {
  ToolStatus,
  SupplyStatus,
  ToolType,
  SupplyCategory,
  UnitOfMeasure,
  InventoryItemType,
} from "../shared/enums/inventory.enum";

export interface Warehouse {
  bodegaId: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  activa: boolean;
  clienteId?: number | null;
  cliente?: {
    idCliente: number;
    nombre: string;
    nit: string;
  };
  cantidadItems?: number; // Para estadísticas
}

export interface UnitMeasure {
  unidadMedidaId: number;
  nombre: string;
  abreviatura?: string;
  activa: boolean;
}

export interface Herramienta {
  herramientaId: number;
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  fechaRegistro?: string;
  tipo: ToolType;
  estado: ToolStatus;
  valorUnitario: number | null;
  inventarioId?: number;
  cantidadActual?: number;
  ubicacion?: string;
  bodegaId?: number; // Relación con bodega
}

export interface Insumo {
  insumoId: number;
  nombre: string;
  categoria: SupplyCategory;
  unidadMedida?: UnitOfMeasure | string; // Puede ser el objeto o el string por compatibilidad
  unidadMedidaId?: number;
  estado: SupplyStatus;
  fechaRegistro?: string;
  stockMin: number;
  valorUnitario: number | null;
  inventarioId?: number;
  cantidadActual?: number;
  ubicacion?: string;
  bodegaId?: number;
}

export interface Inventory {
  inventarioId: number;
  insumoId?: number;
  herramientaId?: number;
  bodegaId?: number;
  cantidadActual: number;
  ubicacion?: string;
  fechaUltimaActualizacion: string;
  tipo: InventoryItemType;
  nombreItem: string;
  bodega?: Warehouse;
  fechaEliminacion?: string;
  supply?: {
    insumoId: number;
    nombre: string;
    categoria: SupplyCategory;
    unidadMedida: any;
    estado: SupplyStatus;
    stockMin: number;
    valorUnitario: number;
  };
  tool?: {
    herramientaId: number;
    nombre: string;
    marca: string;
    serial: string;
    modelo?: string;
    estado: ToolStatus;
    valorUnitario: number;
  };
}

export type TipoFiltro = "todos" | "herramientas" | "insumos";