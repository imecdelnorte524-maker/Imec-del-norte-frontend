// src/api/technician-ranking.ts
import api from "./axios";
import type {
  TechnicianRankingData,
  MonthlyRanking,
  TechnicianEvolution,
  RankingStats,
  HistoricalRankingResponse,
  ApiResponse,
} from "../interfaces/TechnicianRankingInterface";

export const technicianRankingApi = {
  /**
   * Obtener ranking actual del mes (top 10)
   */
  getCurrentRanking: async (): Promise<MonthlyRanking> => {
    const response = await api.get<ApiResponse<MonthlyRanking>>(
      "/technician-ranking/current",
    );
    return response.data.data;
  },

  /**
   * Obtener ranking de un mes específico
   * @param mes - Número del mes (1-12)
   * @param año - Año (ej: 2024)
   * @param forceRecalculate - Forzar recálculo desde la base de datos
   */
  getMonthlyRanking: async (
    mes: number,
    año: number,
    forceRecalculate?: boolean,
  ): Promise<MonthlyRanking> => {
    const params = new URLSearchParams();
    params.append("mes", mes.toString());
    params.append("año", año.toString());
    if (forceRecalculate) {
      params.append("forceRecalculate", forceRecalculate.toString());
    }

    const response = await api.get<ApiResponse<MonthlyRanking>>(
      `/technician-ranking/monthly?${params.toString()}`,
    );
    return response.data.data;
  },

  /**
   * Obtener estadísticas globales del ranking
   */
  getRankingStats: async (): Promise<RankingStats> => {
    const response = await api.get<ApiResponse<RankingStats>>(
      "/technician-ranking/stats",
    );
    return response.data.data;
  },

  /**
   * Obtener evolución histórica de un técnico
   * @param tecnicoId - ID del técnico
   * @param meses - Número de meses a incluir (default: 6)
   */
  getTechnicianEvolution: async (
    tecnicoId: number,
    meses: number = 6,
  ): Promise<TechnicianEvolution> => {
    const response = await api.get<ApiResponse<TechnicianEvolution>>(
      `/technician-ranking/technician/${tecnicoId}/evolution?meses=${meses}`,
    );
    return response.data.data;
  },

  /**
   * Obtener ranking histórico paginado
   * @param params - Parámetros de paginación y filtros
   */
  getHistoricalRanking: async (params?: {
    page?: number;
    limit?: number;
    mes?: number;
    año?: number;
    tecnicoId?: number;
  }): Promise<HistoricalRankingResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.mes) queryParams.append("mes", params.mes.toString());
    if (params?.año) queryParams.append("año", params.año.toString());
    if (params?.tecnicoId)
      queryParams.append("tecnicoId", params.tecnicoId.toString());

    const response = await api.get<ApiResponse<HistoricalRankingResponse>>(
      `/technician-ranking/historical?${queryParams.toString()}`,
    );
    return response.data.data;
  },

  /**
   * Obtener mejores técnicos por categoría
   * @param category - Categoría: 'calificacion' | 'productividad' | 'puntualidad'
   * @param limit - Límite de resultados (default: 5)
   * @param mes - Mes específico (opcional)
   * @param año - Año específico (opcional)
   */
  getTopByCategory: async (
    category: "calificacion" | "productividad" | "puntualidad",
    limit?: number,
    mes?: number,
    año?: number,
  ): Promise<TechnicianRankingData[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (mes) params.append("mes", mes.toString());
    if (año) params.append("año", año.toString());

    const url = `/technician-ranking/top/${category}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get<ApiResponse<TechnicianRankingData[]>>(url);
    return response.data.data;
  },

  /**
   * Forzar recálculo del ranking para un mes específico (solo admin)
   * @param mes - Número del mes (1-12)
   * @param año - Año (ej: 2024)
   */
  recalculateRanking: async (
    mes: number,
    año: number,
  ): Promise<MonthlyRanking> => {
    const response = await api.post<ApiResponse<MonthlyRanking>>(
      `/technician-ranking/recalculate/${mes}/${año}`,
    );
    return response.data.data;
  },
};

export default technicianRankingApi;
