// src/interfaces/EquipmentInterfaces.ts

export interface EquipmentPhoto {
  photoId: number;
  equipmentId: number;
  url: string;
  description?: string | null;
  createdAt: string;
}

export interface MotorData {
  amperaje?: string;
  voltaje?: string;
  rpm?: string;
  serialMotor?: string;
  modeloMotor?: string;
  diametroEje?: string;
  tipoEje?: string;
}

export interface EvaporatorData {
  marca?: string;
  modelo?: string;
  serial?: string;
  capacidad?: string;
  amperaje?: string;
  tipoRefrigerante?: string;
  voltaje?: string;
  numeroFases?: string;
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
}

export interface CompressorData {
  marca?: string;
  modelo?: string;
  serial?: string;
  capacidad?: string;
  amperaje?: string;
  tipoRefrigerante?: string;
  voltaje?: string;
  numeroFases?: string;
  tipoAceite?: string;
  cantidadAceite?: string;
}

export interface MotorFormData {
  amperaje: string;
  voltaje: string;
  rpm: string;
  serialMotor: string;
  modeloMotor: string;
  diametroEje: string;
  tipoEje: string;
}

export interface EvaporatorFormData {
  marca: string;
  modelo: string;
  serial: string;
  capacidad: string;
  amperaje: string;
  tipoRefrigerante: string;
  voltaje: string;
  numeroFases: string;
}

export interface CondenserFormData {
  marca: string;
  modelo: string;
  serial: string;
  capacidad: string;
  amperaje: string;
  voltaje: string;
  tipoRefrigerante: string;
  numeroFases: string;
  presionAlta: string;
  presionBaja: string;
  hp: string;
}

export interface CompressorFormData {
  marca: string;
  modelo: string;
  serial: string;
  capacidad: string;
  amperaje: string;
  tipoRefrigerante: string;
  voltaje: string;
  numeroFases: string;
  tipoAceite: string;
  cantidadAceite: string;
}

export interface EquipmentComponent {
  motor?: MotorData | null;
  evaporator?: EvaporatorData | null;
  condenser?: CondenserData | null;
  compressor?: CompressorData | null;
}

export interface AirConditionerType {
  id: number;
  name: string;
  hasEvaporator: boolean;
  hasCondenser: boolean;
}

export interface Equipment {
  equipmentId: number;
  clientId: number;
  client?: {
    idCliente: number;
    nombre: string;
    nit: string;
  };
  areaId?: number | null;
  area?: {
    idArea: number;
    nombreArea: string;
  } | null;
  subAreaId?: number | null;
  subSubAreaId?: number | null;
  subArea?: {
    idSubArea: number;
    nombreSubArea: string;
  } | null;
  workOrderId?: number | null;
  category: string;
  airConditionerTypeId?: number | null;
  airConditionerType?: AirConditionerType | null;
  name: string;
  code?: string | null;
  physicalLocation?: string | null;
  status: string;
  installationDate?: string | null;
  notes?: string | null;
  motor?: MotorData | null;
  evaporator?: EvaporatorData | null;
  condenser?: CondenserData | null;
  compressor?: CompressorData | null;
  photos: EquipmentPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentData {
  clientId: number;
  areaId?: number | null;
  subAreaId?: number | null;
  subSubAreaId?: number | null;
  workOrderId?: number | null;
  category: string;
  airConditionerTypeId?: number | null;
  name: string;
  physicalLocation?: string | null;
  installationDate?: string | null;
  notes?: string | null;
  motor?: MotorData | null;
  evaporator?: EvaporatorData | null;
  condenser?: CondenserData | null;
  compressor?: CompressorData | null;
}

/* ===== Tipos adicionales que antes estaban dentro de la página ===== */

export interface ClientOption {
  idCliente: number;
  nombre: string;
  nit: string;
}

export interface AirConditionerTypeOption extends AirConditionerType {
  description?: string;
}

/** Estado que pasas por react-router en location.state */
export interface RouteState {
  clientId?: number;
  clientName?: string;
  clientNit?: string;
  workOrderId?: number;
}

/** Estado del formulario principal de creación (solo los campos de la UI) */
export interface CreateEquipmentFormValues {
  category: string;
  airConditionerTypeId: string; // en el form lo manejas como string
  name: string;
  physicalLocation: string;
  installationDate: string;
  notes: string;
}

/** Formulario para crear un nuevo tipo de aire acondicionado */
export interface NewAcTypeFormValues {
  name: string;
  hasEvaporator: boolean;
  hasCondenser: boolean;
}
