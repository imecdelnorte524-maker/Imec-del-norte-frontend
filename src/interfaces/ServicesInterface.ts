// src/interfaces/ServicesInterface.ts

export interface ServiceFromAPI {
  orden_id: number;
  servicio_id: number;
  cliente_id: number;
  tecnico_id: number | null;
  fecha_solicitud: string;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  estado:
    | "Pendiente"
    | "En Proceso"
    | "Completado"
    | "Cancelado"
    | "Cancelada"
    | "Rechazada";
  comentarios: string | null;
  servicio: {
    servicio_id: number;
    nombre_servicio: string;
    descripcion: string | null;
    precio_base: number;
    duracion_estimada: string | null;
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
  prioridad?: "Alta" | "Media" | "Baja";
  equipo_asignado?: string;
}

export interface ServicesResponse {
  services: ServiceFromAPI[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface MetricsResponse {
  total: number;
  completados: number;
  en_proceso: number;
  pendientes: number;
  sin_asignar: number;
  asignadas: number;
  cancelados: number;
  mis_servicios: number;
  facturadas: number;
  no_facturadas: number;
  ingresos_totales: number;
  completadas_este_mes: number;
  status_counts: {
    solicitada_sin_asignar: number;
    solicitada_asignada: number;
    en_proceso: number;
    completado: number;
    cancelado: number;
  };
  technicians: {
    tecnico_id: number;
    nombre: string;
    apellido: string | null;
    total_servicios: number;
    completados: number;
  }[];
}

// Interface unificada para el componente ServicesCard
export interface Service {
  orden_id: number;
  servicio: {
    nombre_servicio: string;
    precio_base: number;
    duracion_estimada?: string;
  };
  cliente: {
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
  };
  tecnico?: {
    nombre: string;
    apellido?: string;
  };
  fecha_solicitud: Date;
  fecha_inicio?: Date;
  fecha_finalizacion?: Date;
  estado:
    | "Pendiente"
    | "En Proceso"
    | "Completado"
    | "Cancelado"
    | "Cancelada"
    | "Rechazada";
  comentarios?: string;
  prioridad?: "Alta" | "Media" | "Baja";
  equipo_asignado?: string;
}
