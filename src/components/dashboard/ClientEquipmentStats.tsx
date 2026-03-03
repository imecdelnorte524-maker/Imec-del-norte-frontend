// src/components/dashboard/ClientEquipmentStats.tsx
import { useEffect, useState } from "react";
import { getClientEquipmentRequest } from "../../api/equipment";
import { getEquipmentWorkOrdersRequest } from "../../api/equipment";
import styles from "../../styles/components/dashboard/ClientEquipmentStats.module.css";
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { Area } from "../../interfaces/AreaInterfaces";
import type { SubArea } from "../../interfaces/SubAreaInterfaces";
import { useNavigate } from "react-router-dom";

interface Equipment {
  equipmentId: number;
  code: string;
  category: string;
  status: string;
  area?: Area;
  subArea?: SubArea;
}

interface EquipmentWithWorkOrders extends Equipment {
  hasActiveWorkOrders: boolean;
}

export default function ClientEquipmentStats() {
  const [equipment, setEquipment] = useState<EquipmentWithWorkOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadEquipment();
  }, []);

  const checkActiveWorkOrders = async (
    equipmentId: number,
  ): Promise<boolean> => {
    try {
      const workOrders = await getEquipmentWorkOrdersRequest(equipmentId);

      // 🔥 CORRECCIÓN: Estados activos según la base de datos
      const hasActive = workOrders.some(
        (wo) =>
          wo.workOrderDetails?.estado === "Solicitada sin asignar" || // Pendiente de asignar
          wo.workOrderDetails?.estado === "Solicitada asignada" || // Asignada a técnico
          wo.workOrderDetails?.estado === "En Proceso" || // En proceso
          wo.workOrderDetails?.estado === "En pausa", // Pausada (sigue activa)
      );

      return hasActive;
    } catch (error) {
      console.error(
        `❌ Error verificando órdenes del equipo ${equipmentId}:`,
        error,
      );
      return false;
    }
  };

  const loadEquipment = async () => {
    try {
      setLoading(true);

      const data = await getClientEquipmentRequest();

      if (data.length === 0) {
        setEquipment([]);
        setLoading(false);
        return;
      }
      const equipmentWithWorkOrders = await Promise.all(
        (data as Equipment[]).map(async (eq: Equipment) => {
          const hasActiveWorkOrders = await checkActiveWorkOrders(
            eq.equipmentId,
          );
          return {
            ...eq,
            hasActiveWorkOrders,
          };
        }),
      );

      setEquipment(equipmentWithWorkOrders);
      setError(null);
    } catch (error) {
      console.error("❌ Error cargando equipos:", error);
      setError("No se pudieron cargar los equipos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ExclamationTriangleIcon className={styles.errorIcon} />
        <p>{error}</p>
        <button onClick={loadEquipment} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  // Calcular estadísticas
  const operational = equipment.filter(
    (e: EquipmentWithWorkOrders) =>
      (e.status === "Activo" || e.status === "ACTIVE") &&
      !e.hasActiveWorkOrders,
  ).length;

  const inMaintenance = equipment.filter(
    (e: EquipmentWithWorkOrders) => e.hasActiveWorkOrders,
  ).length;

  const outOfService = equipment.filter(
    (e: EquipmentWithWorkOrders) =>
      e.status === "Fuera de Servicio" || e.status === "OUT_OF_SERVICE",
  ).length;

  const decommissioned = equipment.filter(
    (e: EquipmentWithWorkOrders) =>
      e.status === "Dado de Baja" || e.status === "DECOMMISSIONED",
  ).length;

  const getStatusClass = (eq: EquipmentWithWorkOrders): string => {
    if (eq.hasActiveWorkOrders) return styles.statusMaintenance;

    const statusLower = eq.status?.toLowerCase() || "";
    if (statusLower.includes("activo")) return styles.statusOperational;
    if (statusLower.includes("fuera")) return styles.statusOutOfService;
    if (statusLower.includes("baja")) return styles.statusDecommissioned;
    return "";
  };

  const getStatusText = (eq: EquipmentWithWorkOrders): string => {
    if (eq.hasActiveWorkOrders) return "En mantenimiento";

    const statusLower = eq.status?.toLowerCase() || "";
    if (statusLower.includes("activo")) return "Operativo";
    if (statusLower.includes("fuera")) return "Fuera de servicio";
    if (statusLower.includes("baja")) return "Dado de baja";
    return eq.status;
  };

  const handleOrderClick = () => {
    navigate(`/equipment/`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <CheckCircleIcon className={styles.statIconOperational} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{operational}</span>
            <span className={styles.statLabel}>Operativos</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <WrenchScrewdriverIcon className={styles.statIconMaintenance} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{inMaintenance}</span>
            <span className={styles.statLabel}>En mantenimiento</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <ClockIcon className={styles.statIconOutOfService} />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{outOfService}</span>
            <span className={styles.statLabel}>Fuera de servicio</span>
          </div>
        </div>

        {decommissioned > 0 && (
          <div className={styles.statCard}>
            <XCircleIcon className={styles.statIconDecommissioned} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{decommissioned}</span>
              <span className={styles.statLabel}>Dado de baja</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.equipmentSection}>
        <h4 className={styles.equipmentTitle}>Últimos equipos</h4>
        {equipment.length === 0 ? (
          <p className={styles.emptyMessage}>No hay equipos registrados</p>
        ) : (
          <div className={styles.equipmentList}>
            {equipment.slice(0, 5).map((eq: EquipmentWithWorkOrders) => (
              <div key={eq.equipmentId} className={styles.equipmentItem}>
                <div className={styles.equipmentInfo}>
                  <span className={styles.equipmentCode}>{eq.code}</span>
                  <span className={styles.equipmentCategory}>
                    {eq.category}
                  </span>
                  {eq.area && (
                    <span className={styles.equipmentLocation}>
                      {eq.area.nombreArea}{" "}
                      {eq.subArea && `- ${eq.subArea.nombreSubArea}`}
                    </span>
                  )}
                  {/* Debug: mostrar si tiene órdenes activas */}
                  <span style={{ fontSize: "10px", color: "#999" }}>
                    {eq.hasActiveWorkOrders
                      ? "🟢 Con órdenes"
                      : "⚪ Sin órdenes"}
                  </span>
                </div>
                <span
                  className={`${styles.equipmentStatus} ${getStatusClass(eq)}`}
                >
                  {getStatusText(eq)}
                </span>
              </div>
            ))}
          </div>
        )}
        {equipment.length > 5 && (
          <button
            className={styles.viewAllButton}
            onClick={() => handleOrderClick()}
          >
            Ver todos los equipos
          </button>
        )}
      </div>
    </div>
  );
}
