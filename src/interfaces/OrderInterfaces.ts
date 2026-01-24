// src/interfaces/OrderInterfaces.ts

export type OrderEstado =
  | 'Pendiente'
  | 'Asignada'
  | 'En Proceso'
  | 'Completado'
  | 'Cancelada'
  | 'Rechazada';

export type BillingEstado = 'No facturado' | 'Facturado';

export interface SupplyDetail {
  detalleInsumoId: number;
  cantidadUsada: number;
  costoUnitarioAlMomento: number;
  nombreInsumo: string;
}

export interface ToolDetail {
  detalleHerramientaId: number;
  tiempoUso: string;
  nombreHerramienta: string;
  marca: string;
}

export interface MaintenanceType {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ⚠️ NUEVO: Interface para información de equipos asociados
export interface AssociatedEquipment {
  equipmentId: number;
  code?: string;
  category: string;
  description?: string;
}

export interface Order {
  orden_id: number;
  servicio_id: number;
  cliente_id: number;
  tecnico_id: number | null;
  fecha_solicitud: string;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  estado: OrderEstado;
  comentarios: string | null;
  tipo_servicio?: string | null;
  maintenance_type?: MaintenanceType | null;
  estado_facturacion: BillingEstado;
  factura_pdf_url?: string | null;

  servicio: {
    servicio_id: number;
    nombre_servicio: string;
    descripcion: string | null;
    duracion_estimada: string | null;
    categoria_servicio?: string | null;
    tipo_trabajo?: string | null;
    tipo_mantenimiento?: string | null;
  };

  cliente: {
    usuario_id: number;
    nombre: string;
    apellido: string | null;
    email: string;
    telefono: string | null;
  };

  tecnico: {
    usuario_id: number;
    nombre: string;
    apellido: string | null;
    email: string;
  } | null;

  cliente_empresa?: {
    id_cliente: number;
    nombre: string;
    nit: string;
    email: string;
    telefono: string;
    localizacion: string;
    direccion?: string | null;
    contacto?: string | null;
    id_usuario_contacto?: number | null;
  } | null;

  // ⚠️ CAMBIO: De 'equipo' (singular) a 'equipos' (plural)
  equipos?: AssociatedEquipment[];

  supplyDetails?: SupplyDetail[];
  toolDetails?: ToolDetail[];

  costo_total_insumos?: number;
  costo_total_estimado?: number;
}

export interface CreateOrderData {
  servicio_id: number;
  comentarios?: string;
  cliente_empresa_id: number;
  tecnico_id?: number;
  // ⚠️ CAMBIO: De 'equipo_id' (singular) a 'equipmentIds' (array)
  equipmentIds?: number[];
  tipo_servicio?: string;
  maintenance_type_id?: number;
}

export interface UpdateOrderData {
  tecnico_id?: number | null;
  estado?: Order['estado'];
  comentarios?: string;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  // ⚠️ CAMBIO: De 'equipo_id' a 'equipmentIds'
  equipmentIds?: number[] | null;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}