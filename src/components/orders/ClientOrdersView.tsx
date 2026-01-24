// src/components/orders/ClientOrdersView.tsx

import { useState } from 'react';
import OrderList from './OrderList';
import CreateOrderForm from './CreateOrderForm';
import OrderDetail from './OrderDetail';
import type { Order } from '../../interfaces/OrderInterfaces';
import styles from '../../styles/components/orders/ClientOrdersView.module.css';

interface Props {
  activeView: 'list' | 'create' | 'detail';
  setActiveView: (view: 'list' | 'create' | 'detail') => void;
  initialOrderId?: number; // <- NUEVO
}

export default function ClientOrdersView({
  activeView,
  setActiveView,
  initialOrderId,
}: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCreateOrder = () => {
    setActiveView('create');
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    setActiveView('list');
  };

  if (activeView === 'create') {
    return (
      <CreateOrderForm
        onSuccess={handleBackToList}
        onCancel={handleBackToList}
      />
    );
  }

  if (activeView === 'detail' && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBackToList}
        userRole="cliente"
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mis Solicitudes de Servicio</h1>
        <button
          className={styles.createButton}
          onClick={handleCreateOrder}
        >
          + Nueva Solicitud
        </button>
      </div>

      <OrderList
        userRole="cliente"
        onViewOrder={handleViewOrder}
        initialOrderId={initialOrderId}
      />
    </div>
  );
}