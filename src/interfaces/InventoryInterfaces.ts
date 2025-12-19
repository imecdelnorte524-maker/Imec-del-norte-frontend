import { 
  ToolStatus, 
  SupplyStatus, 
  ToolType, 
  SupplyCategory, 
  UnitOfMeasure,
  InventoryItemType 
} from '../shared/enums/inventory.enum';

export interface Herramienta {
  herramientaId: number;
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  fechaRegistro?: string;
  tipo: ToolType;
  estado: ToolStatus;
  valorUnitario: number | null;
  // NUEVO: Campos del inventario asociado
  inventarioId?: number;
  cantidadActual?: number;
  ubicacion?: string;
}

export interface Insumo {
  insumoId: number;
  nombre: string;
  categoria: SupplyCategory;
  unidadMedida: UnitOfMeasure;
  // ❌ ELIMINADO: stock (ahora está en Inventory)
  estado: SupplyStatus;
  fechaRegistro?: string;
  stockMin: number;
  valorUnitario: number | null;
  // NUEVO: Campos del inventario asociado
  inventarioId?: number;
  cantidadActual?: number;
  ubicacion?: string;
}

export interface Inventory {
  inventarioId: number;
  insumoId?: number;
  herramientaId?: number;
  cantidadActual: number;
  ubicacion?: string;
  fechaUltimaActualizacion: string;
  tipo: InventoryItemType;
  nombreItem: string;
  supply?: {
    insumoId: number;
    nombre: string;
    categoria: SupplyCategory;
    unidadMedida: UnitOfMeasure;
    // ❌ ELIMINADO: stock (usar cantidadActual del Inventory)
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

export type TipoFiltro = 'todos' | 'herramientas' | 'insumos';