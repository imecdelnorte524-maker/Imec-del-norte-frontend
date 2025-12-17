// Estados de Herramientas
export const ToolStatus = {
    DISPONIBLE: 'Disponible',
    EN_USO: 'En Uso',
    EN_MANTENIMIENTO: 'En Mantenimiento',
    DAÑADO: 'Dañado',
    RETIRADO: 'Retirado'
} as const;

export type ToolStatus = typeof ToolStatus[keyof typeof ToolStatus];

// Estados de Insumos
export const SupplyStatus = {
    DISPONIBLE: 'Disponible',
    AGOTADO: 'Agotado',
    STOCK_BAJO: 'Stock Bajo',
    INACTIVO: 'Inactivo'
} as const;

export type SupplyStatus = typeof SupplyStatus[keyof typeof SupplyStatus];

// Tipos de Herramientas
export const ToolType = {
  HERRAMIENTA: 'Herramienta',
  INSTRUMENTO: 'Instrumento',
  HERRAMIENTA_GENERAL: 'Herramienta General',
  MAQUINARIA: 'Maquinaria',
  ELECTRONICO: 'Electrónico'
} as const;

export type ToolType = typeof ToolType[keyof typeof ToolType];

// Categorías de Insumos
export const SupplyCategory = {
  GENERAL: 'General',
  ELECTRICO: 'Eléctrico',
  MECANICO: 'Mecánico',
  PLOMERIA: 'Plomería',
  CARPINTERIA: 'Carpintería',
  ELECTRONICO: 'Electrónico',
  HERRRAJES: 'Herrajes'
} as const;

export type SupplyCategory = typeof SupplyCategory[keyof typeof SupplyCategory];

// Unidades de Medida
export const UnitOfMeasure = {
  UNIDAD: 'Unidad',
  METRO: 'Metro',
  KILOGRAMO: 'Kilogramo',
  LITRO: 'Litro',
  CAJA: 'Caja',
  PAQUETE: 'Paquete',
  ROLLO: 'Rollo',
  PULGADA: 'Pulgada'
} as const;

export type UnitOfMeasure = typeof UnitOfMeasure[keyof typeof UnitOfMeasure];

// Tipos de Items en Inventario
export const InventoryItemType = {
  INSUMO: 'insumo',
  HERRAMIENTA: 'herramienta'
} as const;

export type InventoryItemType = typeof InventoryItemType[keyof typeof InventoryItemType];