// src/components/equipment/equipment-details/AssociateOrderModal.tsx
import { useState, useEffect } from "react";
import type { Order } from "../../../interfaces/OrderInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/AssociateOrderModal.module.css";

interface AssociateOrderModalProps {
  isOpen: boolean;
  equipmentId: number;
  clientId: number;
  category: string;
  existingOrderIds: number[];
  availableOrders: Order[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onAssociate: (orderId: number) => Promise<void>;
}

export default function AssociateOrderModal({
  isOpen,
  existingOrderIds,
  availableOrders,
  loading,
  error,
  onClose,
  onAssociate,
}: AssociateOrderModalProps) {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      // Filtrar órdenes que no están ya asociadas
      const filtered = availableOrders.filter(
        order => !existingOrderIds.includes(order.orden_id)
      );
      setFilteredOrders(filtered);
    }
  }, [isOpen, availableOrders, existingOrderIds]);

  // Filtrar órdenes por búsqueda
  const displayedOrders = filteredOrders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orden_id.toString().includes(searchLower) ||
      order.servicio.nombre_servicio.toLowerCase().includes(searchLower) ||
      (order.comentarios && order.comentarios.toLowerCase().includes(searchLower))
    );
  });

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Asociar Orden al Equipo</h3>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={onClose}
              disabled={loading}
            >
              ×
            </button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Buscar órdenes por ID o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className={styles.searchInput}
            />
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Cargando órdenes disponibles...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {searchTerm 
                  ? "No se encontraron órdenes con ese criterio de búsqueda."
                  : "No hay órdenes disponibles para asociar. Todas las órdenes pendientes ya están asociadas a este equipo."}
              </p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {displayedOrders.map((order) => (
                <div key={order.orden_id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <h4>Orden #{order.orden_id}</h4>
                    <span className={styles.orderStatus}>
                      {order.estado}
                    </span>
                  </div>
                  
                  <div className={styles.orderDetails}>
                    <p className={styles.serviceName}>
                      {order.servicio.nombre_servicio}
                    </p>
                    
                    {order.comentarios && (
                      <p className={styles.orderComments}>
                        <strong>Comentarios:</strong> {order.comentarios}
                      </p>
                    )}
                    
                    <div className={styles.orderMeta}>
                      <span>
                        <strong>Fecha:</strong>{" "}
                        {new Date(order.fecha_solicitud).toLocaleDateString()}
                      </span>
                      {order.tipo_servicio && (
                        <span>
                          <strong>Tipo:</strong> {order.tipo_servicio}
                        </span>
                      )}
                    </div>
                    
                    {order.maintenance_type && (
                      <div className={styles.maintenanceType}>
                        <strong>Clase de Mantenimiento:</strong>{" "}
                        <span className={styles.typeBadge}>
                          {order.maintenance_type.nombre}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.orderActions}>
                    <button
                      onClick={() => onAssociate(order.orden_id)}
                      className={styles.associateButton}
                      disabled={loading}
                    >
                      Asociar al Equipo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}