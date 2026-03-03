// src/pages/Dashboard.tsx
import DashboardLayout from "../components/layout/DashboardLayout";
import type { Service } from "../interfaces/ServicesInterface";
import { useAuth } from "../hooks/useAuth";
import {
  getServicesRequest,
  getMyServicesRequest,
  getServicesMetricsRequest,
} from "../api/services";
import type { ServiceFromAPI } from "../interfaces/ServicesInterface";
import styles from "../styles/pages/DashboardPage.module.css";

import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

// ==== SG-SST ====
import sgSstService from "../api/sg-sst";
import type { SgSstForm } from "../interfaces/SgSstInterface";
import { playErrorSound } from "../utils/sounds";
import TechnicianRanking from "../components/dashboard/TechnicianRanking";
import { OrdersByStatusDrawer } from "../components/dashboard/OrdersByStatusDrawer";
import ClientEquipmentStats from "../components/dashboard/ClientEquipmentStats";

// Función para mapear orden de API a interface del componente
const mapServiceFromAPI = (service: ServiceFromAPI): Service => ({
  orden_id: service.orden_id,
  servicio: {
    nombre_servicio: service.servicio.nombre_servicio,
  },
  cliente: {
    nombre: service.cliente.nombre,
    apellido: service.cliente.apellido || undefined,
    email: service.cliente.email,
    telefono: service.cliente.telefono || undefined,
  },
  tecnico: service.tecnico
    ? {
        nombre: service.tecnico.nombre,
        apellido: service.tecnico.apellido || undefined,
      }
    : undefined,
  fecha_solicitud: new Date(service.fecha_solicitud),
  fecha_inicio: service.fecha_inicio
    ? new Date(service.fecha_inicio)
    : undefined,
  fecha_finalizacion: service.fecha_finalizacion
    ? new Date(service.fecha_finalizacion)
    : undefined,
  estado: service.estado,
  prioridad: service.prioridad || "Media",
  equipo_asignado: service.equipo_asignado || "Por asignar",
  comentarios: service.comentarios || undefined,
});

