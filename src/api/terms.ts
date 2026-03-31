// src/api/terms.ts
import type { CreateTermsDto, TermsData, UpdateTermsDto } from "../interfaces/TermsIntefaces";
import api from "./axios";

export const termsApi = {
  // Obtener todos los términos
  getAllTerms: async (): Promise<TermsData[]> => {
    const response = await api.get("/terms");
    return response.data;
  },

  // Obtener términos por tipo
  getTermsByType: async (type: string): Promise<TermsData> => {
    const response = await api.get(`/terms/${type}`);
    return response.data;
  },

  // Crear nuevos términos (solo admin)
  createTerms: async (data: CreateTermsDto): Promise<TermsData> => {
    const response = await api.post("/terms", data);
    return response.data;
  },

  // Actualizar términos (solo admin)
  updateTerms: async (
    type: string,
    data: UpdateTermsDto,
  ): Promise<TermsData> => {
    const response = await api.put(`/terms/${type}`, data);
    return response.data;
  },

  // Eliminar términos (solo admin)
  deleteTerms: async (type: string): Promise<void> => {
    await api.delete(`/terms/${type}`);
  },
};
