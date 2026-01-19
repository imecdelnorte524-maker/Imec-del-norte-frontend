// src/api/areas.ts

// src/api/areas.ts
import api from './axios';
import type {
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  AreaSubAreasCount,
} from '../interfaces/AreaInterfaces';
import { mapAreaFromBackend } from './mappers';

export const areas = {
  // ========== ÁREAS ==========
  getAllAreas: async (clienteId?: number): Promise<Area[]> => {
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

  getAreaById: async (id: number): Promise<Area> => {
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

  createArea: async (data: CreateAreaDto): Promise<Area> => {
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

  updateArea: async (
    id: number,
    data: UpdateAreaDto,
  ): Promise<Area> => {
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

  deleteArea: async (id: number): Promise<void> => {
    try {
      await api.delete(`/areas/${id}`);
    } catch (error: any) {
      console.error('Error eliminando área:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar área',
      );
    }
  },

  // Contador de subáreas de un área
  getAreaSubAreasCount: async (id: number): Promise<AreaSubAreasCount> => {
    try {
      const response = await api.get(`/areas/${id}/subareas-count`);
      const data = response.data.data as { count: number; areaId: number };
      return {
        areaId: data.areaId,
        count: data.count,
      };
    } catch (error: any) {
      console.error('Error obteniendo conteo de subáreas:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener conteo de subáreas del área',
      );
    }
  },

  // Área con todas sus subáreas
  getAreaWithSubAreas: async (id: number): Promise<Area> => {
    try {
      const response = await api.get(`/areas/${id}/with-subareas`);
      return mapAreaFromBackend(response.data.data);
    } catch (error: any) {
      console.error('Error obteniendo área con subáreas:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener área con subáreas',
      );
    }
  },
};