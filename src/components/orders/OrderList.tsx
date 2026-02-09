import { useEffect, useRef, useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import type { Order } from "../../interfaces/OrderInterfaces";
import { getStatusClass } from "../../utils/statusUtils";
import styles from "../../styles/components/orders/OrderList.module.css";
import Pagination from "../Pagination";

interface Props {
  userRole: "cliente" | "tecnico" | "admin" | "secretaria";
  onViewOrder: (order: Order) => void;
  filter?: "all" | "pending" | "assigned" | "completed" | "cancelled";
  initialOrderId?: number;
  filters?: {
    // por ahora no se usan con /work-orders, pero se dejan por compatibilidad
    estado?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    tecnicoId?: number;
    clienteId?: number;
  };
}

export default function OrderList({
  userRole,
  onViewOrder,
  filter = "all",
  initialOrderId,
  filters = {},
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const hasAutoSelectedRef = useRef(false);

  // Hook principal de OrdersPage: usa /work-orders para todos los roles
  const { orders, loading, error, page, limit, totalPages } = useOrders(
    userRole,
    filter,
  );

  // Sincronizar página local con lo que devuelva el hook (aunque ahora siempre es 1)
  useEffect(() => {
    if (page && page !== currentPage) {
      setCurrentPage(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, filters]);

  useEffect(() => {
    if (!initialOrderId) return;
    if (!orders || orders.length === 0) return;
    if (hasAutoSelectedRef.current) return;

    const found = orders.find((o) => o.orden_id === initialOrderId);
    if (found) {
      onViewOrder(found);
      hasAutoSelectedRef.current = true;
      const orderIndex = orders.findIndex((o) => o.orden_id === initialOrderId);
      if (orderIndex !== -1) {
        setCurrentPage(Math.floor(orderIndex / limit) + 1);
      }
    }
  }, [initialOrderId, orders, onViewOrder, limit]);

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

  if (loading) return <div className={styles.loading}>Cargando órdenes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.ordersGrid}>
        {orders.map((order) => {
          const hasAssignedItems =
            (order.supplyDetails && order.supplyDetails.length > 0) ||
            (order.toolDetails && order.toolDetails.length > 0);

          const mainTechnician = getMainTechnician(order);

          return (
            <div
              key={order.orden_id}
              className={`${styles.orderCard} ${getCardStatusClass(order)}`}
              onClick={() => onViewOrder(order)}
            >
              <div className={styles.cardHeader}>
                <h3>#{order.orden_id}</h3>
                <div className={styles.serviceBadge}>
                  {order.servicio.nombre_servicio}
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
                      className={styles.typeTag}
                      style={{
                        backgroundColor: "#ecfeff",
                        color: "#0369a1",
                        borderColor: "#a5f3fc",
                      }}
                    >
                      {order.maintenance_type.nombre}
                    </span>
                  )}
                  {hasAssignedItems && (
                    <span className={styles.inventoryIndicator}>
                      H/I Asignado: <strong>Sí</strong>
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
                  👤 {order.cliente?.nombre || ""}{" "}
                  {order.cliente?.apellido || ""}
                </span>
                <span>📞 {getDisplayPhone(order)}</span>
                {mainTechnician && (
                  <span>
                    🛠️ {mainTechnician.nombre} {mainTechnician.apellido}
                    {order.technicians?.length > 1 &&
                      ` +${order.technicians.length - 1}`}
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
                  {order.estado_facturacion !== "" && (
                    <span
                      className={
                        styles.billingBadge +
                        " " +
                        (order.estado_facturacion === "Facturado"
                          ? styles.billingBilled
                          : order.estado_facturacion === "Garantía"
                            ? styles.billingWarranty
                            : styles.billingNotBilled)
                      }
                    >
                      {order.estado_facturacion}
                    </span>
                  )}
                </div>
                <button className={styles.viewButton}>Ver Detalles</button>
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <p>No se encontraron órdenes</p>
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
