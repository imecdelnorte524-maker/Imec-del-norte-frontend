// src/interfaces/OrderInterfaces.ts

export type OrderEstado =
  | 'Pendiente'
  | 'Solicitada asignada'
  | 'En Proceso'
  | 'Completado' 
  | 'Cancelada'
  | 'Rechazada';

export type BillingEstado = 'No facturado' | 'Facturado';

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

  // 🔹 Nuevo: facturación
  estado_facturacion: BillingEstado;
  factura_pdf_url?: string | null;

  servicio: {
    servicio_id: number;
    nombre_servicio: string;
    descripcion: string | null;
    precio_base: number;
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
  } | null;

  equipo?: {
    equipo_id: number;
    nombre: string;
    codigo?: string | null;
    categoria?: string | null;
  } | null;

  costo_total_insumos?: number;
  costo_total_estimado?: number;
}

export interface CreateOrderData {
  servicio_id: number;
  comentarios?: string;
  cliente_empresa_id: number;
  tecnico_id?: number;
  equipo_id?: number;
}

export interface UpdateOrderData {
  tecnico_id?: number | null;
  estado?: Order['estado'];
  comentarios?: string;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  equipo_id?: number | null;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}