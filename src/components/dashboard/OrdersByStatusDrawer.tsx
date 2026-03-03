// src/components/dashboard/OrdersByStatusDrawer.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { getServicesByStatusRequest } from "../../api/services";
import type {
  Service,
  ServiceFromAPI,
} from "../../interfaces/ServicesInterface";
import styles from "../../styles/components/dashboard/OrdersByStatusDrawer.module.css";

interface OrdersByStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  statusConfig: {
    title: string;
    statusValue: string;
    color: string;
    icon?: React.ReactNode;
  } | null;
}

// Mapeo de colores para cada estado
const STATUS_COLORS = {
  "Solicitada sin asignar": "#fbbf24", // amarillo
  "Solicitada asignada": "#a855f7", // morado
  "En Proceso": "#60a5fa", // azul
  "En pausa": "#06d99d", // verde agua
  Completado: "#22c55e", // verde
  Cancelado: "#f97373", // rojo
};

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

export function OrdersByStatusDrawer({
  isOpen,
  onClose,
  statusConfig,
}: OrdersByStatusDrawerProps) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && statusConfig) {
      loadOrdersByStatus();
    }
  }, [isOpen, statusConfig]);

  const loadOrdersByStatus = async () => {
    if (!statusConfig) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getServicesByStatusRequest(
        statusConfig.statusValue,
        5, // Solo las últimas 5
      );

      // Mapear los datos de API a la interfaz del componente
      const mappedOrders = response.services.map(mapServiceFromAPI);
      setOrders(mappedOrders);
    } catch (err) {
      console.error("Error cargando órdenes por estado:", err);
      setError("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (ordenId: number) => {
    navigate(`/orders/?ordenId=${ordenId}`);
    onClose();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Fecha no disponible";
    return new Date(date).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!isOpen || !statusConfig) return null;

  const statusColor =
    STATUS_COLORS[statusConfig.statusValue as keyof typeof STATUS_COLORS] ||
    "#6b7280";

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        {/* Header */}
        <div
          className={styles.header}
          style={{ borderBottomColor: statusColor }}
        >
          <div className={styles.headerContent}>
            <div className={styles.titleContainer}>
              <h2 className={styles.title}>
                Órdenes{" "}
                <span style={{ color: statusColor }}>{statusConfig.title}</span>
              </h2>
              <p className={styles.subtitle}>Últimas 5 órdenes</p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <XMarkIcon className={styles.closeIcon} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Cargando órdenes...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button
                onClick={loadOrdersByStatus}
                className={styles.retryButton}
              >
                Reintentar
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No hay órdenes en este estado</p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => (
                <div
                  key={order.orden_id}
                  className={styles.orderCard}
                  onClick={() => handleOrderClick(order.orden_id)}
                  style={{ borderLeftColor: statusColor }}
                >
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>#{order.orden_id}</span>
                    <span
                      className={styles.orderStatus}
                      style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                      }}
                    >
                      {order.estado}
                    </span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailRow}>
                      <UserIcon className={styles.detailIcon} />
                      <span className={styles.detailText}>
                        {order.cliente.nombre} {order.cliente.apellido || ""}
                      </span>
                    </div>

                    {order.tecnico && (
                      <div className={styles.detailRow}>
                        <WrenchScrewdriverIcon className={styles.detailIcon} />
                        <span className={styles.detailText}>
                          {order.tecnico.nombre} {order.tecnico.apellido || ""}
                        </span>
                      </div>
                    )}

                    <div className={styles.detailRow}>
                      <CalendarIcon className={styles.detailIcon} />
                      <span className={styles.detailText}>
                        {formatDate(order.fecha_solicitud)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {orders.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.footerHint}>
              Haz clic en cualquier orden para ver más detalles
            </p>
          </div>
        )}
      </div>
    </>
  );
}
