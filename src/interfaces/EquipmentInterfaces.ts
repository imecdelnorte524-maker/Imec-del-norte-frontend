// src/interfaces/EquipmentInterfaces.ts

export const MULTIPLE_COMPONENT_TYPES = [
  "multisplit",
  "multi split",
  "multi-split",
  "multi_split",
  "multisplit",
  "multi-split",
  "multi_split",
  "multi split",
  "vrf",
  "v r f",
  "v.r.f",
  "vrv",
  "v r v",
  "v.r.v",
  "variable refrigerant flow",
  "variable refrigerant",
  "refrigerante variable",
  "caudal variable",
  "volumen variable",
  "multisplit",
  "multi-split",
  "multi_split",
  "multi split",
  "sistema multisplit",
  "sistema multi split",
  "sistema de multisplit",
  "equipo multisplit",
  "equipo multi split",
  "inverter multi",
  "multi inverter",
  "multi zona",
  "multizona",
  "multi-zona",
  "multi_zona",
  "multi zona",
  "sistema multizona",
  "sistema multi zona",
  "city multi",
  "city-multi",
  "city_multi",
  "city multi",
  "vrf daikin",
  "vrv daikin",
  "vrf lg",
  "vrv lg",
  "vrf mitsubishi",
  "vrv mitsubishi",
];

// ---------- WorkOrder Info para relación N:M ----------
export interface WorkOrderDetails {
  estado?: string;
  tipoServicio?: string;
  fechaSolicitud?: string;
  servicio?: {
    nombre_servicio: string;
  } | null;
  cliente?: any;
  tecnico?: any;
}

export interface WorkOrderInfo {
  workOrderId: number;
  description?: string;
  createdAt: string;
  workOrderDetails?: WorkOrderDetails;
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
  numeroParte?: string;
  numero_parte?: string;
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
  airConditionerTypeEvapId?: number;
  airConditionerTypeEvap?: AirConditionerTypeInfo;
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
  updatedBy?: string | null;
  photos: EquipmentPhoto[];
  evaporators?: EvaporatorData[];
  condensers?: CondenserData[];
  planMantenimiento?: PlanMantenimientoData | null;
  planMantenimientoAutomatico: boolean;
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
  evaporators?: EvaporatorData[];
  condensers?: CondenserData[];
  planMantenimiento?: PlanMantenimientoData | null;
  planMantenimientoAutomatico?: boolean;
}

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

  // ✅ NUEVO (si algún form lo usa)
  planMantenimientoAutomatico?: boolean;
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
  url: string;
  downloadUrl: string;
  publicId?: string;
}
