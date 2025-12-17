export interface EquipmentPhoto {
  photoId: number;
  equipmentId: number;
  url: string;
  description?: string | null;
  createdAt: string;
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
  subArea?: {
    idSubArea: number;
    nombreSubArea: string;
  } | null;

  category: string; // Ej: "Aires Acondicionados"
  name: string;
  code?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  capacity?: string | null;
  refrigerantType?: string | null;
  voltage?: string | null;
  physicalLocation?: string | null;
  manufacturer?: string | null;

  status: string; // "Activo", "Fuera de Servicio", etc.
  installationDate?: string | null;
  notes?: string | null;

  photos: EquipmentPhoto[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentData {
  clientId: number;
  areaId?: number | null;
  subAreaId?: number | null;
  category: string;
  name: string;
  code?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  capacity?: string | null;
  refrigerantType?: string | null;
  voltage?: string | null;
  physicalLocation?: string | null;
  manufacturer?: string | null;
  installationDate?: string | null;
  notes?: string | null;
}