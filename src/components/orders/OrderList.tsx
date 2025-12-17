// src/components/orders/OrderList.tsx

import { useOrders } from '../../hooks/useOrders';
import type { Order } from '../../interfaces/OrderInterfaces';
import { getStatusColor } from '../../utils/statusUtils';
import styles from '../../styles/components/orders/OrderList.module.css';

interface Props {
  userRole: 'cliente' | 'tecnico' | 'admin';
  onViewOrder: (order: Order) => void;
  filter?: 'all' | 'pending' | 'assigned';
}

export default function OrderList({ userRole, onViewOrder, filter = 'all' }: Props) {
  const { orders, loading, error } = useOrders(userRole, filter);

  if (loading) {
    return <div className={styles.loading}>Cargando órdenes...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.ordersGrid}>
        {orders.map(order => (
          <div
            key={order.orden_id}
            className={styles.orderCard}
            onClick={() => onViewOrder(order)}
          >
            <div className={styles.cardHeader}>
              <h3>Orden #{order.orden_id}</h3>
              <div className={styles.serviceBadge}>
                {order.servicio.nombre_servicio}
              </div>
            </div>

            <div className={styles.serviceInfo}>
              <strong>Servicio: {order.servicio.nombre_servicio}</strong>
            </div>

            <div className={styles.clientInfo}>
              <span>Cliente: {order.cliente_empresa?.nombre}</span>
              <span>Contacto: {order.cliente.nombre} {order.cliente.apellido}</span>
              <span>Teléfono: {order.cliente_empresa?.telefono}</span>
              <span>Email: {order.cliente.email}</span>
              {order.tecnico && (
                <span>Técnico: {order.tecnico.nombre} {order.tecnico.apellido}</span>
              )}
            </div>

            <div className={styles.dates}>
              <span>Solicitado: {new Date(order.fecha_solicitud).toLocaleDateString()}</span>
              {order.fecha_inicio && (
                <span>Inicio: {new Date(order.fecha_inicio).toLocaleDateString()}</span>
              )}
            </div>

            <div className={styles.cardFooter}>
              <div className={`${styles.status} ${styles[getStatusColor(order.estado)]}`}>
                {order.estado}
              </div>
              <button className={styles.viewButton}>
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <p>No se encontraron órdenes</p>
        </div>
      )}
    </div>
  );
}