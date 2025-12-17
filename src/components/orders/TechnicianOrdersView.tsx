// src/components/orders/TechnicianOrdersView.tsx

import { useState } from 'react';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import type { Order } from '../../interfaces/OrderInterfaces';
import styles from '../../styles/components/orders/TechnicianOrdersView.module.css';

interface Props {
  activeView: 'list' | 'create' | 'detail';
  setActiveView: (view: 'list' | 'create' | 'detail') => void;
}

export default function TechnicianOrdersView({ activeView, setActiveView }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    setActiveView('list');
  };

  if (activeView === 'detail' && selectedOrder) {
    return (
      <OrderDetail 
        order={selectedOrder}
        onBack={handleBackToList}
        userRole="tecnico"
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mis Órdenes Asignadas</h1>
      </div>
      
      <OrderList 
        userRole="tecnico"
        onViewOrder={handleViewOrder}
      />
    </div>
  );
}