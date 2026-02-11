import { useAuth } from "../../../hooks/useAuth";
import { getDisplayRoleName } from "../../../config/roles.config";
import styles from "../../../styles/components/sg-sst/sections/SgSstDashboard.module.css";

interface SgSstDashboardProps {
  onSectionSelect: (section: "permisos" | "capacitaciones") => void;
}

export default function SgSstDashboard({
  onSectionSelect,
}: SgSstDashboardProps) {
  const { user } = useAuth();
  const displayRoleName = getDisplayRoleName(user?.role?.nombreRol);

  const getModeDescription = () => {
    const role = user?.role?.nombreRol?.toUpperCase() || "";
    if (role.includes("ADMIN")) return "👑 Modo Administrador: Acceso completo";
    if (role.includes("SUPERVISOR"))
      return "👁️ Modo Supervisor: Visualización completa";
    if (role.includes("SECRETARIA"))
      return "📋 Modo Secretaria: Gestión documental";
    if (role.includes("SG-SST")) return "✍️ Modo SG-SST: Aprobación y firma";
    if (role.includes("TECNICO")) return "🔧 Modo Técnico: Gestión operativa";
    return "";
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Gestión SG-SST</h1>
          <p className={styles.subtitle}>
            Sistema de Gestión de Seguridad y Salud en el Trabajo
          </p>
          {getModeDescription() && (
            <p className={styles.userNote}>{getModeDescription()}</p>
          )}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userRole}>{displayRoleName}</span>
        </div>
      </div>

      {/* Tarjetas de navegación */}
      <div className={styles.cardsGrid}>
        {/* Tarjeta de Permisos */}
        <div
          className={styles.card}
          onClick={() => onSectionSelect("permisos")}
        >
          <div className={styles.cardIcon} style={{ background: "#3B82F6" }}>
            📋
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Permisos de Trabajo</h3>
            <p className={styles.cardDescription}>
              Gestión de ATS, Trabajos en Altura y Checklist Preoperacional
            </p>
            <div className={styles.cardStats}>
              <span className={styles.statItem}>ATS</span>
              <span className={styles.statItem}>Alturas</span>
              <span className={styles.statItem}>Preoperacional</span>
            </div>
          </div>
          <div className={styles.cardArrow}>→</div>
        </div>

        {/* Tarjeta de Capacitaciones */}
        <div
          className={styles.card}
          onClick={() => onSectionSelect("capacitaciones")}
        >
          <div className={styles.cardIcon} style={{ background: "#10B981" }}>
            🎓
          </div>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Capacitaciones</h3>
            <p className={styles.cardDescription}>
              Gestión de capacitaciones, entrenamientos y certificaciones del
              personal
            </p>
            <div className={styles.cardStats}>
              <span className={styles.statItem}>Programar</span>
              <span className={styles.statItem}>Registrar</span>
              <span className={styles.statItem}>Reportes</span>
            </div>
          </div>
          <div className={styles.cardArrow}>→</div>
        </div>
      </div>

      {/* Información rápida */}
      <div className={styles.quickInfo}>
        <div className={styles.infoCard}>
          <h4>📈 Actividad Reciente</h4>
          <p>Últimos formularios y capacitaciones registradas</p>
        </div>
        <div className={styles.infoCard}>
          <h4>🔔 Pendientes</h4>
          <p>Revisiones y aprobaciones pendientes</p>
        </div>
      </div>
    </div>
  );
}
