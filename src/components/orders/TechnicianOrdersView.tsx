import { useState } from "react";
import OrderList from "./OrderList";
import OrderDetail from "./OrderDetail";
import type { Order } from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/TechnicianOrdersView.module.css";

interface Props {
  activeView: "list" | "create" | "detail";
  setActiveView: (view: "list" | "create" | "detail") => void;
  onBackToList: () => void;
  initialOrderId?: number;
}

export default function TechnicianOrdersView({
  activeView,
  setActiveView,
  onBackToList,
  initialOrderId,
}: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveView("detail");
  };

  const handleBack = () => {
    setSelectedOrder(null); // 👈 LIMPIAR EL ESTADO LOCAL
    onBackToList();
  };

  if (activeView === "detail" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBack}
        userRole="tecnico"
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Todas las Órdenes de Servicio</h1>
      </div>

      <OrderList
        userRole="admin"
        onViewOrder={handleViewOrder}
        initialOrderId={initialOrderId}
      />
    </div>
  );
}