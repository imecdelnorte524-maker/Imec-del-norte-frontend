import type {
  CreateClientDto,
  UpdateClientDto,
  CreateAreaDto,
  CreateSubAreaDto,
} from '../interfaces/ClientInterfaces';
import api from './axios';

// Mapear imágenes del backend
const mapImageFromBackend = (data: any) => ({
  id: data.id,
  url: data.url,
  public_id: data.public_id,
  folder: data.folder,
  isLogo: data.isLogo,
  created_at: data.created_at,
});

// Mapear datos del backend al frontend
const mapClientFromBackend = (data: any) => ({
  idCliente: data.idCliente,
  nombre: data.nombre,
  nit: data.nit,
  // Mapeo de nueva estructura de dirección
  direccionBase: data.direccionBase,
  barrio: data.barrio,
  ciudad: data.ciudad,
  departamento: data.departamento,
  pais: data.pais,
  direccionCompleta: data.direccionCompleta, // Backend lo envía autogenerado

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
  areas: data.areas?.map(mapAreaFromBackend) || [],
  images: data.images?.map(mapImageFromBackend) || [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const mapAreaFromBackend = (data: any) => ({
  idArea: data.idArea,
  nombreArea: data.nombreArea,
  clienteId: data.clienteId,
  cliente: data.cliente ? mapClientFromBackend(data.cliente) : undefined,
  subAreas: data.subAreas?.map(mapSubAreaFromBackend) || [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

const mapSubAreaFromBackend = (data: any) => ({
  idSubArea: data.idSubArea,
  nombreSubArea: data.nombreSubArea,
  areaId: data.areaId,
  parentSubAreaId: data.parentSubAreaId ?? undefined,
  area: data.area ? mapAreaFromBackend(data.area) : undefined,
  children: data.children?.map(mapSubAreaFromBackend) || [],
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
});

export const clients = {
  // ========== CLIENTES ==========
  getAllClients: async () => {
    try {
      const response = await api.get('/clients');
      return response.data.data.map(mapClientFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo clientes:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener clientes',
      );
    }
  },

  getClientById: async (id: number) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return mapClientFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error obteniendo cliente:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener cliente',
      );
    }
  },

  getClientByNit: async (nit: string) => {
    try {
      const response = await api.get(`/clients/nit/${nit}`);
      return mapClientFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error obteniendo cliente por NIT:', error);
      throw new Error(
        error.response?.data?.message || 'Error al buscar cliente por NIT',
      );
    }
  },

  getClientsByUsuarioContacto: async (usuarioId: number) => {
    try {
      const response = await api.get(
        `/clients/usuario-contacto/${usuarioId}`,
      );
      return response.data.data.map(mapClientFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo clientes por usuario:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener clientes por usuario contacto',
      );
    }
  },

  createClient: async (data: CreateClientDto) => {
    try {
      const response = await api.post('/clients', data);
      return mapClientFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear cliente';
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      );
    }
  },

  updateClient: async (id: number, data: UpdateClientDto) => {
    try {
      const response = await api.patch(`/clients/${id}`, data);
      return mapClientFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error actualizando cliente:', error);
      throw new Error(
        error.response?.data?.message || 'Error al actualizar cliente',
      );
    }
  },

  deleteClient: async (id: number) => {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error: any) {
      console.error('Error eliminando cliente:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar cliente',
      );
    }
  },

  // ========== ÁREAS ==========
  getAllAreas: async (clienteId?: number) => {
    try {
      const url = clienteId ? `/areas?clienteId=${clienteId}` : '/areas';
      const response = await api.get(url);
      return response.data.data.map(mapAreaFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo áreas:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener áreas',
      );
    }
  },

  getAreaById: async (id: number) => {
    try {
      const response = await api.get(`/areas/${id}`);
      return mapAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error obteniendo área:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener área',
      );
    }
  },

  createArea: async (data: CreateAreaDto) => {
    try {
      const response = await api.post('/areas', data);
      return mapAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error creando área:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear área';
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      );
    }
  },

  updateArea: async (id: number, data: Partial<CreateAreaDto>) => {
    try {
      const response = await api.patch(`/areas/${id}`, data);
      return mapAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error actualizando área:', error);
      throw new Error(
        error.response?.data?.message || 'Error al actualizar área',
      );
    }
  },

  deleteArea: async (id: number) => {
    try {
      await api.delete(`/areas/${id}`);
    } catch (error: any) {
      console.error('Error eliminando área:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar área',
      );
    }
  },

  // ========== SUBÁREAS ==========
  getAllSubAreas: async (areaId?: number, clienteId?: number) => {
    try {
      let url = '/sub-areas';
      const params = new URLSearchParams();

      if (areaId) params.append('areaId', areaId.toString());
      if (clienteId) params.append('clienteId', clienteId.toString());

      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }

      const response = await api.get(url);
      return response.data.data.map(mapSubAreaFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo subáreas:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener subáreas',
      );
    }
  },

  getSubAreaById: async (id: number) => {
    try {
      const response = await api.get(`/sub-areas/${id}`);
      return mapSubAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error obteniendo subárea:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener subárea',
      );
    }
  },

  createSubArea: async (data: CreateSubAreaDto) => {
    try {
      const response = await api.post('/sub-areas', data);
      return mapSubAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error creando subárea:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al crear subárea';
      throw new Error(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      );
    }
  },

  updateSubArea: async (id: number, data: Partial<CreateSubAreaDto>) => {
    try {
      const response = await api.patch(`/sub-areas/${id}`, data);
      return mapSubAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error actualizando subárea:', error);
      throw new Error(
        error.response?.data?.message || 'Error al actualizar subárea',
      );
    }
  },

  deleteSubArea: async (id: number) => {
    try {
      await api.delete(`/sub-areas/${id}`);
    } catch (error: any) {
      console.error('Error eliminando subárea:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar subárea',
      );
    }
  },

  getMyClients: async () => {
    try {
      const response = await api.get('/clients/my');
      return response.data.data.map(mapClientFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo mis clientes:', error);
      throw new Error(
        error.response?.data?.message || 'Error al obtener mis clientes',
      );
    }
  },
};