// Función para ordenar Órdenes
const sortServices = (services: Service[]): Service[] => {
  const orderPriority: Record<string, number> = {
    "En Proceso": 1,
    Pendiente: 2,
    Cancelado: 3,
    Completado: 4,
    Cancelada: 3,
    Rechazada: 3,
  };

  return services.sort((a, b) => {
    const priorityA = orderPriority[a.estado] || 5;
    const priorityB = orderPriority[b.estado] || 5;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return (
      new Date(b.fecha_solicitud).getTime() -
      new Date(a.fecha_solicitud).getTime()
    );
  });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// ==== Utilidades SG-SST ====
const formatSgSstDateTime = (value: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getFormTypeLabel = (type: SgSstForm["formType"]): string => {
  switch (type) {
    case "ATS":
      return "ATS";
    case "HEIGHT_WORK":
      return "Trabajo en Alturas";
    case "PREOPERATIONAL":
      return "Preoperacional";
    default:
      return type;
  }
};

export default function Dashboard() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const isSgSst = user?.role?.nombreRol === "SGSST";
  const isClient = user?.role?.nombreRol === "Cliente";
  const isSecretaria = user?.role.nombreRol === "Secretaria";
  const isTechnician = !isAdmin && !isSgSst && !isClient && !isSecretaria;

  const [searchTerm] = useState("");
  const [startDate] = useState("");
  const [endDate] = useState("");
  const [selectedStatus] = useState("");
  const [, setServices] = useState<Service[]>([]);
  const [, setStatusOptions] = useState<string[]>([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    statusValue: string;
    color: string;
  } | null>(null);

  // Métricas
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    completedServices: 0,
    inProgressServices: 0,
    pendingServices: 0,
    unassignedServices: 0,
    pausedServices: 0,
    assignedPendingServices: 0,
    cancelledServices: 0,
    myServices: 0,
    billedServices: 0,
    notBilledServices: 0,
    totalRevenue: 0,
    completedThisMonth: 0,
    statusCounts: {
      unassigned: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      canceled: 0,
      paused: 0,
    },
    technicians: [] as {
      tecnico_id: number;
      nombre: string;
      apellido: string | null;
      total_servicios: number;
      completados: number;
    }[],
  });

  // Estado SG-SST
  const [sgSstForms, setSgSstForms] = useState<SgSstForm[]>([]);
  const [sgSstLoading, setSgSstLoading] = useState(false);
  const [sgSstError, setSgSstError] = useState<string | null>(null);

  // Datos para la gráfica de barras
  const statusBarData = [
    {
      key: "unassigned",
      label: "Sin asignar",
      value: metrics.statusCounts.unassigned,
      className: styles.barUnassigned,
    },
    {
      key: "assigned",
      label: "Asignadas",
      value: metrics.statusCounts.assigned,
      className: styles.barAssigned,
    },
    {
      key: "inProgress",
      label: "En Proceso",
      value: metrics.statusCounts.inProgress,
      className: styles.barInProgress,
    },
    {
      key: "paused",
      label: "En pausa",
      value: metrics.statusCounts.paused,
      className: styles.barPaused,
    },
    {
      key: "completed",
      label: "Completadas",
      value: metrics.statusCounts.completed,
      className: styles.barCompleted,
    },
    {
      key: "canceled",
      label: "Canceladas",
      value: metrics.statusCounts.canceled,
      className: styles.barCanceled,
    },
  ];

  const maxStatusValue = Math.max(...statusBarData.map((d) => d.value), 0) || 1;

  // Cargar datos
  useEffect(() => {
    if (!isAuthenticated || authLoading || isSgSst) return;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const metricsData = await getServicesMetricsRequest();

        let servicesData: ServiceFromAPI[];

        if (isAdmin || isSecretaria) {
          const response = await getServicesRequest({
            search: searchTerm || undefined,
            status: selectedStatus || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
          servicesData = response.services;
        } else {
          const response = await getMyServicesRequest({
            search: searchTerm || undefined,
            status: selectedStatus || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
          servicesData = response.services;
        }

        setMetrics({
          totalServices: metricsData.total,
          completedServices: metricsData.completados,
          inProgressServices: metricsData.en_proceso,
          pendingServices: metricsData.pendientes,
          unassignedServices: metricsData.sin_asignar,
          assignedPendingServices: metricsData.asignadas,
          cancelledServices: metricsData.cancelados,
          myServices: metricsData.mis_servicios,
          billedServices: metricsData.facturadas,
          notBilledServices: metricsData.no_facturadas,
          pausedServices: metricsData.pausados,
          totalRevenue: metricsData.ingresos_totales,
          completedThisMonth: metricsData.completadas_este_mes,
          statusCounts: {
            unassigned: metricsData.status_counts?.solicitada_sin_asignar ?? 0,
            assigned: metricsData.status_counts?.solicitada_asignada ?? 0,
            inProgress: metricsData.status_counts?.en_proceso ?? 0,
            completed: metricsData.status_counts?.completado ?? 0,
            canceled: metricsData.status_counts?.cancelado ?? 0,
            paused: metricsData.status_counts?.pausado ?? 0,
          },
          technicians: metricsData.technicians || [],
        });

        const mappedServices = servicesData.map(mapServiceFromAPI);
        const sortedServices = sortServices(mappedServices);
        setServices(sortedServices);

        const uniqueStatuses = Array.from(
          new Set(servicesData.map((service) => service.estado)),
        );
        setStatusOptions(uniqueStatuses);
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
        setError("Error al cargar los datos. Por favor, intenta nuevamente.");
        playErrorSound();
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [
    isAdmin,
    isSecretaria,
    isAuthenticated,
    authLoading,
    isSgSst,
    searchTerm,
    selectedStatus,
    startDate,
    endDate,
  ]);

  // Cargar SG-SST
  useEffect(() => {
    if (!isAuthenticated || authLoading || !isSgSst) return;

    const loadSgSstForms = async () => {
      setSgSstLoading(true);
      setSgSstError(null);
      try {
        const response = await sgSstService.getFormsByStatus("PENDING_SST");
        const forms = response.data || [];
        const unsignedBySst = forms.filter(
          (form: SgSstForm) => !form.sstSignatureDate,
        );
        setSgSstForms(unsignedBySst);
      } catch (err) {
        console.error("Error cargando formularios SG-SST:", err);
        setSgSstError(
          "Error al cargar los reportes SG-SST pendientes de firma.",
        );
      } finally {
        setSgSstLoading(false);
      }
    };

    loadSgSstForms();
  }, [isAuthenticated, authLoading, isSgSst]);

  const handleMetricClick = (metric: {
    title: string;
    statusValue: string;
    color: string;
  }) => {
    setSelectedMetric(metric);
    setDrawerOpen(true);
  };

  const getCompletionPercentage = () => {
    const total = isAdmin ? metrics.totalServices : metrics.myServices;
    const completed = metrics.completedServices;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getMonthlyProgress = () => {
    return Math.min(Math.round((metrics.completedThisMonth / 10) * 100), 100);
  };

  // Loading
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Verificando autenticación...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className={styles.errorContainer}>
          <h3>No autenticado</h3>
          <p>Por favor inicia sesión para acceder al dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {error && !isSgSst && (
          <div className={styles.errorBanner}>
            <div className={styles.errorContent}>
              <ExclamationTriangleIcon className={styles.errorIcon} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              {isAdmin && isSecretaria ? (
                <span className={styles.adminBadge}>
                  <ShieldCheckIcon className={styles.badgeIcon} />
                  Vista Secretaria
                </span>
              ) : isAdmin ? (
                <span className={styles.adminBadge}>
                  <ShieldCheckIcon className={styles.badgeIcon} />
                  Vista Administrador
                </span>
              ) : isSgSst ? (
                <span className={styles.sgsstBadge}>
                  <ShieldCheckIcon className={styles.badgeIcon} />
                  Vista SG-SST
                </span>
              ) : (
                <span className={styles.userBadge}>Mi Vista</span>
              )}
            </h1>
            <p className={styles.pageSubtitle}>
              {isAdmin
                ? "Resumen general y gestión de órdenes de servicio"
                : isSgSst
                  ? "Reportes SG-SST pendientes de firma"
                  : isClient
                    ? `Mis órdenes - ${user?.nombre} ${user?.apellido || ""}`
                    : `Mis órdenes asignadas - ${user?.nombre} ${
                        user?.apellido || ""
                      }`}
            </p>
          </div>
          <div className={styles.userInfo}>
            {isAdmin && isSecretaria ? (
              <>
                <ShieldCheckIcon className={styles.userIcon} />
                <span className={styles.adminRole}>Secretaria</span>
              </>
            ) : isAdmin ? (
              <>
                <ShieldCheckIcon className={styles.userIcon} />
                <span className={styles.adminRole}>Administrador</span>
              </>
            ) : isSgSst ? (
              <>
                <ShieldCheckIcon className={styles.userIcon} />
                <span className={styles.sgsstRole}>SG-SST</span>
              </>
            ) : isClient ? (
              <>
                <BuildingOfficeIcon className={styles.userIcon} />
                <span className={styles.userRole}>Cliente</span>
              </>
            ) : (
              <>
                <BriefcaseIcon className={styles.userIcon} />
                <span className={styles.userRole}>Técnico</span>
              </>
            )}
          </div>
        </div>

        {/* SG-SST Section - SOLO PARA SGSST */}
        {isSgSst && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <ShieldCheckIcon className={styles.sectionIcon} />
                Reportes SG-SST pendientes de firma
              </div>
            </div>
            <div className={styles.sectionContent}>
              {sgSstLoading ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p>Cargando reportes SG-SST...</p>
                </div>
              ) : sgSstError ? (
                <div className={styles.sgSstError}>{sgSstError}</div>
              ) : sgSstForms.length === 0 ? (
                <p className={styles.sgSstEmpty}>
                  No hay reportes pendientes de firma por SG-SST.
                </p>
              ) : (
                <div className={styles.sgSstTableWrapper}>
                  <table className={styles.sgSstTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Creado por</th>
                        <th>Fecha creación</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sgSstForms.map((form) => (
                        <tr key={form.id}>
                          <td>#{form.id}</td>
                          <td>
                            <span className={styles.sgSstTypeBadge}>
                              {getFormTypeLabel(form.formType)}
                            </span>
                          </td>
                          <td>
                            {form.user
                              ? `${form.user.nombre} ${
                                  form.user.apellido || ""
                                }`
                              : "N/D"}
                          </td>
                          <td>{formatSgSstDateTime(form.createdAt)}</td>
                          <td>
                            <span className={styles.sgSstStatusBadge}>
                              Pendiente firma SG-SST
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARD PRINCIPAL - PARA TODOS EXCEPTO SGSST */}
        {!isSgSst && (
          <>
            {/* MÉTRICAS PRINCIPALES */}
            <div className={styles.metricsGrid}>
              {/* Total/Mis Órdenes - Para TODOS */}
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>
                    {isAdmin ? "Total Órdenes" : "Mis Órdenes"}
                  </div>
                  <ClipboardDocumentListIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {isAdmin ? metrics.totalServices : metrics.myServices}
                </div>
                <div className={styles.metricDescription}>
                  {isAdmin
                    ? "Órdenes en el sistema"
                    : isClient
                      ? "Mis órdenes solicitadas"
                      : "Órdenes asignadas a mí"}
                </div>
              </div>

              {/* MÉTRICAS ADMIN - Solo Admin y Secretaria */}
              {(isAdmin || isSecretaria) && (
                <>
                  <div
                    className={styles.metricCard}
                    onClick={() =>
                      handleMetricClick({
                        title: "Sin Asignar",
                        statusValue: "Solicitada sin asignar",
                        color: "#fbbf24",
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.metricHeader}>
                      <div className={styles.metricTitle}>Sin Asignar</div>
                      <ExclamationTriangleIcon className={styles.metricIcon} />
                    </div>
                    <div className={styles.metricValue}>
                      {metrics.unassignedServices}
                    </div>
                    <div className={styles.metricDescription}>
                      Solicitadas sin técnico
                    </div>
                  </div>

                  <div
                    className={styles.metricCard}
                    onClick={() =>
                      handleMetricClick({
                        title: "Asignadas",
                        statusValue: "Solicitada asignada",
                        color: "#a855f7",
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className={styles.metricHeader}>
                      <div className={styles.metricTitle}>Asignadas</div>
                      <ClipboardDocumentListIcon
                        className={styles.metricIcon}
                      />
                    </div>
                    <div className={styles.metricValue}>
                      {metrics.assignedPendingServices}
                    </div>
                    <div className={styles.metricDescription}>
                      Con técnico asignado
                    </div>
                  </div>
                </>
              )}

              {/* En Proceso - Para TODOS */}
              <div
                className={styles.metricCard}
                onClick={() =>
                  handleMetricClick({
                    title: "En Proceso",
                    statusValue: "En Proceso",
                    color: "#60a5fa",
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>En Proceso</div>
                  <ClockIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {metrics.inProgressServices}
                </div>
                <div className={styles.metricDescription}>
                  {isAdmin ? "Órdenes en ejecución" : "Mis órdenes en curso"}
                </div>
              </div>

              {/* En Pausa - Para TODOS */}
              <div
                className={styles.metricCard}
                onClick={() =>
                  handleMetricClick({
                    title: "En Pausa",
                    statusValue: "En pausa",
                    color: "#06d99d",
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>En Pausa</div>
                  <ClockIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {metrics.pausedServices}
                </div>
                <div className={styles.metricDescription}>
                  {isAdmin ? "Órdenes pausadas" : "Mis órdenes en pausa"}
                </div>
              </div>

              {/* Finalizados - Para TODOS */}
              <div
                className={styles.metricCard}
                onClick={() =>
                  handleMetricClick({
                    title: "Finalizados",
                    statusValue: "Completado",
                    color: "#22c55e",
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>Finalizados</div>
                  <CheckCircleIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {metrics.completedServices}
                </div>
                <div className={styles.metricDescription}>
                  {getCompletionPercentage()}% completados ·{" "}
                  {metrics.completedThisMonth} este mes
                </div>
              </div>

              {/* MÉTRICAS TÉCNICO - Solo para técnicos */}
              {isTechnician && (
                <div
                  className={styles.metricCard}
                  onClick={() =>
                    handleMetricClick({
                      title: "Completadas este mes",
                      statusValue: "Completado",
                      color: "#22c55e",
                    })
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className={styles.metricHeader}>
                    <div className={styles.metricTitle}>
                      Completadas este mes
                    </div>
                    <CheckCircleIcon className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>
                    {metrics.completedThisMonth}
                  </div>
                  <div className={styles.metricDescription}>
                    {new Date().toLocaleDateString("es-CO", { month: "long" })}
                  </div>
                </div>
              )}

              {/* MÉTRICAS ADMIN - Facturación (solo admin) */}
              {isAdmin && (
                <>
                  <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                      <div className={styles.metricTitle}>Facturadas</div>
                      <DocumentCheckIcon className={styles.metricIcon} />
                    </div>
                    <div className={styles.metricValue}>
                      {metrics.billedServices}
                    </div>
                    <div className={styles.metricDescription}>
                      Órdenes con factura emitida
                    </div>
                  </div>

                  <div className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                      <div className={styles.metricTitle}>Ingresos Totales</div>
                      <BanknotesIcon className={styles.metricIcon} />
                    </div>
                    <div className={styles.metricValue}>
                      {formatCurrency(metrics.totalRevenue)}
                    </div>
                    <div className={styles.metricDescription}>
                      En órdenes finalizadas
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* GRÁFICA DE BARRAS - Solo Admin y Secretaria */}
            {(isAdmin || isSecretaria) && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <ChartBarIcon className={styles.sectionIcon} />
                    Distribución por estado
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.barChart}>
                    {statusBarData.map((item) => {
                      const widthPercent = Math.round(
                        (item.value / maxStatusValue) * 100,
                      );
                      return (
                        <div
                          className={styles.barChartRow}
                          key={item.key}
                          onClick={() =>
                            handleMetricClick({
                              title: item.label,
                              statusValue:
                                item.key === "unassigned"
                                  ? "Solicitada sin asignar"
                                  : item.key === "assigned"
                                    ? "Solicitada asignada"
                                    : item.key === "inProgress"
                                      ? "En Proceso"
                                      : item.key === "paused"
                                        ? "En pausa"
                                        : item.key === "completed"
                                          ? "Completado"
                                          : "Cancelado",
                              color:
                                item.key === "unassigned"
                                  ? "#fbbf24"
                                  : item.key === "assigned"
                                    ? "#a855f7"
                                    : item.key === "inProgress"
                                      ? "#60a5fa"
                                      : item.key === "paused"
                                        ? "#06d99d"
                                        : item.key === "completed"
                                          ? "#22c55e"
                                          : "#f97373",
                            })
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <div className={styles.barLabel}>{item.label}</div>
                          <div className={styles.barTrack}>
                            <div
                              className={`${styles.barFill} ${item.className}`}
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <div className={styles.barValue}>{item.value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN CLIENTE - Equipos asociados (solo para clientes) */}
            {isClient && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <BuildingOfficeIcon className={styles.sectionIcon} />
                    Mis Equipos
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <ClientEquipmentStats />
                </div>
              </div>
            )}

            {/* SECCIÓN TÉCNICO - Rendimiento (solo técnico) */}
            {isTechnician && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <ChartBarIcon className={styles.sectionIcon} />
                    Mi rendimiento mensual
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.performanceStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        Completadas este mes
                      </span>
                      <span className={styles.statValue}>
                        {metrics.completedThisMonth}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>En proceso</span>
                      <span className={styles.statValue}>
                        {metrics.inProgressServices}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>En pausa</span>
                      <span className={styles.statValue}>
                        {metrics.pausedServices}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        Tasa de completados
                      </span>
                      <span className={styles.statValue}>
                        {metrics.myServices > 0
                          ? Math.round(
                              (metrics.completedServices / metrics.myServices) *
                                100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className={styles.monthlyProgress}>
                    <div className={styles.progressLabel}>
                      <span>Progreso mensual (meta: 10 órdenes)</span>
                      <span>{getMonthlyProgress()}%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${getMonthlyProgress()}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN ADMIN - Estadísticas de técnicos (solo admin) */}
            {isAdmin && (
              <>
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitle}>
                      <UsersIcon className={styles.sectionIcon} />
                      Órdenes por técnico
                    </div>
                  </div>
                  <div className={styles.sectionContent}>
                    {metrics.technicians.length > 0 ? (
                      <div className={styles.techList}>
                        {metrics.technicians.map((tech) => (
                          <div
                            key={tech.tecnico_id}
                            className={styles.techItem}
                          >
                            <div className={styles.techName}>
                              {tech.nombre} {tech.apellido || ""}
                            </div>
                            <div className={styles.techStats}>
                              <span>
                                Total: <strong>{tech.total_servicios}</strong>
                              </span>
                              <span>
                                Completados: <strong>{tech.completados}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.techEmpty}>
                        No hay datos de técnicos aún.
                      </p>
                    )}
                  </div>
                </div>

                {/* Ranking de técnicos - solo admin */}
                <div className={styles.section}>
                  <TechnicianRanking
                    limit={5}
                    showStats={true}
                    className={styles.rankingWidget}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* DRAWER DE ÓRDENES POR ESTADO - Para todos */}
        <OrdersByStatusDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          statusConfig={selectedMetric}
        />
      </div>
    </DashboardLayout>
  );
}
