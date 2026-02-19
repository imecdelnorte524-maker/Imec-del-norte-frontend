import { useState } from "react";
import OrderList from "./OrderList";
import CreateOrderForm from "./CreateOrderForm";
import OrderDetail from "./OrderDetail";
import type { Order } from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/AdminOrdersView.module.css";

interface Props {
  activeView: "list" | "create" | "detail";
  setActiveView: (view: "list" | "create" | "detail") => void;
  onBackToList: () => void;
  userRole: "admin" | "secretaria";
  initialOrderId?: number;
}

export default function AdminOrdersView({
  activeView,
  setActiveView,
  onBackToList,
  userRole,
  initialOrderId,
}: Props) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "assigned" | "completed" | "cancelled"
  >("all");

  const isAdmin = userRole === "admin";

  const handleCreateOrder = () => {
    if (!isAdmin) return;
    setActiveView("create");
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setActiveView("detail");
  };

  const handleBack = () => {
    setSelectedOrder(null); // 👈 LIMPIAR EL ESTADO LOCAL
    onBackToList(); // Esto navega a /orders sin params
  };

  if (activeView === "create" && isAdmin) {
    return <CreateOrderForm onSuccess={onBackToList} onCancel={onBackToList} />;
  }

  if (activeView === "detail" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBack}
        userRole={isAdmin ? "admin" : "secretaria"}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Órdenes de Servicio</h1>
        <div className={styles.actions}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">Todas las órdenes</option>
            <option value="pending">Pendientes de asignación</option>
            <option value="assigned">Asignadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          {isAdmin && (
            <button className={styles.createButton} onClick={handleCreateOrder}>
              + Crear Orden
            </button>
          )}
        </div>
      </div>

      <OrderList
        userRole="admin"
        onViewOrder={handleViewOrder}
        filter={filter}
        initialOrderId={initialOrderId}
      />
    </div>
  );
}
