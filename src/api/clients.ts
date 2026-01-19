// src/api/clients.ts
import api from './axios';
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
} from '../interfaces/ClientInterfaces';
import { mapClientFromBackend } from './mappers';

export const clients = {
  // ========== CLIENTES ==========
  getAllClients: async (): Promise<Client[]> => {
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

  getClientById: async (id: number): Promise<Client> => {
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

  getClientByNit: async (nit: string): Promise<Client> => {
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

  getClientsByUsuarioContacto: async (
    usuarioId: number,
  ): Promise<Client[]> => {
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

  createClient: async (data: CreateClientDto): Promise<Client> => {
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

  updateClient: async (
    id: number,
    data: UpdateClientDto,
  ): Promise<Client> => {
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

  deleteClient: async (id: number): Promise<void> => {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error: any) {
      console.error('Error eliminando cliente:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar cliente',
      );
    }
  },

  getMyClients: async (): Promise<Client[]> => {
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