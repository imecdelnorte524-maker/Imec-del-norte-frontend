import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/pages/OrdersPage.module.css";

import ClientOrdersView from "../components/orders/ClientOrdersView";
import TechnicianOrdersView from "../components/orders/TechnicianOrdersView";
import AdminOrdersView from "../components/orders/AdminOrdersView";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<"list" | "create" | "detail">(
    "list",
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ordenIdParam = searchParams.get("ordenId");
  const createParam = searchParams.get("create");

  // Sincronizar vista con URL
  useEffect(() => {
    if (ordenIdParam) {
      setActiveView("detail");
    } else if (createParam === "true") {
      setActiveView("create");
    } else {
      setActiveView("list");
    }
  }, [ordenIdParam, createParam]);

  const handleBackToList = () => {
    navigate("/orders", { replace: true });
    setActiveView("list");
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Cargando...</p>
        </div>
      </DashboardLayout>
    );
  }

  const roleName = user?.role?.nombreRol || "";
  const upperRole = roleName.toUpperCase();

  const isAdmin = upperRole === "ADMINISTRADOR";
  const isSecretaria = upperRole === "SECRETARIA";
  const isTecnico = upperRole === "TÉCNICO" || upperRole === "TECNICO";

  const renderView = () => {
    const commonProps = {
      activeView,
      setActiveView,
      onBackToList: handleBackToList,
      initialOrderId: ordenIdParam ? Number(ordenIdParam) : undefined, // 👈 Esto es clave
    };

    if (isAdmin || isSecretaria) {
      return (
        <AdminOrdersView
          {...commonProps}
          userRole={isAdmin ? "admin" : "secretaria"}
        />
      );
    }

    if (isTecnico) {
      return <TechnicianOrdersView {...commonProps} />;
    }

    return <ClientOrdersView {...commonProps} />;
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>{renderView()}</div>
    </DashboardLayout>
  );
}
