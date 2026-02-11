import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/layout/DashboardLayout";
import SgSstDashboard from "../components/sg-sst/sections/SgsstDashboard"; // Nuevo componente dashboard
import PermisosSection from "../components/sg-sst/sections/PermisosSection";
import CapacitacionesSection from "../components/sg-sst/sections/TrainingSessions";
import { canViewModule } from "../config/roles.config";
import styles from "../styles/pages/SgSstPage.module.css";

export default function SGSST() {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState<"dashboard" | "permisos" | "capacitaciones">("dashboard");

  const userRole = user?.role?.nombreRol;
  const canAccessModule = canViewModule(userRole);

  if (!canAccessModule) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <div className={styles.accessDenied}>
            <div className={styles.accessDeniedIcon}>🚫</div>
            <h1 className={styles.accessDeniedTitle}>Acceso Denegado</h1>
            <p className={styles.accessDeniedMessage}>
              No tienes permisos para acceder al módulo de Gestión SG-SST.
            </p>
            <button
              className={styles.accessDeniedButton}
              onClick={() => window.history.back()}
            >
              Volver Atrás
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case "permisos":
        return <PermisosSection onBack={() => setCurrentSection("dashboard")} />;
      case "capacitaciones":
        return <CapacitacionesSection onBack={() => setCurrentSection("dashboard")} />;
      case "dashboard":
      default:
        return <SgSstDashboard onSectionSelect={setCurrentSection} />;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}