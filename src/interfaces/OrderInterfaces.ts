export type OrderEstado =
  | "Pendiente"
  | "Asignada"
  | "En Proceso"
  | "Pausada"
  | "Completado"
  | "Cancelada"
  | "Rechazada";

export type BillingEstado =
  | ""
  | "Sin facturar"
  | "Por facturar"
  | "Facturado"
  | "Garantía";

export type CostEstado = "" | "Por pagar" | "Pagado";

export type WorkOrderEvidencePhase = "BEFORE" | "DURING" | "AFTER";

export type AcInspectionPhase = "BEFORE" | "AFTER";

export interface AcInspection {
  id: number;
  equipmentId: number;
  phase: AcInspectionPhase;
  evapTempSupply: number;
  evapTempReturn: number;
  evapTempAmbient: number;
  evapTempOutdoor: number;
  evapMotorRpm: number;
  evapMicrofarads?: number | null;
  condHighPressure: number;
  condLowPressure: number;
  condAmperage: number;
  condVoltage: number;
  condTempIn: number;
  condTempDischarge: number;
  condMotorRpm: number;
  condMicrofarads?: number | null;
  compressorOhmio?: number | null;
  observation?: string | null;
  createdAt: string;
}

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

export interface AssociatedEquipment {
  equipmentId: number;
  code?: string;
  category: string;
  description?: string;
  status?: string;
  area?: { areaId: number; nombre: string } | null;
  subArea?: { subAreaId: number; nombre: string } | null;
}

export interface UserInfo {
  usuario_id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  cedula?: string;
}

export interface TechnicianAssignment {
  id: number;
  tecnicoId: number;
  isLeader: boolean;
  technician: UserInfo;
  rating?: number | null;
  ratedByUserId?: number | null;
  ratedAt?: string | null;
}

export interface TimerInfo {
  timerId: number;
  startTime: string;
  endTime?: string | null;
  totalSeconds: number;
}

export interface PauseInfo {
  pauseId: number;
  startTime: string;
  endTime?: string | null;
  observacion: string;
  user: UserInfo;
}

export interface WorkOrderImage {
  id: number;
  url: string;
  public_id?: string;
  folder?: string;
  created_at: string;
  evidencePhase?: WorkOrderEvidencePhase | null;
  observation?: string | null;
  equipmentId?: number | null;
}

export interface Order {
  orden_id: number;
  servicio_id: number;
  cliente_id: number;
  cliente_empresa_id?: number | null;
  fecha_solicitud: string;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  estado: OrderEstado;
  comentarios: string | null;
  tipo_servicio?: string | null;
  maintenance_type?: MaintenanceType | null;
  estado_facturacion: BillingEstado;
  estado_pago: CostEstado;
  factura_pdf_url?: string | null;
  isEmergency?: boolean;
  plan_mantenimiento_id?: number | null;

  servicio: {
    servicio_id: number;
    nombre_servicio: string;
    descripcion: string | null;
    duracion_estimada: string | null;
    categoria_servicio?: string | null;
    tipo_trabajo?: string | null;
    tipo_mantenimiento?: string | null;
  };

  cliente?: UserInfo;

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

  technicians: TechnicianAssignment[];

  tecnico_id: number | null;
  tecnico?: UserInfo | null;

  equipos: AssociatedEquipment[];
  supplyDetails: SupplyDetail[];
  toolDetails: ToolDetail[];

  timers?: TimerInfo[];
  pauses?: PauseInfo[];

  costo_total_insumos: number;
  tiempo_total?: number;

  received_by_name?: string | null;
  received_by_position?: string | null;
  received_by_signature_data?: string | null;
  received_at?: string | null;

  acInspections?: AcInspection[];
  images?: WorkOrderImage[];
}

export interface CreateOrderData {
  servicio_id: number;
  comentarios?: string;
  cliente_empresa_id?: number;
  cliente_id?: number;
  technicians?: {
    tecnicoId: number;
    isLeader?: boolean;
  }[];
  equipmentIds?: number[];
  tipo_servicio?: string;
  maintenance_type_id?: number;
  isEmergency?: boolean;
  plan_mantenimiento_id?: number | null;
}

export interface UpdateOrderData {
  estado?: Order["estado"];
  comentarios?: string;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  technicians?: {
    tecnicoId: number;
    isLeader?: boolean;
  }[];
  equipmentIds?: number[];
  estado_facturacion?: BillingEstado;
  estado_pago?: CostEstado;
  tipo_servicio?: string;
  maintenance_type_id?: number;
  pause_observation?: string;
}

export interface OrdersResponse {
  services: Order[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}
