import DashboardLayout from "../components/layout/DashboardLayout";
import ServicesCard from "../components/ServicesCard";
import type { Service } from "../interfaces/ServicesInterface";
import Pagination from "../components/Pagination";
import { useAuth } from "../hooks/useAuth";
import {
  getServicesRequest,
  getMyServicesRequest,
  getServicesMetricsRequest,
} from "../api/services";
import type { ServiceFromAPI } from "../interfaces/ServicesInterface";
import styles from "../styles/pages/DashboardPage.module.css";

import {
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

// ==== SG-SST ====
import sgSstService from "../api/sg-sst";
import type { SgSstForm } from "../interfaces/SgSstInterface";
import { playErrorSound } from "../utils/sounds";

// Función para mapear orden de API a interface del componente
const mapServiceFromAPI = (service: ServiceFromAPI): Service => ({
  orden_id: service.orden_id,
  servicio: {
    nombre_servicio: service.servicio.nombre_servicio,
    precio_base: service.servicio.precio_base,
    duracion_estimada: service.servicio.duracion_estimada || undefined,
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

// Función para ordenar Ordenes según el criterio especificado
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

  // Rol SGSST (ajustar el string "SGSST" si en tu backend se llama distinto)
  const isSgSst = user?.role?.nombreRol === "SGSST";
  const isClient = user?.role?.nombreRol === "Cliente";

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 8;

  // Métricas extendidas
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    completedServices: 0,
    inProgressServices: 0,
    pendingServices: 0,
    unassignedServices: 0,
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
    },
    technicians: [] as {
      tecnico_id: number;
      nombre: string;
      apellido: string | null;
      total_servicios: number;
      completados: number;
    }[],
  });

  // ====== Estado SG-SST: formularios pendientes de firma por SG-SST ======
  const [sgSstForms, setSgSstForms] = useState<SgSstForm[]>([]);
  const [sgSstLoading, setSgSstLoading] = useState(false);
  const [sgSstError, setSgSstError] = useState<string | null>(null);

  // Cargar datos del dashboard de Ordenes (solo si NO es SGSST)
  useEffect(() => {
    if (!isAuthenticated || authLoading || isSgSst) return;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar métricas
        const metricsData = await getServicesMetricsRequest();

        let servicesData: ServiceFromAPI[];

        // Cargar Ordenes según el rol
        if (isAdmin) {
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

        // Actualizar métricas (extended)
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
          totalRevenue: metricsData.ingresos_totales,
          completedThisMonth: metricsData.completadas_este_mes,
          statusCounts: {
            unassigned: metricsData.status_counts?.solicitada_sin_asignar ?? 0,
            assigned: metricsData.status_counts?.solicitada_asignada ?? 0,
            inProgress: metricsData.status_counts?.en_proceso ?? 0,
            completed: metricsData.status_counts?.completado ?? 0,
            canceled: metricsData.status_counts?.cancelado ?? 0,
          },
          technicians: metricsData.technicians || [],
        });

        // Mapear y ordenar Ordenes
        const mappedServices = servicesData.map(mapServiceFromAPI);
        const sortedServices = sortServices(mappedServices);

        setServices(sortedServices);

        // Extraer estados únicos para el filtro
        const uniqueStatuses = Array.from(
          new Set(servicesData.map((service) => service.estado))
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
    isAuthenticated,
    authLoading,
    isSgSst,
    searchTerm,
    selectedStatus,
    startDate,
    endDate,
  ]);

  // Cargar formularios SG-SST pendientes de firma por SG-SST (solo rol SGSST)
  useEffect(() => {
    if (!isAuthenticated || authLoading || !isSgSst) return;

    const loadSgSstForms = async () => {
      setSgSstLoading(true);
      setSgSstError(null);
      try {
        // Formularios con estado PENDING_SST
        const response = await sgSstService.getFormsByStatus("PENDING_SST");
        const forms = response.data || [];

        // Solo los que NO tienen firma SG-SST
        const unsignedBySst = forms.filter(
          (form: SgSstForm) => !form.sstSignatureDate
        );

        setSgSstForms(unsignedBySst);
      } catch (err) {
        console.error("Error cargando formularios SG-SST:", err);
        setSgSstError(
          "Error al cargar los reportes SG-SST pendientes de firma."
        );
      } finally {
        setSgSstLoading(false);
      }
    };

    loadSgSstForms();
  }, [isAuthenticated, authLoading, isSgSst]);

  // Filtro de Ordenes (solo tiene efecto cuando no es SGSST)
  useEffect(() => {
    const filtered = services.filter((service) => {
      const clienteNombre = `${service.cliente.nombre} ${
        service.cliente.apellido || ""
      }`.toLowerCase();
      const tecnicoNombre = service.tecnico
        ? `${service.tecnico.nombre} ${
            service.tecnico.apellido || ""
          }`.toLowerCase()
        : "";

      const matchesSearch =
        clienteNombre.includes(searchTerm.toLowerCase()) ||
        service.servicio.nombre_servicio
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        tecnicoNombre.includes(searchTerm.toLowerCase()) ||
        service.orden_id.toString().includes(searchTerm);

      const matchesStatus =
        selectedStatus === "" || service.estado === selectedStatus;

      const serviceDate = service.fecha_inicio || service.fecha_solicitud;
      const matchesStartDate = !startDate || serviceDate >= new Date(startDate);
      const matchesEndDate = !endDate || serviceDate <= new Date(endDate);

      return (
        matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
      );
    });

    setFilteredServices(filtered);
    setCurrentPage(1);
  }, [services, searchTerm, selectedStatus, startDate, endDate]);

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(
    indexOfFirstService,
    indexOfLastService
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getCompletionPercentage = () => {
    const total = isAdmin ? metrics.totalServices : metrics.myServices;
    const completed = metrics.completedServices;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

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

  // Mostrar loading mientras verifica autenticación
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
              {isAdmin ? (
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
                ? "Resumen general y gestión de Ordenes técnicos"
                : isSgSst
                ? "Reportes SG-SST pendientes de firma"
                : isClient
                ? `Mis Ordenes - ${user?.nombre} ${user?.apellido || ""}` 
                : `Mis Ordenes asignados - ${user?.nombre} ${
                    user?.apellido || ""
                  }`}
            </p>
          </div>
          <div className={styles.userInfo}>
            {isAdmin ? (
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
                <UserIcon className={styles.userIcon} />
                <span className={styles.userRole}>Cliente</span>
              </>
            ) : (
              <>
                <UserIcon className={styles.userIcon} />
                <span className={styles.userRole}>Técnico</span>
              </>
            )}
          </div>
        </div>

        {/* ==== Sección SG-SST: Reportes pendientes de firma (solo rol SG-SST) ==== */}
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

        {/* ==== TODO lo de Ordenes SOLO si NO es SGSST ==== */}
        {!isSgSst && (
          <>
            {/* Métricas de Ordenes */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>
                    {isAdmin ? "Total Ordenes" : "Mis Ordenes"}
                  </div>
                  <ClipboardDocumentListIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {isAdmin ? metrics.totalServices : metrics.myServices}
                </div>
                <div className={styles.metricDescription}>
                  {isAdmin ? "Ordenes activos" : isClient ? "Mis Ordenes activas" : "Asignados a mí"}
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricTitle}>En Proceso</div>
                  <ClockIcon className={styles.metricIcon} />
                </div>
                <div className={styles.metricValue}>
                  {metrics.inProgressServices}
                </div>
                <div className={styles.metricDescription}>Por completar</div>
              </div>

              {isAdmin && (
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <div className={styles.metricTitle}>Sin Asignar</div>
                    <ExclamationTriangleIcon className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>
                    {metrics.unassignedServices}
                  </div>
                  <div className={styles.metricDescription}>
                    Solicitadas sin asignar
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <div className={styles.metricTitle}>Asignadas</div>
                    <ClipboardDocumentListIcon className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>
                    {metrics.assignedPendingServices}
                  </div>
                  <div className={styles.metricDescription}>
                    Solicitadas con técnico asignado
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className={styles.metricCard}>
                  <div className={styles.metricHeader}>
                    <div className={styles.metricTitle}>Finalizados</div>
                    <CheckCircleIcon className={styles.metricIcon} />
                  </div>
                  <div className={styles.metricValue}>
                    {metrics.completedServices}
                  </div>
                  <div className={styles.metricDescription}>
                    {getCompletionPercentage()}%{" "}
                    {isAdmin ? "del total" : "completados"} ·{" "}
                    {metrics.completedThisMonth} este mes
                  </div>
                </div>
              )}

              {/* Métricas de facturación / ingresos solo para Admin */}
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

            {/* Gráfica de barras por estado - SOLO ADMIN */}
            {isAdmin && (
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
                        (item.value / maxStatusValue) * 100
                      );
                      return (
                        <div className={styles.barChartRow} key={item.key}>
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

            {/* Métrica de técnicos (solo admin) */}
            {isAdmin && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>
                    <UsersIcon className={styles.sectionIcon} />
                    Ordenes por técnico
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  {metrics.technicians.length > 0 ? (
                    <div className={styles.techList}>
                      {metrics.technicians.map((tech) => (
                        <div key={tech.tecnico_id} className={styles.techItem}>
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
            )}

            {/* Filtros */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <FunnelIcon className={styles.sectionIcon} />
                  Filtros de Ordenes
                </div>
                <button
                  className={styles.clearFiltersButton}
                  onClick={clearFilters}
                >
                  Limpiar Filtros
                </button>
              </div>

              <div className={styles.filtersContainer}>
                <div className={styles.filtersGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <MagnifyingGlassIcon className={styles.filterIcon} />
                      Buscar
                    </label>
                    <input
                      type="text"
                      placeholder="Cliente, orden, técnico o ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <CalendarIcon className={styles.filterIcon} />
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <CalendarIcon className={styles.filterIcon} />
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>
                      <ChartBarIcon className={styles.filterIcon} />
                      Estado
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={styles.selectInput}
                    >
                      <option value="">Todos los estados</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen resultados */}
            <div className={styles.resultsSummary}>
              <div className={styles.resultsCount}>
                {filteredServices.length} Ordenes encontrados
                {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
              </div>
              <div className={styles.activeFilters}>
                {searchTerm && (
                  <span className={styles.filterTag}>
                    Búsqueda: "{searchTerm}"
                  </span>
                )}
                {selectedStatus && (
                  <span className={styles.filterTag}>
                    Estado: {selectedStatus}
                  </span>
                )}
                {(startDate || endDate) && (
                  <span className={styles.filterTag}>
                    Rango: {startDate || "Inicio"} - {endDate || "Fin"}
                  </span>
                )}
              </div>
            </div>

            {/* Lista de Ordenes */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <ClipboardDocumentListIcon className={styles.sectionIcon} />
                  {isAdmin ? "Ordenes Recientes" : "Mis Ordenes"}
                  <span className={styles.orderInfo}></span>
                </div>
              </div>

              <div className={styles.sectionContent}>
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Cargando Ordenes...</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.servicesGrid}>
                      {currentServices.length > 0 ? (
                        currentServices.map((service) => (
                          <ServicesCard
                            key={service.orden_id}
                            service={service}
                          />
                        ))
                      ) : (
                        <div className={styles.noResults}>
                          <div className={styles.noResultsIcon}>📭</div>
                          <h3>No se encontraron Ordenes</h3>
                          <p>Intenta ajustar los filtros de búsqueda</p>
                          <button
                            className={styles.clearFiltersButton}
                            onClick={clearFilters}
                          >
                            Limpiar todos los filtros
                          </button>
                        </div>
                      )}
                    </div>

                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
