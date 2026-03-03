// src/interfaces/TechnicianRankingInterface.ts

export interface TechnicianMetrics {
  calificacionPromedio: number;
  totalOrdenes: number;
  puntualidad: number;
  esLider: number;
}

export interface TechnicianRankingData {
  tecnicoId: number;
  nombre: string;
  apellido?: string;
  avatar?: string;
  metrics: TechnicianMetrics;
  puntajeTotal: number;
  puesto: number;
  tendencia: "up" | "down" | "stable";
  variacionPuesto: number;
}

export interface MonthlyRanking {
  mes: number;
  año: number;
  fechaCalculo: string;
  ranking: TechnicianRankingData[];
  totalTecnicos: number;
}

export interface TechnicianEvolution {
  tecnicoId: number;
  nombre: string;
  apellido?: string;
  historial: Array<{
    mes: number;
    año: number;
    puesto: number;
    puntajeTotal: number;
    calificacionPromedio: number;
    totalOrdenes: number;
  }>;
}

export interface RankingStats {
  totalTecnicosActivos: number;
  promedioGeneral: number;
  mejorCalificacionMes: number;
  tecnicoDelMes: {
    tecnicoId: number;
    nombre: string;
    apellido?: string;
    puntajeTotal: number;
  } | null;
  ordenesPromedioPorTecnico: number;
}

export interface HistoricalRankingResponse {
  data: TechnicianRankingData[];
  total: number;
  page: number;
  limit: number;
  mes?: number;
  año?: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}
