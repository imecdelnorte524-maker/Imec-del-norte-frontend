// src/api/images.ts (versión mejorada)
import api from "./axios";

export interface ClientImage {
  id: number;
  url: string;
  public_id: string;
  folder: string;
  isLogo: boolean;
  created_at: string;
}

// Interfaz para imágenes de inventario
export interface InventoryImage {
  id: number;
  url: string;
  public_id: string;
  folder: string;
  created_at: string;
  tool_id?: number;
  supply_id?: number;
}

export const imagesApi = {
  // ===== IMÁGENES DE HERRAMIENTAS =====
  // Subir múltiples imágenes para herramienta (usa el endpoint principal)
  uploadToolImages: async (herramientaId: number, files: File[]): Promise<InventoryImage[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file); // IMPORTANTE: 'files' en plural
      });

      // Usa el endpoint /images/tool/:id que ya acepta arrays
      const response = await api.post(`/images/tool/${herramientaId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data || response.data.images || response.data;
    } catch (error: any) {
      console.error("Error subiendo imágenes de herramienta:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir imágenes de herramienta"
      );
    }
  },

  // Obtener imágenes de herramienta
  getToolImages: async (toolId: number): Promise<InventoryImage[]> => {
    try {
      const res = await api.get(`/images/tool/${toolId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error obteniendo imágenes de herramienta:", error);
      return [];
    }
  },

  // ===== IMÁGENES DE INSUMOS =====
  // Subir múltiples imágenes para insumo (usa el endpoint principal)
  uploadSupplyImages: async (insumoId: number, files: File[]): Promise<InventoryImage[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file); // IMPORTANTE: 'files' en plural
      });

      // Usa el endpoint /images/supply/:id que ya acepta arrays
      const response = await api.post(`/images/supply/${insumoId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data || response.data.images || response.data;
    } catch (error: any) {
      console.error("Error subiendo imágenes de insumo:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir imágenes de insumo"
      );
    }
  },

  // Obtener imágenes de insumo
  getSupplyImages: async (supplyId: number): Promise<InventoryImage[]> => {
    try {
      const res = await api.get(`/images/supply/${supplyId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error obteniendo imágenes de insumo:", error);
      return [];
    }
  },

  // ===== IMÁGENES DE EQUIPOS =====
  // Subir imagen para equipo (mantiene una sola imagen)
  uploadEquipmentImage: async (equipmentId: number, file: File): Promise<InventoryImage> => {
    try {
      const formData = new FormData();
      formData.append("file", file); // SINGULAR: 'file'

      const response = await api.post(`/images/equipment/${equipmentId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error subiendo imagen de equipo:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir imagen de equipo"
      );
    }
  },

  // Obtener imágenes de equipo
  getEquipmentImages: async (equipmentId: number): Promise<InventoryImage[]> => {
    try {
      const res = await api.get(`/images/equipment/${equipmentId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error obteniendo imágenes de equipo:", error);
      return [];
    }
  },

  // Eliminar todas las imágenes de equipo
  deleteEquipmentImages: async (equipmentId: number): Promise<void> => {
    try {
      await api.delete(`/images/equipment/${equipmentId}`);
    } catch (error: any) {
      console.error("Error eliminando imágenes de equipo:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar imágenes de equipo"
      );
    }
  },

  // ===== OPERACIONES COMUNES =====
  // Eliminar imagen por ID
  deleteImage: async (id: number): Promise<void> => {
    try {
      await api.delete(`/images/${id}`);
    } catch (error: any) {
      console.error("Error eliminando imagen:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar imagen"
      );
    }
  },

  // ===== CLIENTES =====
  // Subir logo de cliente (solo uno)
  uploadClientLogo: async (clientId: number, file: File): Promise<ClientImage> => {
    try {
      const formData = new FormData();
      formData.append("file", file); // SINGULAR: 'file'
      
      const res = await api.post(`/images/client/${clientId}/logo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error: any) {
      console.error("Error subiendo logo de cliente:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir logo de cliente"
      );
    }
  },

  // Subir múltiples imágenes a galería de cliente
  uploadClientImages: async (clientId: number, files: File[]): Promise<ClientImage[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file); // PLURAL: 'files'
      });
      
      const res = await api.post(`/images/client/${clientId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.data || res.data.images || res.data;
    } catch (error: any) {
      console.error("Error subiendo imágenes de cliente:", error);
      throw new Error(
        error.response?.data?.message || "Error al subir imágenes de cliente"
      );
    }
  },

  // Obtener logo de cliente
  getClientLogo: async (clientId: number): Promise<ClientImage | null> => {
    try {
      const res = await api.get(`/images/client/${clientId}/logo`);
      return res.data?.data || null;
    } catch (error) {
      return null;
    }
  },

  // Obtener imágenes de galería de cliente (sin logo)
  getClientImages: async (clientId: number): Promise<ClientImage[]> => {
    try {
      const res = await api.get(`/images/client/${clientId}`);
      return res.data?.data || [];
    } catch (error) {
      console.error("Error obteniendo imágenes de cliente:", error);
      return [];
    }
  },

  // Eliminar todas las imágenes de cliente
  deleteAllClientImages: async (clientId: number): Promise<void> => {
    try {
      await api.delete(`/images/client/${clientId}`);
    } catch (error: any) {
      console.error("Error eliminando imágenes de cliente:", error);
      throw new Error(
        error.response?.data?.message || "Error al eliminar imágenes de cliente"
      );
    }
  },

  // ===== FUNCIONES UTILITARIAS =====
  // Crear URL de imagen optimizada (para Cloudinary)
  getOptimizedImageUrl: (url: string, width: number = 500, height?: number): string => {
    if (!url) return '';
    // Si es una URL de Cloudinary, agregamos parámetros de optimización
    if (url.includes('cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        const transformation = `w_${width}${height ? `,h_${height}` : ''},c_fill,q_auto,f_auto`;
        return `${parts[0]}/upload/${transformation}/${parts[1]}`;
      }
    }
    return url;
  },

  // Validar archivo antes de subir
  validateFile: (file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): string | null => {
    if (!file) return 'Archivo no válido';
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo es demasiado grande. Máximo: ${maxSizeMB}MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`;
    }
    
    return null;
  },

  // Convertir File a base64 (para previsualización)
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
};

export default imagesApi;