// import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
// import ServicesCard from '../components/ServicesCard';
// import type { Service } from '../interfaces/ServicesInterface';
// import Pagination from '../components/Pagination';
// import { useAuth } from '../hooks/useAuth';
// import {
//   getServicesRequest,
//   getMyServicesRequest,
//   getServicesMetricsRequest
// } from '../api/services';
// import type { ServiceFromAPI } from '../interfaces/ServicesInterface';
// import styles from '../styles/pages/DashboardPage.module.css';
import InProgress from '../components/InProgress';

// Iconos
// import {
//   MagnifyingGlassIcon,
//   CalendarIcon,
//   FunnelIcon,
//   ChartBarIcon,
//   ClipboardDocumentListIcon,
//   ClockIcon,
//   CheckCircleIcon,
//   UserIcon,
//   ShieldCheckIcon,
//   ExclamationTriangleIcon
// } from '@heroicons/react/24/outline';

// Función para mapear servicio de API a interface del componente
// const mapServiceFromAPI = (service: ServiceFromAPI): Service => ({
//   orden_id: service.orden_id,
//   servicio: {
//     nombre_servicio: service.servicio.nombre_servicio,
//     precio_base: service.servicio.precio_base,
//     duracion_estimada: service.servicio.duracion_estimada || undefined
//   },
//   cliente: {
//     nombre: service.cliente.nombre,
//     apellido: service.cliente.apellido || undefined,
//     email: service.cliente.email,
//     telefono: service.cliente.telefono || undefined
//   },
//   tecnico: service.tecnico ? {
//     nombre: service.tecnico.nombre,
//     apellido: service.tecnico.apellido || undefined
//   } : undefined,
//   fecha_solicitud: new Date(service.fecha_solicitud),
//   fecha_inicio: service.fecha_inicio ? new Date(service.fecha_inicio) : undefined,
//   fecha_finalizacion: service.fecha_finalizacion ? new Date(service.fecha_finalizacion) : undefined,
//   estado: service.estado,
//   // Usar valores por defecto si no vienen de la API
//   prioridad: service.prioridad || 'Media',
//   equipo_asignado: service.equipo_asignado || 'Por asignar',
//   comentarios: service.comentarios || undefined
// });

// // Función para ordenar servicios según el criterio especificado
// const sortServices = (services: Service[]): Service[] => {
//   const orderPriority = {
//     'En Proceso': 1,
//     'Pendiente': 2,
//     'Cancelado': 3,
//     'Completado': 4,
//     'Cancelada': 3,
//     'Rechazada': 3
//   };

//   return services.sort((a, b) => {
//     const priorityA = orderPriority[a.estado] || 5;
//     const priorityB = orderPriority[b.estado] || 5;

//     if (priorityA !== priorityB) {
//       return priorityA - priorityB;
//     }

//     return new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime();
//   });
// };

