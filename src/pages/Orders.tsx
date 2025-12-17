import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/pages/OrdersPage.module.css';

import ClientOrdersView from '../components/orders/ClientOrdersView';
import TechnicianOrdersView from '../components/orders/TechnicianOrdersView';
import AdminOrdersView from '../components/orders/AdminOrdersView';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');

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

  const roleName = user?.role?.nombreRol || '';
  const upperRole = roleName.toUpperCase();

  const isAdmin = upperRole === 'ADMINISTRADOR';
  const isSecretaria = upperRole === 'SECRETARIA';
  const isTecnico = upperRole === 'TÉCNICO' || upperRole === 'TECNICO';
  const isCliente = upperRole === 'CLIENTE';

  const renderView = () => {
    if (isAdmin) {
      return (
        <AdminOrdersView
          activeView={activeView}
          setActiveView={setActiveView}
          userRole="admin"
        />
      );
    }

    if (isSecretaria) {
      return (
        <AdminOrdersView
          activeView={activeView}
          setActiveView={setActiveView}
          userRole="secretaria"
        />
      );
    }

    if (isTecnico) {
      return (
        <TechnicianOrdersView
          activeView={activeView}
          setActiveView={setActiveView}
        />
      );
    }

    if (isCliente) {
      return (
        <ClientOrdersView
          activeView={activeView}
          setActiveView={setActiveView}
        />
      );
    }

    return (
      <ClientOrdersView
        activeView={activeView}
        setActiveView={setActiveView}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>{renderView()}</div>
    </DashboardLayout>
  );
}