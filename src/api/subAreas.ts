// src/api/subAreas.ts

// src/api/subAreas.ts
import api from './axios';
import type {
  SubArea,
  CreateSubAreaDto,
  UpdateSubAreaDto,
  SubAreaHierarchy,
} from '../interfaces/SubAreaInterfaces';
import type { AreaWithSubAreaTree } from '../interfaces/AreaInterfaces';
import { mapSubAreaFromBackend } from './mappers';

export const subAreas = {
  // ========== SUBÁREAS ==========
  getAllSubAreas: async (
    areaId?: number,
    clienteId?: number,
  ): Promise<SubArea[]> => {
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

  getSubAreaById: async (id: number): Promise<SubArea> => {
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

  createSubArea: async (data: CreateSubAreaDto): Promise<SubArea> => {
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

  updateSubArea: async (
    id: number,
    data: UpdateSubAreaDto,
  ): Promise<SubArea> => {
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

  deleteSubArea: async (id: number): Promise<void> => {
    try {
      await api.delete(`/sub-areas/${id}`);
    } catch (error: any) {
      console.error('Error eliminando subárea:', error);
      throw new Error(
        error.response?.data?.message || 'Error al eliminar subárea',
      );
    }
  },

  // Subáreas hijas de una subárea padre
  getSubAreasByParent: async (parentId: number): Promise<SubArea[]> => {
    try {
      const response = await api.get(`/sub-areas/by-parent/${parentId}`);
      return response.data.data.map(mapSubAreaFromBackend);
    } catch (error: any) {
      console.error('Error obteniendo subáreas hijas:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener subáreas hijas de la subárea padre',
      );
    }
  },

  // Jerarquía completa (subárea -> área -> cliente -> usuarioContacto)
  getSubAreaHierarchy: async (id: number): Promise<SubAreaHierarchy> => {
    try {
      const response = await api.get(`/sub-areas/${id}/hierarchy`);
      return response.data.data as SubAreaHierarchy;
    } catch (error: any) {
      console.error('Error obteniendo jerarquía de subárea:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener jerarquía de la subárea',
      );
    }
  },

  // Árbol completo de subáreas de un área
  getAreaSubAreaTree: async (
    areaId: number,
  ): Promise<AreaWithSubAreaTree> => {
    try {
      const response = await api.get(`/sub-areas/tree/${areaId}`);
      return response.data.data as AreaWithSubAreaTree;
    } catch (error: any) {
      console.error('Error obteniendo árbol de subáreas del área:', error);
      throw new Error(
        error.response?.data?.message ||
          'Error al obtener árbol de subáreas del área',
      );
    }
  },
};