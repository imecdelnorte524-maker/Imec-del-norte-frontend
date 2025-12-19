// src/api/equipment.ts
import api from "./axios";
import type {
  Equipment,
  EquipmentPhoto,
  CreateEquipmentData,
} from "../interfaces/EquipmentInterfaces";

// Mapear foto - CORREGIR
const mapPhotoFromBackend = (p: any): EquipmentPhoto => ({
  photoId: p.id || p.photoId, // El backend devuelve 'id'
  equipmentId: p.equipmentId,
  url: p.url,
  description: p.description ?? null,
  createdAt: p.created_at || p.createdAt, // El backend devuelve 'created_at'
});

// Mapear equipment del backend al frontend
const mapEquipmentFromBackend = (data: any): Equipment => ({
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
  orderId: data.orderId, 
  category: data.category,
  name: data.name,
  code: data.code ?? null,
  brand: data.brand ?? null,
  model: data.model ?? null,
  serialNumber: data.serialNumber ?? null,
  capacity: data.capacity ?? null,
  refrigerantType: data.refrigerantType ?? null,
  voltage: data.voltage ?? null,
  physicalLocation: data.physicalLocation ?? null,
  manufacturer: data.manufacturer ?? null,
  status: data.status,
  installationDate: data.installationDate ?? null,
  notes: data.notes ?? null,
  photos: Array.isArray(data.photos)
    ? data.photos.map(mapPhotoFromBackend)
    : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const getEquipmentByClientRequest = async (
  clientId: number,
  search?: string
) => {
  const params = new URLSearchParams();
  params.append("clientId", clientId.toString());
  if (search) params.append("search", search);

  const response = await api.get(`/equipment?${params.toString()}`);
  const data = response.data?.data || [];
  return data.map(mapEquipmentFromBackend);
};

export const getEquipmentByIdRequest = async (
  equipmentId: number
): Promise<Equipment> => {
  const response = await api.get(`/equipment/${equipmentId}`);
  return mapEquipmentFromBackend(response.data?.data);
};

export const createEquipmentRequest = async (
  data: CreateEquipmentData
): Promise<Equipment> => {
  const payload = {
    clientId: data.clientId,
    areaId: data.areaId ?? null,
    subAreaId: data.subAreaId ?? null,
    category: data.category,
    name: data.name,
    code: data.code ?? null,
    brand: data.brand ?? null,
    model: data.model ?? null,
    serialNumber: data.serialNumber ?? null,
    capacity: data.capacity ?? null,
    refrigerantType: data.refrigerantType ?? null,
    voltage: data.voltage ?? null,
    physicalLocation: data.physicalLocation ?? null,
    manufacturer: data.manufacturer ?? null,
    installationDate: data.installationDate ?? null,
    notes: data.notes ?? null,
  };

  const response = await api.post("/equipment", payload);
  return mapEquipmentFromBackend(response.data?.data);
};

export const updateEquipmentRequest = async (
  equipmentId: number,
  data: Partial<CreateEquipmentData>
): Promise<Equipment> => {
  const payload: any = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.brand !== undefined) payload.brand = data.brand;
  if (data.model !== undefined) payload.model = data.model;
  if (data.serialNumber !== undefined) payload.serialNumber = data.serialNumber;
  if (data.capacity !== undefined) payload.capacity = data.capacity;
  if (data.refrigerantType !== undefined)
    payload.refrigerantType = data.refrigerantType;
  if (data.voltage !== undefined) payload.voltage = data.voltage;
  if (data.physicalLocation !== undefined)
    payload.physicalLocation = data.physicalLocation;
  if (data.manufacturer !== undefined) payload.manufacturer = data.manufacturer;
  if (data.installationDate !== undefined)
    payload.installationDate = data.installationDate;
  if (data.notes !== undefined) payload.notes = data.notes;

  if (data.areaId !== undefined) payload.areaId = data.areaId;
  if (data.subAreaId !== undefined) payload.subAreaId = data.subAreaId;
  if (data.category !== undefined) payload.category = data.category;

  const response = await api.patch(`/equipment/${equipmentId}`, payload);
  return mapEquipmentFromBackend(response.data?.data);
};

export const addEquipmentPhotoRequest = async (
  equipmentId: number,
  file: File
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
    }
  );

  const photoData = response.data;
  return mapPhotoFromBackend(photoData);
};

export const deleteEquipmentPhotoRequest = async (
  photoId: number
): Promise<void> => {
  await api.delete(`/images/${photoId}`);
};