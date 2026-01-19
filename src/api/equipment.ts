import api from "./axios";
import type {
  Equipment,
  EquipmentPhoto,
  CreateEquipmentData,
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
} from "../interfaces/EquipmentInterfaces";

// Mapear foto del backend
const mapPhotoFromBackend = (p: any): EquipmentPhoto => ({
  photoId: p.id || p.photoId,
  equipmentId: p.equipmentId,
  url: p.url,
  description: p.description ?? null,
  createdAt: p.created_at || p.createdAt,
});

// Mapear componentes del backend al frontend
const mapMotorFromBackend = (motor: any): MotorData | null => {
  if (!motor) return null;
  return {
    amperaje: motor.amperaje,
    voltaje: motor.voltaje,
    rpm: motor.rpm,
    serialMotor: motor.serialMotor,
    modeloMotor: motor.modeloMotor,
    diametroEje: motor.diametroEje,
    tipoEje: motor.tipoEje,
  };
};

const mapEvaporatorFromBackend = (evaporator: any): EvaporatorData | null => {
  if (!evaporator) return null;
  return {
    marca: evaporator.marca,
    modelo: evaporator.modelo,
    serial: evaporator.serial,
    capacidad: evaporator.capacidad,
    amperaje: evaporator.amperaje,
    tipoRefrigerante: evaporator.tipoRefrigerante,
    voltaje: evaporator.voltaje,
    numeroFases: evaporator.numeroFases,
  };
};

const mapCondenserFromBackend = (condenser: any): CondenserData | null => {
  if (!condenser) return null;
  return {
    marca: condenser.marca,
    modelo: condenser.modelo,
    serial: condenser.serial,
    capacidad: condenser.capacidad,
    amperaje: condenser.amperaje,
    voltaje: condenser.voltaje,
    tipoRefrigerante: condenser.tipoRefrigerante,
    numeroFases: condenser.numeroFases,
    presionAlta: condenser.presionAlta,
    presionBaja: condenser.presionBaja,
    hp: condenser.hp,
  };
};

const mapCompressorFromBackend = (compressor: any): CompressorData | null => {
  if (!compressor) return null;
  return {
    marca: compressor.marca,
    modelo: compressor.modelo,
    serial: compressor.serial,
    capacidad: compressor.capacidad,
    amperaje: compressor.amperaje,
    tipoRefrigerante: compressor.tipoRefrigerante,
    voltaje: compressor.voltaje,
    numeroFases: compressor.numeroFases,
    tipoAceite: compressor.tipoAceite,
    cantidadAceite: compressor.cantidadAceite,
  };
};

// Mapear equipment del backend al frontend
export const mapEquipmentFromBackend = (data: any): Equipment => ({
  equipmentId: data.equipmentId,
  clientId: data.clientId ?? data.client?.idCliente,
  client: data.client
    ? {
        idCliente: data.client.idCliente,
        nombre: data.client.nombre,
        nit: data.client.nit,
      }
    : undefined,
  areaId: data.areaId ?? data.area?.idArea ?? null,
  area: data.area
    ? {
        idArea: data.area.idArea,
        nombreArea: data.area.nombreArea,
      }
    : null,
  subAreaId: data.subAreaId ?? data.subArea?.idSubArea ?? null,
  subArea: data.subArea
    ? {
        idSubArea: data.subArea.idSubArea,
        nombreSubArea: data.subArea.nombreSubArea,
      }
    : null,
  workOrderId: data.workOrderId ?? data.orderId ?? null,
  category: data.category,
  airConditionerTypeId: data.airConditionerTypeId ?? null,
  airConditionerType: data.airConditionerType
    ? {
        id: data.airConditionerType.id,
        name: data.airConditionerType.name,
        hasEvaporator: data.airConditionerType.hasEvaporator,
        hasCondenser: data.airConditionerType.hasCondenser,
      }
    : null,
  name: data.name,
  code: data.code ?? null,
  physicalLocation: data.physicalLocation ?? null,
  status: data.status,
  installationDate: data.installationDate ?? null,
  notes: data.notes ?? null,

  // Componentes
  motor: mapMotorFromBackend(data.motor),
  evaporator: mapEvaporatorFromBackend(data.evaporator),
  condenser: mapCondenserFromBackend(data.condenser),
  compressor: mapCompressorFromBackend(data.compressor),

  photos: Array.isArray(data.photos)
    ? data.photos.map(mapPhotoFromBackend)
    : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const getEquipmentByClientRequest = async (
  clientId: number,
  search?: string,
): Promise<Equipment[]> => {
  const params = new URLSearchParams();
  params.append("clientId", clientId.toString());
  if (search) params.append("search", search);

  const response = await api.get(`/equipment?${params.toString()}`);
  const data = response.data?.data || [];
  return data.map(mapEquipmentFromBackend);
};

export const getEquipmentByIdRequest = async (
  equipmentId: number,
): Promise<Equipment> => {
  const response = await api.get(`/equipment/${equipmentId}`);
  return mapEquipmentFromBackend(response.data?.data);
};

export const createEquipmentRequest = async (
  data: CreateEquipmentData,
): Promise<Equipment> => {
  // En creación sí mapeamos manualmente porque CreateEquipmentData puede venir plano
  // y queremos estructurarlo bien para el backend
  const payload = {
    clientId: data.clientId,
    areaId: data.areaId ?? null,
    subAreaId: data.subAreaId ?? null,
    category: data.category,
    airConditionerTypeId: data.airConditionerTypeId ?? null,
    name: data.name,
    physicalLocation: data.physicalLocation ?? null,
    installationDate: data.installationDate ?? null,
    notes: data.notes ?? null,
    workOrderId: data.workOrderId ?? null,
    // Componentes: solo si existen
    motor: data.motor || undefined,
    evaporator: data.evaporator || undefined,
    condenser: data.condenser || undefined,
    compressor: data.compressor || undefined,
  };

  const response = await api.post("/equipment", payload);
  return mapEquipmentFromBackend(response.data?.data);
};

export const updateEquipmentRequest = async (
  equipmentId: number,
  data: any, // Usamos any para permitir enviar la estructura exacta que queramos (incluso nulls)
): Promise<Equipment> => {
  // En update, confiamos en que el consumidor ya estructuró el payload correctamente
  // (incluyendo nulls para borrar, o objetos completos para actualizar).
  // Solo pasamos la data tal cual al backend.

  const response = await api.patch(`/equipment/${equipmentId}`, data);
  return mapEquipmentFromBackend(response.data?.data);
};

export const addEquipmentPhotoRequest = async (
  equipmentId: number,
  file: File,
): Promise<EquipmentPhoto> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/images/equipment/${equipmentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const photoData = response.data;
  return mapPhotoFromBackend(photoData);
};

export const deleteEquipmentPhotoRequest = async (
  photoId: number,
): Promise<void> => {
  await api.delete(`/images/${photoId}`);
};