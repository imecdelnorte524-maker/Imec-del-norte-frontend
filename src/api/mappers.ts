// src/api/mappers.ts
import type { Client, ClientImage } from '../interfaces/ClientInterfaces';
import type { Area } from '../interfaces/AreaInterfaces';
import type { SubArea } from '../interfaces/SubAreaInterfaces';

// Mapear imágenes del backend
export const mapImageFromBackend = (data: any): ClientImage => ({
  id: data.id,
  url: data.url,
  public_id: data.public_id,
  folder: data.folder,
  isLogo: data.isLogo,
  created_at: data.created_at,
});

// Mapear CLIENTE desde backend
export const mapClientFromBackend = (data: any): Client => ({
  idCliente: data.idCliente,
  nombre: data.nombre,
  nit: data.nit,

  // Dirección desglosada
  direccionBase: data.direccionBase,
  barrio: data.barrio,
  ciudad: data.ciudad,
  departamento: data.departamento,
  pais: data.pais,
  direccionCompleta: data.direccionCompleta,

  contacto: data.contacto,
  email: data.email,
  telefono: data.telefono,
  localizacion: data.localizacion,
  fechaCreacionEmpresa:
    data.fechaCreacionEmpresa ?? data.fecha_creacion_empresa ?? '',
  idUsuarioContacto: data.idUsuarioContacto,
  usuarioContacto: data.usuarioContacto
    ? {
        usuarioId: data.usuarioContacto.usuarioId,
        nombre: data.usuarioContacto.nombre,
        apellido: data.usuarioContacto.apellido,
        email: data.usuarioContacto.email,
        telefono: data.usuarioContacto.telefono,
        role: data.usuarioContacto.role,
      }
    : undefined,
  areas: data.areas?.map(mapAreaFromBackend) ?? [],
  images: data.images?.map(mapImageFromBackend) ?? [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

// Mapear ÁREA desde backend
export const mapAreaFromBackend = (data: any): Area => ({
  idArea: data.idArea,
  nombreArea: data.nombreArea,
  clienteId: data.clienteId,
  cliente: data.cliente ? mapClientFromBackend(data.cliente) : undefined,
  subAreas: data.subAreas?.map(mapSubAreaFromBackend) ?? [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

// Mapear SUBÁREA desde backend
export const mapSubAreaFromBackend = (data: any): SubArea => ({
  idSubArea: data.idSubArea,
  nombreSubArea: data.nombreSubArea,
  areaId: data.areaId,
  parentSubAreaId: data.parentSubAreaId ?? undefined,
  area: data.area ? mapAreaFromBackend(data.area) : undefined,
  parentSubArea: data.parentSubArea
    ? mapSubAreaFromBackend(data.parentSubArea)
    : undefined,
  children: data.children?.map(mapSubAreaFromBackend) ?? [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});