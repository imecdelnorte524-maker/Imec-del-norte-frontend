// src/interfaces/EquipmentInterfaces.ts

// ---------- WorkOrder Info para relación N:M ----------
export interface WorkOrderInfo {
  workOrderId: number;
  description?: string;
  createdAt: string;
  workOrderDetails?: {
    estado?: string;
    tipoServicio?: string;
    fechaSolicitud?: string;
  };
}

// ---------- Fotos ----------
export interface EquipmentPhoto {
  photoId: number;
  equipmentId: number;
  url: string;
  description?: string | null;
  createdAt: string;
}

// ---------- Componentes anidados ----------
export interface MotorData {
  amperaje?: string;
  voltaje?: string;
  numeroFases?: string;
  diametroEje?: string;
  tipoEje?: string;
  rpm?: string;
  correa?: string;
  diametroPolea?: string;
  capacidadHp?: string;
  frecuencia?: string;
}

export interface CompressorData {
  marca?: string;
  modelo?: string;
  serial?: string;
  capacidad?: string;
  voltaje?: string;
  frecuencia?: string;
  tipoRefrigerante?: string;
  tipoAceite?: string;
  cantidadAceite?: string;
  capacitor?: string;
  lra?: string;
  fla?: string;
  cantidadPolos?: string;
  amperaje?: string;
  voltajeBobina?: string;
  vac?: string;
}

export interface EvaporatorData {
  marca?: string;
  modelo?: string;
  serial?: string;
  capacidad?: string;
  tipoRefrigerante?: string;
  motors?: MotorData[];
}

export interface CondenserData {
  marca?: string;
  modelo?: string;
  serial?: string;
  capacidad?: string;
  amperaje?: string;
  voltaje?: string;
  tipoRefrigerante?: string;
  numeroFases?: string;
  presionAlta?: string;
  presionBaja?: string;
  hp?: string;
  motors?: MotorData[];
  compressors?: CompressorData[];
}

export interface PlanMantenimientoData {
  unidadFrecuencia?: UnidadFrecuencia;
  diaDelMes?: number | null;
  fechaProgramada?: string | null;
  notas?: string | null;
}

// ---------- Cliente, Área, Subárea ----------
export interface ClientInfo {
  idCliente: number;
  nombre: string;
  nit: string;
}

export interface AreaInfo {
  idArea: number;
  nombreArea: string;
}

export interface SubAreaInfo {
  idSubArea: number;
  nombreSubArea: string;
}

export interface AirConditionerTypeInfo {
  id: number;
  name: string;
  hasEvaporator: boolean;
  hasCondenser: boolean;
}

// ---------- Equipo principal ----------
export interface Equipment {
  equipmentId: number;
  client: ClientInfo;
  area?: AreaInfo;
  subArea?: SubAreaInfo;
  workOrders?: WorkOrderInfo[];
  category: string;
  airConditionerTypeId?: number;
  airConditionerType?: AirConditionerTypeInfo;
  code?: string | null;
  status: string;
  installationDate?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  photos: EquipmentPhoto[];
  evaporators?: EvaporatorData[];
  condensers?: CondenserData[];
  planMantenimiento?: PlanMantenimientoData | null;
}

// ---------- Para crear/actualizar ----------
export interface CreateEquipmentData {
  clientId: number;
  areaId?: number | null;
  subAreaId?: number | null;
  category: string;
  airConditionerTypeId?: number | null;
  code?: string | null;
  status?: string;
  installationDate?: string | null;
  notes?: string | null;
  // ⚠️ ELIMINADO: workOrderId (ahora es relación N:M)
  evaporators?: EvaporatorData[];
  condensers?: CondenserData[];
  planMantenimiento?: PlanMantenimientoData | null;
}

// Para actualizar parcialmente (PATCH)
export type UpdateEquipmentData = Partial<CreateEquipmentData>;

// ---------- Para formularios ----------
export interface EquipmentFormValues {
  clientId: number;
  areaId?: number | null;
  subAreaId?: number | null;
  category: string;
  airConditionerTypeId?: number | null;
  status?: string;
  installationDate?: string | null;
  notes?: string | null;
}

// ---------- Tipos para selects ----------
export interface ClientOption {
  idCliente: number;
  nombre: string;
  nit: string;
}

export interface AreaOption {
  idArea: number;
  nombreArea: string;
  clienteId: number;
}

export interface SubAreaOption {
  idSubArea: number;
  nombreSubArea: string;
  areaId: number;
  parentSubAreaId?: number | null;
}

export interface AirConditionerTypeOption {
  id: number;
  name: string;
  hasEvaporator: boolean;
  hasCondenser: boolean;
}

// ---------- Respuestas de API ----------
export interface EquipmentResponse {
  message: string;
  data: Equipment | Equipment[];
}

// ---------- Enums del backend ----------
export const ServiceCategory = {
  AIRES_ACONDICIONADOS: "Aires Acondicionados",
  REDES_CONTRA_INCENDIOS: "Redes Contra Incendios",
  REDES_ELECTRICAS: "Redes Eléctricas",
  OBRAS_CIVILES: "Obras Civiles",
} as const;

export type ServiceCategory =
  (typeof ServiceCategory)[keyof typeof ServiceCategory];

export const EquipmentStatus = {
  ACTIVE: "Activo",
  OUT_OF_SERVICE: "Fuera de Servicio",
  RETIRED: "Dado de Baja",
} as const;

export type EquipmentStatus =
  (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export type UnidadFrecuencia = "DIA" | "SEMANA" | "MES";

export interface EquipmentDocument {
  id: number;
  equipmentId: number;
  originalName: string;
  mimeType: string;
  size: number | null;
  createdAt: string;
  url: string; // puede venir relativo o absoluto
  downloadUrl: string; // puede venir relativo o absoluto
  publicId?: string;
}
