import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useOrders } from "../../hooks/useOrders";
import { useCompanyFilters } from "../../hooks/useCompanyFilters";
import { useAuth } from "../../hooks/useAuth";
import type { Order } from "../../interfaces/OrderInterfaces";
import { getStatusClass } from "../../utils/statusUtils";
import styles from "../../styles/components/orders/OrderList.module.css";
import Pagination from "../Pagination";

interface Props {
  userRole: "cliente" | "tecnico" | "admin" | "secretaria";
  onViewOrder: (order: Order) => void;
  initialFilter?:
    | "all"
    | "pending"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  initialOrderId?: number;
  filters?: {
    estado?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    tecnicoId?: number;
    clienteId?: number;
  };
}

interface DateFilters {
  startDate: string;
  endDate: string;
}

// Función para normalizar texto (quitar tildes y caracteres especiales)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};

// Función mejorada de búsqueda flexible
const matchesSearch = (text: string, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchTerm);

  const searchWords = normalizedSearch
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (searchWords.length > 1) {
    return searchWords.every((word) => normalizedText.includes(word));
  }

  return normalizedText.includes(normalizedSearch);
};

export default function OrderList({
  userRole,
  onViewOrder,
  initialFilter = "all",
  initialOrderId,
  filters = {},
}: Props) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "pending" | "assigned"| "in_progress" | "completed" | "cancelled"
  >(initialFilter);

  // Controla si ya se hizo el auto‑select para el ID actual
  const hasAutoSelectedRef = useRef(false);
  const lastInitialOrderIdRef = useRef<number | undefined>(undefined);

  const [showFilters, setShowFilters] = useState(false);

  // Estado para filtrar solo mis órdenes (para técnicos)
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Estado para el buscador de empresas (cuando hay muchas)
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const isTechnician =
    user?.role.nombreRol
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() === "tecnico";
  // Filtros de fecha
  const [dateFilters, setDateFilters] = useState<DateFilters>({
    startDate: "",
    endDate: "",
  });

  // Hook de filtros de empresa
  const {
    companies,
    loading: companiesLoading,
    selectedCompany,
    selectedArea,
    subAreaHierarchy,
    getNextLevelSubAreas,
    handleCompanyChange: originalHandleCompanyChange,
    handleAreaChange,
    handleSubAreaSelect,
    clearFilters: clearCompanyFilters,
    isClient,
    companyAreas,
  } = useCompanyFilters();

  // Determinar si usar select o buscador basado en cantidad de empresas
  const useSelect = companies.length <= 5;

  // Hook principal de órdenes
  const { orders, loading, error, page, limit, totalPages } = useOrders(
    userRole,
    filter,
  );

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cuando cambia el cliente seleccionado desde fuera, reflejarlo en el input del buscador
  useEffect(() => {
    if (!useSelect && selectedCompany) {
      const label = selectedCompany.nit
        ? `${selectedCompany.nombre} (${selectedCompany.nit})`
        : selectedCompany.nombre;
      setCompanySearchTerm(label);
    }
    if (!selectedCompany && !companiesLoading && !isClient) {
      setCompanySearchTerm("");
    }
  }, [useSelect, selectedCompany, companiesLoading, isClient]);

  // Filtrado mejorado de empresas
  const filteredCompanies = useMemo(() => {
    if (!companySearchTerm.trim()) return companies;

    return companies.filter((company) => {
      const nombre = company.nombre || "";
      const nit = company.nit || "";
      const textoCompleto = `${nombre} ${nit}`;

      return matchesSearch(textoCompleto, companySearchTerm);
    });
  }, [companySearchTerm, companies]);

  // Función para resaltar el texto coincidente
  const highlightMatch = (
    text: string,
    searchTerm: string,
  ): React.ReactNode => {
    if (!searchTerm.trim() || !text) return text;

    const normalizedText = normalizeText(text);
    const normalizedSearch = normalizeText(searchTerm);

    if (!normalizedText.includes(normalizedSearch)) return text;

    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <mark className={styles.highlight}>
          {text.substring(index, index + searchTerm.length)}
        </mark>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  // Wrapper para handleCompanyChange que también actualiza el input de búsqueda
  const handleCompanySelect = useCallback(
    (companyId: string | number) => {
      const id = typeof companyId === "string" ? companyId : String(companyId);
      originalHandleCompanyChange(id);

      if (!useSelect) {
        const company = companies.find((c) => c.idCliente === Number(id));
        if (company) {
          const label = company.nit
            ? `${company.nombre} (${company.nit})`
            : company.nombre;
          setCompanySearchTerm(label);
        }
        setShowCompanyDropdown(false);
      }
    },
    [originalHandleCompanyChange, companies, useSelect],
  );

  const handleCompanySearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCompanySearchTerm(e.target.value);
    setShowCompanyDropdown(true);
  };

  const handleCompanySelectFromSearch = (company: (typeof companies)[0]) => {
    handleCompanySelect(company.idCliente);
  };

  // Filtrar órdenes con la opción "Solo mis órdenes" para técnicos
  const filteredOrders = orders.filter((order) => {
    // Filtro "solo mis órdenes" para técnicos
    if (showOnlyMine && user) {
      const isAssignedToMe = order.technicians?.some(
        (tech) => tech.tecnicoId === user.usuarioId,
      );
      if (!isAssignedToMe) return false;
    }

    // Filtro por fechas
    if (dateFilters.startDate) {
      const orderDate = new Date(order.fecha_solicitud)
        .toISOString()
        .split("T")[0];
      if (orderDate < dateFilters.startDate) return false;
    }

    if (dateFilters.endDate) {
      const orderDate = new Date(order.fecha_solicitud)
        .toISOString()
        .split("T")[0];
      if (orderDate > dateFilters.endDate) return false;
    }

    // Si hay empresa seleccionada, filtrar por ella
    if (selectedCompany) {
      if (order.cliente_empresa?.id_cliente !== selectedCompany.idCliente) {
        return false;
      }
    }

    // Si hay área seleccionada, verificar que la orden tenga AL MENOS UN equipo en esa área
    if (selectedArea) {
      if (!order.equipos || order.equipos.length === 0) return false;

      const hasMatchingArea = order.equipos.some(
        (equipo) => equipo.area?.areaId === selectedArea.idArea,
      );
      if (!hasMatchingArea) return false;
    }

    // Si hay jerarquía de subáreas seleccionada
    if (subAreaHierarchy.length > 0) {
      if (!order.equipos || order.equipos.length === 0) return false;

      const lastSelectedId = subAreaHierarchy[subAreaHierarchy.length - 1].id;

      const hasMatchingSubArea = order.equipos.some((equipo) => {
        if (!equipo.subArea) return false;
        return equipo.subArea.subAreaId === lastSelectedId;
      });

      if (!hasMatchingSubArea) return false;
    }

    return true;
  });

  // Sincronizar página con el hook useOrders
  useEffect(() => {
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [page, currentPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Resetear a página 1 cuando cambien filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filter,
    filters,
    dateFilters,
    selectedCompany,
    selectedArea,
    subAreaHierarchy,
    showOnlyMine,
  ]);

  // --- AUTOSELECCIÓN POR initialOrderId ---

  // Si cambia el ID inicial (o se limpia), reseteamos el flag
  useEffect(() => {
    if (initialOrderId !== lastInitialOrderIdRef.current) {
      hasAutoSelectedRef.current = false;
      lastInitialOrderIdRef.current = initialOrderId;
    }
  }, [initialOrderId]);

  // Auto-seleccionar orden por ID si viene en URL
  useEffect(() => {
    if (!initialOrderId) return;
    if (!orders || orders.length === 0) return;
    if (hasAutoSelectedRef.current) return;

    const found = orders.find((o) => o.orden_id === initialOrderId);
    if (found) {
      hasAutoSelectedRef.current = true;
      onViewOrder(found);

      const orderIndex = orders.findIndex((o) => o.orden_id === initialOrderId);
      if (orderIndex !== -1) {
        setCurrentPage(Math.floor(orderIndex / limit) + 1);
      }
    }
  }, [initialOrderId, orders, onViewOrder, limit]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearAllFilters = () => {
    setDateFilters({ startDate: "", endDate: "" });
    clearCompanyFilters();
    setCompanySearchTerm("");
    setShowCompanyDropdown(false);
    setShowOnlyMine(false);
    setFilter("all");
  };

  const hasActiveFilters = (): boolean => {
    return (
      dateFilters.startDate !== "" ||
      dateFilters.endDate !== "" ||
      selectedCompany !== null ||
      selectedArea !== null ||
      subAreaHierarchy.length > 0 ||
      showOnlyMine ||
      filter !== "all"
    );
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (dateFilters.startDate) count++;
    if (dateFilters.endDate) count++;
    if (selectedCompany) count++;
    if (selectedArea) count++;
    if (subAreaHierarchy.length > 0) count++;
    if (showOnlyMine) count++;
    if (filter !== "all") count++;
    return count;
  };

  const getCardStatusClass = (order: Order): string => {
    if (order.estado === "Asignada") return styles.orderCardPendingAssigned;
    if (order.estado === "Pendiente") return styles.orderCardPending;
    if (order.estado === "En Proceso") return styles.orderCardInProgress;
    if (order.estado === "Pausada") return styles.orderCardPaused;
    if (order.estado === "Completado")
      return styles.orderCardCompletedBillingPending;
    if (order.estado_facturacion === "Por facturar")
      return styles.orderCardCompletedBillingPending;
    if (order.estado_facturacion === "Facturado")
      return styles.orderCardCompleted;
    if (order.estado_facturacion === "Garantía")
      return styles.orderCardCompletedWarranty;
    if (order.estado === "Cancelada" || order.estado === "Rechazada") {
      return styles.orderCardCancelled;
    }
    return "";
  };

  const getDisplayClientName = (order: Order): string => {
    if (order.cliente_empresa) {
      return order.cliente_empresa.nombre;
    }
    return order.cliente?.nombre
      ? `${order.cliente.nombre} ${order.cliente.apellido || ""}`.trim()
      : "Cliente no disponible";
  };

  const getDisplayPhone = (order: Order): string => {
    return (
      order.cliente_empresa?.telefono ||
      order.cliente?.telefono ||
      "No disponible"
    );
  };

  const getMainTechnician = (order: Order) => {
    if (order.technicians && order.technicians.length > 0) {
      return order.technicians[0].technician;
    }
    return null;
  };

  if (loading || companiesLoading)
    return <div className={styles.loading}>Cargando órdenes...</div>;

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* Barra de filtros */}
      <div className={styles.filtersBar}>
        <button
          className={styles.toggleFiltersButton}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <span className={styles.toggleFiltersIcon}>
            {showFilters ? "▼" : "▶"}
          </span>
          {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          {!showFilters && getActiveFiltersCount() > 0 && (
            <span className={styles.filterBadge}>
              {getActiveFiltersCount()}
            </span>
          )}
        </button>

        {showFilters && (
          <div className={styles.filtersContainer}>
            <div className={styles.filterGrid}>
              {/* Checkbox para técnicos - filtrar solo mis órdenes */}
              {isTechnician && (
                <div className={styles.filterGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={showOnlyMine}
                      onChange={(e) => setShowOnlyMine(e.target.checked)}
                    />
                    Mostrar solo mis órdenes asignadas
                  </label>
                </div>
              )}

              {/* Filtros de fecha - para todos */}
              <div className={styles.filterGroup}>
                <label htmlFor="startDate">Fecha inicio</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateFilters.startDate}
                  onChange={handleDateChange}
                  className={styles.filterInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="endDate">Fecha fin</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateFilters.endDate}
                  onChange={handleDateChange}
                  className={styles.filterInput}
                />
              </div>

              {/* Select de estados */}
              <div className={styles.filterGroup}>
                <label htmlFor="statusFilter">Estado de orden</label>
                <select
                  id="statusFilter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className={`${styles.filterSelect} ${
                    filter !== "all" ? styles.activeFilter : ""
                  }`}
                >
                  <option value="all">Todas las órdenes</option>
                  <option value="pending">Pendientes de asignación</option>
                  <option value="assigned">Asignadas</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              {/* Filtros de empresa - para todos excepto clientes */}
              {!isClient && (
                <>
                  {/* Empresa - con lógica select/buscador */}
                  <div className={styles.filterGroup}>
                    <label htmlFor="company">
                      Empresa {!useSelect && "(escribe para buscar)"}
                    </label>

                    {useSelect ? (
                      // MODO SELECT: cuando hay 5 o menos empresas
                      <select
                        id="company"
                        value={selectedCompany?.idCliente || ""}
                        onChange={(e) => handleCompanySelect(e.target.value)}
                        className={styles.filterSelect}
                        disabled={companiesLoading}
                      >
                        <option value="">Todas las empresas</option>
                        {companies.map((company) => (
                          <option
                            key={company.idCliente}
                            value={company.idCliente}
                          >
                            {company.nombre}
                            {company.nit && ` (${company.nit})`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      // MODO BUSCADOR: cuando hay más de 5 empresas
                      <div
                        className={styles.companySearchWrapper}
                        ref={companyDropdownRef}
                      >
                        <input
                          type="text"
                          id="company-search"
                          placeholder={
                            companiesLoading
                              ? "Cargando empresas..."
                              : "Buscar empresa por nombre o NIT..."
                          }
                          value={companySearchTerm}
                          onChange={handleCompanySearchInputChange}
                          onFocus={() => setShowCompanyDropdown(true)}
                          disabled={companiesLoading}
                          className={styles.companySearchInput}
                          autoComplete="off"
                          aria-label="Buscar empresa"
                          aria-expanded={showCompanyDropdown}
                          aria-controls="company-search-results"
                        />

                        {showCompanyDropdown && !companiesLoading && (
                          <ul
                            id="company-search-results"
                            className={styles.companySearchResults}
                            role="listbox"
                            aria-label="Resultados de búsqueda de empresas"
                          >
                            {filteredCompanies.length > 0 ? (
                              filteredCompanies.map((company) => (
                                <li
                                  key={company.idCliente}
                                  className={styles.companySearchItem}
                                  onMouseDown={() =>
                                    handleCompanySelectFromSearch(company)
                                  }
                                  role="option"
                                  aria-selected={
                                    company.idCliente ===
                                    selectedCompany?.idCliente
                                  }
                                >
                                  <span className={styles.companyName}>
                                    {highlightMatch(
                                      company.nombre,
                                      companySearchTerm,
                                    )}
                                  </span>
                                  {company.nit && (
                                    <span className={styles.companyNit}>
                                      NIT:{" "}
                                      {highlightMatch(
                                        company.nit,
                                        companySearchTerm,
                                      )}
                                    </span>
                                  )}
                                </li>
                              ))
                            ) : (
                              <li className={styles.noResults} role="status">
                                No se encontraron empresas para "
                                {companySearchTerm}"
                              </li>
                            )}

                            {/* Sugerencias cuando hay pocos resultados */}
                            {filteredCompanies.length > 0 &&
                              filteredCompanies.length < 3 && (
                                <li className={styles.suggestion}>
                                  <small>
                                    💡 Prueba con términos más cortos o sin
                                    tildes
                                  </small>
                                </li>
                              )}
                          </ul>
                        )}

                        {/* Contador de resultados */}
                        {companySearchTerm && !companiesLoading && (
                          <div className={styles.resultCount}>
                            {filteredCompanies.length}{" "}
                            {filteredCompanies.length === 1
                              ? "empresa encontrada"
                              : "empresas encontradas"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Área - solo si hay empresa seleccionada */}
                  {selectedCompany && (
                    <div className={styles.filterGroup}>
                      <label htmlFor="area">Área</label>
                      <select
                        id="area"
                        value={selectedArea?.idArea || ""}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        className={styles.filterSelect}
                        disabled={companyAreas.length === 0}
                      >
                        <option value="">Todas las áreas</option>
                        {companyAreas.map((area) => (
                          <option key={area.idArea} value={area.idArea}>
                            {area.nombreArea}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Subáreas jerárquicas */}
                  {selectedArea &&
                    (() => {
                      const currentLevel = subAreaHierarchy.length;
                      const subAreas = getNextLevelSubAreas(subAreaHierarchy);

                      if (subAreas.length === 0 && currentLevel === 0) {
                        return (
                          <div className={styles.filterGroup}>
                            <label>Subárea</label>
                            <select className={styles.filterSelect} disabled>
                              <option>No hay subáreas</option>
                            </select>
                          </div>
                        );
                      }

                      return (
                        subAreas.length > 0 && (
                          <div className={styles.filterGroup}>
                            <label>
                              {currentLevel === 0
                                ? "Subárea"
                                : `Subárea nivel ${currentLevel + 1}`}
                            </label>
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSubAreaSelect(
                                    currentLevel,
                                    Number(e.target.value),
                                  );
                                }
                              }}
                              className={styles.filterSelect}
                            >
                              <option value="">Seleccionar...</option>
                              {subAreas.map((subArea) => (
                                <option
                                  key={subArea.idSubArea}
                                  value={subArea.idSubArea}
                                >
                                  {subArea.nombreSubArea}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      );
                    })()}

                  {/* Mostrar jerarquía seleccionada */}
                  {subAreaHierarchy.length > 0 && selectedArea && (
                    <div className={styles.filterGroup}>
                      <label>Ruta seleccionada:</label>
                      <div className={styles.hierarchyDisplay}>
                        <span className={styles.hierarchyItem}>
                          {selectedArea.nombreArea}
                        </span>
                        {subAreaHierarchy.map((item, index) => (
                          <span key={index} className={styles.hierarchyItem}>
                            → {item.nombre}
                          </span>
                        ))}
                      </div>
                      <button
                        className={styles.clearSubAreaButton}
                        onClick={() => {
                          if (selectedArea) {
                            handleAreaChange(selectedArea.idArea.toString());
                          }
                        }}
                      >
                        Limpiar subáreas
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.filterActions}>
              <button
                onClick={clearAllFilters}
                className={styles.clearFilters}
                type="button"
              >
                Limpiar todos los filtros
              </button>
              <span className={styles.resultsCount}>
                {filteredOrders.length}{" "}
                {filteredOrders.length === 1 ? "orden" : "órdenes"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid de órdenes */}
      <div className={styles.ordersGrid}>
        {filteredOrders.map((order) => {
          const hasAssignedItems =
            (order.supplyDetails && order.supplyDetails.length > 0) ||
            (order.toolDetails && order.toolDetails.length > 0);

          const mainTechnician = getMainTechnician(order);
          const mainEquipment =
            order.equipos && order.equipos.length > 0 ? order.equipos[0] : null;
          const location = mainEquipment
            ? `${mainEquipment.area?.nombre || ""} ${mainEquipment.subArea?.nombre ? `- ${mainEquipment.subArea.nombre}` : ""}`.trim()
            : "";

          return (
            <div
              key={order.orden_id}
              className={`${styles.orderCard} ${getCardStatusClass(order)}`}
              onClick={() => onViewOrder(order)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onViewOrder(order);
                }
              }}
            >
              <div className={styles.cardHeader}>
                <h3>#{order.orden_id}</h3>
                <div className={styles.serviceBadge}>
                  {order.servicio?.nombre_servicio}
                </div>
              </div>

              <div className={styles.serviceInfo}>
                <strong>Cliente: {getDisplayClientName(order)}</strong>

                <div className={styles.tagsRow}>
                  {order.tipo_servicio && (
                    <span className={styles.typeTag}>
                      {order.tipo_servicio}
                    </span>
                  )}
                  {order.maintenance_type && (
                    <span
                      className={`${styles.typeTag} ${styles.maintenanceTypeTag}`}
                    >
                      {order.maintenance_type.nombre}
                    </span>
                  )}
                  {hasAssignedItems && (
                    <span className={styles.inventoryIndicator}>
                      H/I: <strong>Sí</strong>
                    </span>
                  )}
                  {order.technicians && order.technicians.length > 0 && (
                    <span className={styles.technicianCountTag}>
                      {order.technicians.length} técnico
                      {order.technicians.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.clientInfo}>
                <span>
                  <span className={styles.clientIcon}>👤</span>
                  {order.cliente?.nombre || ""} {order.cliente?.apellido || ""}
                </span>
                <span>
                  <span className={styles.clientIcon}>📞</span>
                  {getDisplayPhone(order)}
                </span>
                {mainTechnician && (
                  <span>
                    <span className={styles.clientIcon}>🛠️</span>
                    {mainTechnician.nombre} {mainTechnician.apellido}
                    {order.technicians?.length > 1 &&
                      ` +${order.technicians.length - 1}`}
                  </span>
                )}
                {location && (
                  <span>
                    <span className={styles.clientIcon}>📍</span>
                    {location}
                  </span>
                )}
              </div>

              <div className={styles.dates}>
                <span>
                  📅 Sol.:{" "}
                  {new Date(order.fecha_solicitud).toLocaleDateString()}
                </span>
                {order.fecha_inicio && (
                  <span>
                    🚀 Ini.: {new Date(order.fecha_inicio).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.statusRow}>
                  <span
                    className={`${styles.status} ${
                      styles[getStatusClass(order.estado, "status")]
                    }`}
                  >
                    {order.estado}
                  </span>
                  {order.estado_facturacion && (
                    <span
                      className={`${styles.billingBadge} ${
                        order.estado_facturacion === "Facturado"
                          ? styles.billingBilled
                          : order.estado_facturacion === "Garantía"
                            ? styles.billingWarranty
                            : styles.billingNotBilled
                      }`}
                    >
                      {order.estado_facturacion}
                    </span>
                  )}
                </div>
                <button
                  className={styles.viewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOrder(order);
                  }}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className={styles.emptyState}>
          <p>No se encontraron órdenes con los filtros seleccionados</p>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className={styles.clearFiltersEmpty}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
