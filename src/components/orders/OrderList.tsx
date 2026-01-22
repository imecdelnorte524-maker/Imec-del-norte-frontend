import { useEffect, useRef, useState } from "react";
import { useOrders } from "../../hooks/useOrders";
import type { Order } from "../../interfaces/OrderInterfaces";
import { getStatusClass } from "../../utils/statusUtils";
import styles from "../../styles/components/orders/OrderList.module.css";
import Pagination from "../Pagination";

interface Props {
  userRole: "cliente" | "tecnico" | "admin";
  onViewOrder: (order: Order) => void;
  filter?: "all" | "pending" | "assigned" | "completed" | "cancelled";
  initialOrderId?: number;
}

export default function OrderList({
  userRole,
  onViewOrder,
  filter = "all",
  initialOrderId,
}: Props) {
  const { orders, loading, error } = useOrders(userRole, filter);
  const ordersPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const hasAutoSelectedRef = useRef(false);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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
        const pageForOrder = Math.floor(orderIndex / ordersPerPage) + 1;
        setCurrentPage(pageForOrder);
      }
    }
  }, [initialOrderId, orders, onViewOrder, ordersPerPage]);

  const getCardStatusClass = (order: Order): string => {
    if (order.estado === "Asignada") return styles.orderCardPendingAssigned;
    if (order.estado === "Pendiente") return styles.orderCardPending;
    if (order.estado === "En Proceso") return styles.orderCardInProgress;
    if (
      order.estado === "Completado" &&
      order.estado_facturacion === "No facturado"
    )
      return styles.orderCardCompletedBillingPending;
    if (
      order.estado === "Completado" &&
      order.estado_facturacion === "Facturado"
    )
      return styles.orderCardCompleted;
    if (order.estado === "Cancelada" || order.estado === "Rechazada") {
      return styles.orderCardCancelled;
    }
    return "";
  };

  const getDisplayClientName = (order: Order): string => {
    if (order.cliente_empresa) {
      return order.cliente_empresa.nombre;
    }
    return `${order.cliente.nombre} ${order.cliente.apellido || ""}`.trim();
  };

  const getDisplayPhone = (order: Order): string => {
    return (
      order.cliente_empresa?.telefono ||
      order.cliente.telefono ||
      "No disponible"
    );
  };

  if (loading) return <div className={styles.loading}>Cargando órdenes...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.ordersGrid}>
        {currentOrders.map((order) => {
          const hasAssignedItems =
            (order.supplyDetails && order.supplyDetails.length > 0) ||
            (order.toolDetails && order.toolDetails.length > 0);

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
                  {/* NUEVO: Tag para el tipo de mantenimiento (Preventivo/Correctivo) */}
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
                </div>
              </div>

              <div className={styles.clientInfo}>
                <span>
                  👤 {order.cliente.nombre} {order.cliente.apellido}
                </span>
                <span>📞 {getDisplayPhone(order)}</span>
                {order.tecnico && (
                  <span>
                    🛠️ {order.tecnico.nombre} {order.tecnico.apellido}
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
                  <span
                    className={
                      styles.billingBadge +
                      " " +
                      (order.estado_facturacion === "Facturado"
                        ? styles.billingBilled
                        : styles.billingNotBilled)
                    }
                  >
                    {order.estado_facturacion}
                  </span>
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
