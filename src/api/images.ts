import api from "./axios";

export interface ClientImage {
  id: number;
  url: string;
  public_id: string;
  folder: string;
  isLogo: boolean;
  created_at: string;
}

export const imagesApi = {
  // Clientes - Logo
  uploadClientLogo: async (clientId: number, file: File): Promise<ClientImage> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await api.post(`/images/client/${clientId}/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // Clientes - Imágenes de galería
  uploadClientImage: async (clientId: number, file: File): Promise<ClientImage> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await api.post(`/images/client/${clientId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  getClientLogo: async (clientId: number): Promise<ClientImage | null> => {
    try {
      const res = await api.get(`/images/client/${clientId}/logo`);
      return res.data?.data || null;
    } catch (error) {
      return null;
    }
  },

  getClientImages: async (clientId: number): Promise<ClientImage[]> => {
    const res = await api.get(`/images/client/${clientId}`);
    return res.data?.data || [];
  },

  deleteClientImage: async (imageId: number): Promise<void> => {
    await api.delete(`/images/${imageId}`);
  },

  deleteAllClientImages: async (clientId: number): Promise<void> => {
    await api.delete(`/images/client/${clientId}`);
  },

  // Herramientas
  getToolImages: async (toolId: number): Promise<any[]> => {
    const res = await api.get(`/images/tool/${toolId}`);
    return res.data?.data || [];
  },

  getSupplyImages: async (supplyId: number): Promise<any[]> => {
    const res = await api.get(`/images/supply/${supplyId}`);
    return res.data?.data || [];
  },

  getEquipmentImages: async (equipmentId: number): Promise<any[]> => {
    const res = await api.get(`/images/equipment/${equipmentId}`);
    return res.data?.data || [];
  },
};