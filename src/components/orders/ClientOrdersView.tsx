import { useState } from 'react';
import OrderList from './OrderList';
import CreateOrderForm from './CreateOrderForm';
import OrderDetail from './OrderDetail';
import type { Order } from '../../interfaces/OrderInterfaces';
import styles from '../../styles/components/orders/ClientOrdersView.module.css';

interface Props {
  activeView: 'list' | 'create' | 'detail';
  setActiveView: (view: 'list' | 'create' | 'detail') => void;
  onBackToList: () => void;
  initialOrderId?: number;
}

export default function ClientOrdersView({
  activeView,
  setActiveView,
  onBackToList,
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

  const handleBack = () => {
    setSelectedOrder(null); // 👈 LIMPIAR EL ESTADO LOCAL
    onBackToList();
  };

  if (activeView === 'create') {
    return (
      <CreateOrderForm
        onSuccess={onBackToList}
        onCancel={onBackToList}
      />
    );
  }

  if (activeView === 'detail' && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBack}
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