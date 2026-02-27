// src/interfaces/InventoryInterfaces.ts

export interface InventorySupplyInfo {
  insumoId: number;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockMin: number;
  estado: string;
  valorUnitario: number;
  descripcion?: string;
  codigo?: string;
}

export interface InventoryToolInfo {
  herramientaId: number;
  nombre: string;
  marca: string;
  serial: string;
  modelo: string;
  estado: string;
  valorUnitario: number;
  descripcion?: string;
  codigo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  tipo?: string;
}

export interface InventoryBodegaInfo {
  bodegaId: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  activa: boolean;
  clienteId?: number | null;
  clienteNombre?: string;
}

export interface InventoryItem {
  inventarioId: number;
  cantidadActual: number;
  ubicacion?: string;
  estado?: string;
  fechaUltimaActualizacion: string;
  tipo: "insumo" | "herramienta";
  nombreItem: string;
  unidadMedida: string;
  valorUnitario: number;
  descripcion?: string;
  codigo?: string;
  bodega?: InventoryBodegaInfo;
  supply?: InventorySupplyInfo;
  tool?: InventoryToolInfo;
  subtipo?: string;
}

export interface CreateInventoryPayload {
  insumoId?: number;
  herramientaId?: number;
  cantidadActual?: number;
  bodegaId?: number;
  ubicacion?: string;
}

export interface UpdateInventoryPayload {
  cantidadActual?: number;
  bodegaId?: number | null;
  ubicacion?: string;
}

export interface UpdateInventoryStockPayload {
  cantidad: number;
}

export interface InventoryStatsByBodegaItem {
  bodegaId: number;
  bodegaNombre: string;
  totalItems: number;
  insumos: number;
  herramientas: number;
  totalInsumos: number;
}

export interface InventoryStatsByEstadoItem {
  estado: string;
  cantidad: number;
}

export interface InventoryStats {
  totalItems: number;
  suppliesCount: number;
  herramientasCount: number;
  lowStockCount: number;
  totalValue: number;
  porBodega: InventoryStatsByBodegaItem[];
  porEstado: InventoryStatsByEstadoItem[];
}

export interface DeletedInventoryInfo {
  id: number;
  tipo: "insumo" | "herramienta";
  nombreItem: string;
  cantidadActual: number;
  ubicacion?: string | null;
}

export interface DeletedItemInfo {
  tipo: "insumo" | "herramienta";
  id: number;
  nombre: string;
  categoria?: string;
  marca?: string;
}

export interface InventoryDeleteCompleteResult {
  deletedInventory: DeletedInventoryInfo;
  deletedItem: DeletedItemInfo | null;
}

export interface InventoryDeleteCompleteResponse {
  message: string;
  deleted: InventoryDeleteCompleteResult;
}

export interface InventoryApiResponse<T> {
  message: string;
  data: T;
}

export interface UnitMeasure {
  unidadMedidaId: number;
  nombre: string;
  abreviatura?: string;
  activa: boolean;
}

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
  cantidadItems?: number;
}
