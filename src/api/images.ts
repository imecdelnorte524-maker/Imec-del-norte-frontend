// src/api/images.ts
import api from "./axios";

export interface ImageRecord {
  id: number;
  url: string;
  publicId: string;
  folder: string;
  createdAt: string;
}

export const imagesApi = {
  getToolImages: async (toolId: number): Promise<ImageRecord[]> => {
    const res = await api.get(`/images/tool/${toolId}`);
    return res.data?.data || [];
  },

  getSupplyImages: async (supplyId: number): Promise<ImageRecord[]> => {
    const res = await api.get(`/images/supply/${supplyId}`);
    return res.data?.data || [];
  },

  getEquipmentImages: async (equipmentId: number): Promise<ImageRecord[]> => {
    const res = await api.get(`/images/equipment/${equipmentId}`);
    return res.data?.data || [];
  },
};