export default function Dashboard() {
//   const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState('');
//   const [services, setServices] = useState<Service[]>([]);
//   const [filteredServices, setFilteredServices] = useState<Service[]>([]);
//   const [statusOptions, setStatusOptions] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const servicesPerPage = 9;

//   // Métricas
//   const [metrics, setMetrics] = useState({
//     totalServices: 0,
//     completedServices: 0,
//     inProgressServices: 0,
//     pendingServices: 0,
//     unassignedServices: 0,
//     cancelledServices: 0,
//     myServices: 0
//   });

//   // Cargar datos del dashboard
//   useEffect(() => {
//     if (!isAuthenticated || authLoading) return;

//     const loadDashboardData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         // Cargar métricas
//         const metricsData = await getServicesMetricsRequest();

//         let servicesData: ServiceFromAPI[];

//         // Cargar servicios según el rol
//         if (isAdmin) {
//           const response = await getServicesRequest({
//             search: searchTerm || undefined,
//             status: selectedStatus || undefined,
//             startDate: startDate || undefined,
//             endDate: endDate || undefined
//           });
//           servicesData = response.services;
//         } else {
//           const response = await getMyServicesRequest({
//             search: searchTerm || undefined,
//             status: selectedStatus || undefined,
//             startDate: startDate || undefined,
//             endDate: endDate || undefined
//           });
//           servicesData = response.services;
//         }

//         // Actualizar métricas
//         setMetrics({
//           totalServices: metricsData.total,
//           completedServices: metricsData.completados,
//           inProgressServices: metricsData.en_proceso,
//           pendingServices: metricsData.pendientes,
//           unassignedServices: metricsData.sin_asignar,
//           cancelledServices: metricsData.cancelados,
//           myServices: metricsData.mis_servicios
//         });

//         // Mapear y ordenar servicios
//         const mappedServices = servicesData.map(mapServiceFromAPI);
//         const sortedServices = sortServices(mappedServices);

//         setServices(sortedServices);

//         // Extraer estados únicos para el filtro
//         const uniqueStatuses = Array.from(new Set(servicesData.map(service => service.estado)));
//         setStatusOptions(uniqueStatuses);

//       } catch (error) {
//         console.error('Error cargando datos del dashboard:', error);
//         setError('Error al cargar los datos. Por favor, intenta nuevamente.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadDashboardData();
//   }, [isAdmin, isAuthenticated, authLoading, searchTerm, selectedStatus, startDate, endDate]);

//   // Filtrar servicios localmente (para búsqueda en tiempo real)
//   useEffect(() => {
//     const filtered = services.filter(service => {
//       const clienteNombre = `${service.cliente.nombre} ${service.cliente.apellido || ''}`.toLowerCase();
//       const tecnicoNombre = service.tecnico ?
//         `${service.tecnico.nombre} ${service.tecnico.apellido || ''}`.toLowerCase() : '';

//       const matchesSearch = clienteNombre.includes(searchTerm.toLowerCase()) ||
//         service.servicio.nombre_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         tecnicoNombre.includes(searchTerm.toLowerCase()) ||
//         service.orden_id.toString().includes(searchTerm);

//       const matchesStatus = selectedStatus === '' || service.estado === selectedStatus;

//       const serviceDate = service.fecha_inicio || service.fecha_solicitud;
//       const matchesStartDate = !startDate || serviceDate >= new Date(startDate);
//       const matchesEndDate = !endDate || serviceDate <= new Date(endDate);

//       return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
//     });

//     setFilteredServices(filtered);
//     setCurrentPage(1);
//   }, [services, searchTerm, selectedStatus, startDate, endDate]);

  // // Paginación
  // const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  // const indexOfLastService = currentPage * servicesPerPage;
  // const indexOfFirstService = indexOfLastService - servicesPerPage;
  // const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);

  // const handleServiceClick = (service: Service) => {
  //   // navigate(`/services/${service.orden_id}`);
  // };

  // const clearFilters = () => {
  //   setSearchTerm('');
  //   setStartDate('');
  //   setEndDate('');
  //   setSelectedStatus('');
  //   setCurrentPage(1);
  // };

  // const handlePageChange = (page: number) => {
  //   setCurrentPage(page);
  // };

  // const getCompletionPercentage = () => {
  //   const total = isAdmin ? metrics.totalServices : metrics.myServices;
  //   const completed = metrics.completedServices;
  //   return total > 0 ? Math.round((completed / total) * 100) : 0;
  // };

  // Mostrar loading mientras verifica autenticación
  // if (authLoading) {
  //   return (
  //     <DashboardLayout>
  //       <div className={styles.loadingContainer}>
  //         <div className={styles.loadingSpinner}></div>
  //         <p>Verificando autenticación...</p>
  //       </div>
  //     </DashboardLayout>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return (
  //     <DashboardLayout>
  //       <div className={styles.errorContainer}>
  //         <h3>No autenticado</h3>
  //         <p>Por favor inicia sesión para acceder al dashboard</p>
  //       </div>
  //     </DashboardLayout>
  //   );
  // }

  return (
    <DashboardLayout>
      <InProgress moduleName="el Módulo de Dashboard"></InProgress>
    </DashboardLayout>
  )
      {/* <div className={styles.container}>
        {error && (
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
              Dashboard Principal
              {isAdmin ? (
                <span className={styles.adminBadge}>
                  <ShieldCheckIcon className={styles.badgeIcon} />
                  Vista Administrador
                </span>
              ) : (
                <span className={styles.userBadge}>Mi Vista</span>
              )}
            </h1>
            <p className={styles.pageSubtitle}>
              {isAdmin
                ? 'Resumen general y gestión de servicios técnicos'
                : `Mis servicios asignados - ${user?.nombre} ${user?.apellido || ''}`
              }
            </p>
          </div>
          <div className={styles.userInfo}>
            {isAdmin ? (
              <>
                <ShieldCheckIcon className={styles.userIcon} />
                <span className={styles.adminRole}>Administrador</span>
              </>
            ) : (
              <>
                <UserIcon className={styles.userIcon} />
                <span className={styles.userRole}>Técnico</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitle}>
                {isAdmin ? 'Total Servicios' : 'Mis Servicios'}
              </div>
              <ClipboardDocumentListIcon className={styles.metricIcon} />
            </div>
            <div className={styles.metricValue}>
              {isAdmin ? metrics.totalServices : metrics.myServices}
            </div>
            <div className={styles.metricDescription}>
              {isAdmin ? 'Servicios activos' : 'Asignados a mí'}
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitle}>En Proceso</div>
              <ClockIcon className={styles.metricIcon} />
            </div>
            <div className={styles.metricValue}>{metrics.inProgressServices}</div>
            <div className={styles.metricDescription}>
              Por completar
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitle}>Sin Asignar</div>
              <ExclamationTriangleIcon className={styles.metricIcon} />
            </div>
            <div className={styles.metricValue}>{metrics.unassignedServices}</div>
            <div className={styles.metricDescription}>
              Por ejecutar
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <div className={styles.metricTitle}>Finalizados</div>
              <CheckCircleIcon className={styles.metricIcon} />
            </div>
            <div className={styles.metricValue}>{metrics.completedServices}</div>
            <div className={styles.metricDescription}>
              {getCompletionPercentage()}% {isAdmin ? 'del total' : 'completados'}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <FunnelIcon className={styles.sectionIcon} />
              Filtros de Servicios
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
                  placeholder="Cliente, servicio, técnico o ID..."
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
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.resultsSummary}>
          <div className={styles.resultsCount}>
            {filteredServices.length} servicios encontrados
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
                Rango: {startDate || 'Inicio'} - {endDate || 'Fin'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <ClipboardDocumentListIcon className={styles.sectionIcon} />
              {isAdmin ? 'Servicios Recientes' : 'Mis Servicios'}
              <span className={styles.orderInfo}>
                (Orden: Por completar → Sin asignar → Cancelado → Finalizado)
              </span>
            </div>
          </div>

          <div className={styles.sectionContent}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Cargando servicios...</p>
              </div>
            ) : (
              <>
                <div className={styles.servicesGrid}>
                  {currentServices.length > 0 ? (
                    currentServices.map(service => (
                      <ServicesCard
                        key={service.orden_id}
                        service={service}
                        onClick={handleServiceClick}
                      />
                    ))
                  ) : (
                    <div className={styles.noResults}>
                      <div className={styles.noResultsIcon}>📭</div>
                      <h3>No se encontraron servicios</h3>
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
      </div>
  );*/}
}