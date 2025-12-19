// src/api/images.ts
import api from './axios';

export interface ImageRecord {
  id: number;
  url: string;
  publicId: string;
  folder: string;
  createdAt: string;
}

export const imagesApi = {
  getToolImages: async (toolId: number): Promise<ImageRecord[]> => {
    console.log('[imagesApi] Solicitando imágenes de herramienta', toolId);
    const res = await api.get(`/images/tool/${toolId}`);
    console.log('[imagesApi] Respuesta imágenes herramienta', res.data);
    return res.data?.data || [];
  },

  getSupplyImages: async (supplyId: number): Promise<ImageRecord[]> => {
    console.log('[imagesApi] Solicitando imágenes de insumo', supplyId);
    const res = await api.get(`/images/supply/${supplyId}`);
    console.log('[imagesApi] Respuesta imágenes insumo', res.data);
    return res.data?.data || [];
  },

  getEquipmentImages: async (equipmentId: number): Promise<ImageRecord[]> => {
    console.log('[imagesApi] Solicitando imágenes de equipo', equipmentId);
    const res = await api.get(`/images/equipment/${equipmentId}`);
    console.log('[imagesApi] Respuesta imágenes equipo', res.data);
    return res.data?.data || [];
  },
};