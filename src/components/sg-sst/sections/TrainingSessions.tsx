import { useState } from "react";
import styles from "../../../styles/components/sg-sst/sections/CapacitacionesSection.module.css";

interface CapacitacionesSectionProps {
  onBack: () => void;
}

export default function CapacitacionesSection({ onBack }: CapacitacionesSectionProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "calendar">("list");

  return (
    <div className={styles.section}>
      {/* Header de la sección */}
      <div className={styles.sectionHeader}>
        <button className={styles.backButton} onClick={onBack}>
          ← Volver
        </button>
        <h1 className={styles.sectionTitle}>Gestión de Capacitaciones</h1>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton}>
            + Nueva Capacitación
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === "list" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 Lista de Capacitaciones
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "create" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("create")}
        >
          🎓 Crear Capacitación
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "calendar" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          📅 Calendario
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div className={styles.content}>
        {activeTab === "list" && (
          <div className={styles.contentSection}>
            <h2>Lista de Capacitaciones</h2>
            <p>Aquí irá la lista de capacitaciones registradas...</p>
            {/* Aquí irá el componente de lista de capacitaciones */}
          </div>
        )}

        {activeTab === "create" && (
          <div className={styles.contentSection}>
            <h2>Crear Nueva Capacitación</h2>
            <p>Formulario para crear nueva capacitación...</p>
            {/* Aquí irá el formulario de creación */}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className={styles.contentSection}>
            <h2>Calendario de Capacitaciones</h2>
            <p>Vista de calendario con las capacitaciones programadas...</p>
            {/* Aquí irá el calendario */}
          </div>
        )}
      </div>
    </div>
  );
}