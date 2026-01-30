// src/api/mappers.ts
import type {
  Client,
  ClientImage,
  UsuarioContacto,
} from "../interfaces/ClientInterfaces";
import type { Area } from "../interfaces/AreaInterfaces";
import type { SubArea } from "../interfaces/SubAreaInterfaces";

// ────────────────────────────────────────────────────────────────
// Imágenes
// ────────────────────────────────────────────────────────────────

export const mapImageFromBackend = (data: any): ClientImage => ({
  id: data.id,
  url: data.url,
  public_id: data.public_id,
  folder: data.folder,
  isLogo: data.isLogo,
  created_at: data.created_at,
});

// ────────────────────────────────────────────────────────────────
// CLIENTE
// ────────────────────────────────────────────────────────────────

export const mapClientFromBackend = (data: any): Client => {
  // Mapear usuarios contacto (User[] del backend → UsuarioContacto[] del front)
  const usuariosContacto: UsuarioContacto[] = Array.isArray(
    data.usuariosContacto,
  )
    ? data.usuariosContacto.map((u: any) => ({
        usuarioId: u.usuarioId,
        nombre: u.nombre,
        apellido: u.apellido ?? "",
        email: u.email,
        telefono: u.telefono ?? "",
        role: u.role
          ? {
              rolId: u.role.rolId,
              nombreRol: u.role.nombreRol,
            }
          : undefined,
      }))
    : [];

  return {
    idCliente: data.idCliente,
    nombre: data.nombre,
    nit: data.nit,

    // Dirección desglosada
    direccionBase: data.direccionBase,
    barrio: data.barrio,
    ciudad: data.ciudad,
    departamento: data.departamento,
    pais: data.pais,

    // Dirección completa
    direccionCompleta: data.direccionCompleta ?? "",

    contacto: data.contacto ?? "",
    email: data.email,
    telefono: data.telefono,
    localizacion: data.localizacion,
    // backend la envía como string (YYYY-MM-DD)
    fechaCreacionEmpresa:
      data.fechaCreacionEmpresa ?? data.fecha_creacion_empresa ?? "",

    // Lista de usuarios contacto (ManyToMany)
    usuariosContacto,

    // Áreas e imágenes
    areas: Array.isArray(data.areas) ? data.areas.map(mapAreaFromBackend) : [],
    images: Array.isArray(data.images)
      ? data.images.map(mapImageFromBackend)
      : [],

    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// ────────────────────────────────────────────────────────────────
// ÁREA
// ────────────────────────────────────────────────────────────────

export const mapAreaFromBackend = (data: any): Area => ({
  idArea: data.idArea,
  nombreArea: data.nombreArea,
  clienteId: data.clienteId,
  // Si el backend incluye el cliente anidado, podrías mapearlo;
  // en el JSON que mostraste no viene, así que normalmente será undefined
  cliente: data.cliente ? mapClientFromBackend(data.cliente) : undefined,
  subAreas: Array.isArray(data.subAreas)
    ? data.subAreas.map(mapSubAreaFromBackend)
    : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

// ────────────────────────────────────────────────────────────────
// SUBÁREA
// ────────────────────────────────────────────────────────────────

export const mapSubAreaFromBackend = (data: any): SubArea => ({
  idSubArea: data.idSubArea,
  nombreSubArea: data.nombreSubArea,
  areaId: data.areaId,
  parentSubAreaId: data.parentSubAreaId ?? undefined,
  area: data.area ? mapAreaFromBackend(data.area) : undefined,
  parentSubArea: data.parentSubArea
    ? mapSubAreaFromBackend(data.parentSubArea)
    : undefined,
  children: Array.isArray(data.children)
    ? data.children.map(mapSubAreaFromBackend)
    : [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});
