// src/components/dashboard/TechnicianRanking.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import technicianRankingApi from "../../api/technician-ranking";
import type {
  TechnicianRankingData,
  RankingStats,
} from "../../interfaces/TechnicianRankingInterface";
import styles from "../../styles/components/dashboard/TechnicianRanking.module.css";

interface TechnicianRankingProps {
  limit?: number;
  showStats?: boolean;
  className?: string;
}

// Interfaz para la respuesta del backend
interface BackendRankingResponse {
  mes: number;
  año: number;
  fechaCalculo: string;
  topTecnicos: TechnicianRankingData[];
  totalTecnicosEnRanking: number;
}

const TechnicianRanking: React.FC<TechnicianRankingProps> = ({
  limit = 5,
  showStats = true,
  className = "",
}) => {
  const { user, isAdmin } = useAuth();
  const [ranking, setRanking] = useState<TechnicianRankingData[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");

  const isTechnician = user?.role?.nombreRol === "Técnico";
  const isSupervisor = user?.role?.nombreRol === "Supervisor";
  const isSecretaria = user?.role?.nombreRol === "Secretaria";
  const canViewAll = isAdmin || isSupervisor || isSecretaria;

  useEffect(() => {
    loadRankingData();
  }, [selectedMonth]);

  const loadRankingData = async () => {
    setLoading(true);
    setError(null);

    try {
      let rankingData;

      if (selectedMonth === "current") {
        rankingData = await technicianRankingApi.getCurrentRanking();
      } else {
        const [mes, año] = selectedMonth.split("-").map(Number);
        rankingData = await technicianRankingApi.getMonthlyRanking(mes, año);
      }

      let techniciansList: TechnicianRankingData[] = [];

      // Verificar si la respuesta tiene topTecnicos (backend) o ranking (frontend esperado)
      if (rankingData && "topTecnicos" in rankingData) {
        techniciansList = (rankingData as unknown as BackendRankingResponse)
          .topTecnicos;
      } else if (rankingData && "ranking" in rankingData) {
        techniciansList = (rankingData as any).ranking;
      }

      // 🔥 FILTRO PARA TÉCNICOS: Solo mostrar su propia información
      if (isTechnician && user?.usuarioId) {
        techniciansList = techniciansList.filter(
          (t: TechnicianRankingData) => t.tecnicoId === user.usuarioId,
        );
      }

      setRanking(techniciansList.slice(0, limit));

      if (showStats) {
        try {
          const statsData = await technicianRankingApi.getRankingStats();

          // 🔥 FILTRO PARA TÉCNICOS en estadísticas
          if (isTechnician && user?.usuarioId && statsData) {
            // Crear estadísticas personalizadas para el técnico
            const technicianStats = {
              totalTecnicosActivos: 1,
              promedioGeneral: statsData.promedioGeneral || 0,
              mejorCalificacionMes: statsData.mejorCalificacionMes || 0,
              tecnicoDelMes:
                statsData.tecnicoDelMes?.tecnicoId === user.usuarioId
                  ? statsData.tecnicoDelMes
                  : null,
              ordenesPromedioPorTecnico:
                statsData.ordenesPromedioPorTecnico || 0,
            };
            setStats(technicianStats);
          } else {
            setStats(statsData);
          }
        } catch (statsErr) {
          console.error("Error cargando estadísticas:", statsErr);
        }
      }
    } catch (err) {
      console.error("Error cargando ranking:", err);
      setError("Error al cargar el ranking de técnicos");
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === "up") {
      return <ArrowTrendingUpIcon className={styles.tendenciaUp} />;
    }
    if (tendencia === "down") {
      return <ArrowTrendingDownIcon className={styles.tendenciaDown} />;
    }
    return <MinusIcon className={styles.tendenciaStable} />;
  };

  const getMedalla = (puesto: number) => {
    if (puesto === 1) return "🥇";
    if (puesto === 2) return "🥈";
    if (puesto === 3) return "🥉";
    return null;
  };

  const renderEstrellas = (calificacion: number) => {
    const estrellas = [];
    const califRedondeada = Math.round(calificacion * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      if (i <= califRedondeada) {
        estrellas.push(
          <StarIconSolid key={i} className={styles.estrellaLlena} />,
        );
      } else if (i - 0.5 === califRedondeada) {
        estrellas.push(
          <div key={i} className={styles.estrellaMedia}>
            <StarIconSolid className={styles.estrellaMediaFondo} />
            <StarIconSolid className={styles.estrellaMediaMitad} />
          </div>,
        );
      } else {
        estrellas.push(<StarIcon key={i} className={styles.estrellaVacia} />);
      }
    }

    return <div className={styles.estrellas}>{estrellas}</div>;
  };

  const mesesOptions = [
    { value: "current", label: "Mes actual" },
    ...Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i - 1);
      const mes = date.getMonth() + 1;
      const año = date.getFullYear();
      return {
        value: `${mes}-${año}`,
        label: date.toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        }),
      };
    }),
  ];

  // Si es técnico y no hay datos, mostrar mensaje
  if (isTechnician && !loading && ranking.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <TrophyIcon className={styles.headerIcon} />
            <h3 className={styles.title}>Mi Rendimiento</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          <p>No hay datos de rendimiento para el período seleccionado</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando ranking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={loadRankingData} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <TrophyIcon className={styles.headerIcon} />
          <h3 className={styles.title}>
            {isTechnician ? "Mi Rendimiento" : "Ranking de Técnicos"}
          </h3>
        </div>

        {canViewAll && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={styles.monthSelect}
          >
            {mesesOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {showStats && stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <UserGroupIcon />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {isTechnician ? "Mi puesto" : stats.totalTecnicosActivos}
              </span>
              <span className={styles.statLabel}>
                {isTechnician ? "Posición actual" : "Técnicos Activos"}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <StarIcon />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {(stats.promedioGeneral || 0).toFixed(1)}
              </span>
              <span className={styles.statLabel}>
                {isTechnician ? "Mi promedio" : "Promedio General"}
              </span>
            </div>
          </div>

          {stats.tecnicoDelMes && (
            <div className={`${styles.statCard} ${styles.tecnicoDelMes}`}>
              <div className={styles.statIcon}>
                <TrophyIcon />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {isTechnician &&
                  stats.tecnicoDelMes.tecnicoId === user?.usuarioId
                    ? "¡Eres el técnico del mes!"
                    : `${stats.tecnicoDelMes.nombre} ${stats.tecnicoDelMes.apellido || ""}`}
                </span>
                <span className={styles.statLabel}>Técnico del Mes</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.rankingList}>
        {ranking.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No hay datos de ranking para este período</p>
          </div>
        ) : (
          ranking.map((tecnico) => (
            <div key={tecnico.tecnicoId} className={styles.rankingItem}>
              <div className={styles.puestoContainer}>
                <span className={styles.puesto}>
                  {getMedalla(tecnico.puesto) || `#${tecnico.puesto}`}
                </span>
                {getTendenciaIcon(tecnico.tendencia)}
                {tecnico.variacionPuesto !== 0 && (
                  <span
                    className={`${styles.variacion} ${
                      tecnico.variacionPuesto > 0
                        ? styles.variacionPositiva
                        : styles.variacionNegativa
                    }`}
                  >
                    {tecnico.variacionPuesto > 0 ? "+" : ""}
                    {tecnico.variacionPuesto}
                  </span>
                )}
              </div>

              <div className={styles.tecnicoInfo}>
                <div className={styles.tecnicoNombre}>
                  {tecnico.nombre} {tecnico.apellido || ""}
                  {isTechnician && tecnico.tecnicoId === user?.usuarioId && (
                    <span className={styles.miMarca}> (Tú)</span>
                  )}
                </div>
                <div className={styles.tecnicoMetrics}>
                  {renderEstrellas(tecnico.metrics?.calificacionPromedio || 0)}
                  <span className={styles.metricValue}>
                    {(tecnico.metrics?.calificacionPromedio || 0).toFixed(1)}
                  </span>
                </div>
                <div className={styles.metricsDetails}>
                  <div className={styles.metric}>
                    <ClipboardDocumentListIcon className={styles.metricIcon} />
                    <span>{tecnico.metrics?.totalOrdenes || 0} órdenes</span>
                  </div>
                  <div className={styles.metric}>
                    <ClockIcon className={styles.metricIcon} />
                    <span>
                      Puntualidad:{" "}
                      {(tecnico.metrics?.puntualidad || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.puntajeContainer}>
                <span className={styles.puntajeLabel}>Puntaje</span>
                <span className={styles.puntajeValor}>
                  {tecnico.puntajeTotal || 0}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TechnicianRanking;
