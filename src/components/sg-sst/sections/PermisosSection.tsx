import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import AtsForm from "../forms/AtsForm";
import HeightWorkForm from "../forms/HeightWorkForm";
import PreoperationalForm from "../forms/PreoperationalForm";
import FormsList from "../forms/FormsList";
import StatsCards from "../StastCards";
import FormDetailsModal from "../forms/FormDetailsModal";
import PreoperationalTemplateForm from "../forms/PreoperationalTemplateForm";
import { sgSstService } from "../../../api/sg-sst";
import type { SgSstForm, SgSstStats } from "../../../interfaces/SgSstInterface";
import styles from "../../../styles/components/sg-sst/sections/PermisosSection.module.css";
import { getUserAccessLevel } from "../../../config/roles.config";

interface PermisosSectionProps {
  onBack: () => void;
}

export default function PermisosSection({ onBack }: PermisosSectionProps) {
  const { user } = useAuth();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<SgSstForm | null>(null);
  const [forms, setForms] = useState<SgSstForm[]>([]);
  const [stats, setStats] = useState<SgSstStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentForm, setCurrentForm] = useState<
    "ats" | "height" | "preop" | "list" | "template"
  >("list");

  const accessLevel = getUserAccessLevel(user?.role.nombreRol);
  const canView =
    user?.role.nombreRol !== "Administrador" &&
    user?.role.nombreRol !== "SG-SST" &&
    user?.role.nombreRol !== "SGSST" &&
    user?.role.nombreRol !== "Sg-sst";
  const isAdmin = user?.role.nombreRol === "Administrador";

  // Cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      const [formsResponse, statsResponse] = await Promise.all([
        sgSstService.getAllForms(),
        sgSstService.getDashboardStats(),
      ]);

      if (formsResponse.success) {
        setForms(formsResponse.data || []);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data || null);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  const handleFormSelect = (
    formType: "ATS" | "HEIGHT_WORK" | "PREOPERATIONAL",
  ) => {
    switch (formType) {
      case "ATS":
        setCurrentForm("ats");
        break;
      case "HEIGHT_WORK":
        setCurrentForm("height");
        break;
      case "PREOPERATIONAL":
        setCurrentForm("preop");
        break;
    }
  };

  const handleFormSubmit = async () => {
    setCurrentForm("list");
    await loadData();
  };

  const handleFormClick = async (formId: number) => {
    try {
      const response = await sgSstService.getFormById(formId);
      if (response.success) {
        setSelectedForm(response.data as unknown as SgSstForm);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error cargando formulario:", error);
    }
  };

  const renderForm = () => {
    const commonProps = {
      onSubmit: handleFormSubmit,
      onCancel: () => setCurrentForm("list"),
      userId: user?.usuarioId || 0,
      createdBy: user?.usuarioId || 0,
    };

    switch (currentForm) {
      case "ats":
        return <AtsForm {...commonProps} />;
      case "height":
        return <HeightWorkForm {...commonProps} />;
      case "preop":
        return (
          <PreoperationalForm
            {...commonProps}
            userName={`${user?.nombre} ${user?.apellido || ""}`.trim()}
          />
        );
      case "template":
        // 🔹 Formulario para crear plantillas de checklist preoperacional
        return <PreoperationalTemplateForm />;
      case "list":
      default:
        return (
          <div className={styles.dashboardContent}>
            {/* Barra de acciones */}
            <div className={styles.actionsBar}>
              <button className={styles.refreshButton} onClick={loadData}>
                Actualizar
              </button>
            </div>

            {/* Estadísticas */}
            {stats && (
              <div className={styles.statsSection}>
                <h3>Estadísticas de Permisos</h3>
                <StatsCards stats={stats} />
              </div>
            )}

            {/* Lista de formularios */}
            <div className={styles.formsSection}>
              <h3>Todos los Permisos</h3>
              {loading ? (
                <div className={styles.loading}>Cargando permisos...</div>
              ) : (
                <FormsList
                  forms={forms}
                  onFormClick={handleFormClick}
                  onFormCreated={loadData}
                  userRole={user?.role?.nombreRol || ""}
                  accessLevel={accessLevel}
                />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.section}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={onBack}>
            ← Volver al Dashboard
          </button>
          <h1 className={styles.sectionTitle}>Permisos de Trabajo</h1>
          <p className={styles.sectionSubtitle}>
            Gestión de ATS, Trabajos en Altura y Checklist Preoperacional
          </p>
        </div>
        <div className={styles.headerRight}>
          {currentForm !== "list" && (
            <button
              className={styles.secondaryButton}
              onClick={() => setCurrentForm("list")}
            >
              ← Ver Todos los Permisos
            </button>
          )}
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            currentForm === "list" ? styles.activeTab : ""
          }`}
          onClick={() => setCurrentForm("list")}
        >
          📋 Todos los Permisos
        </button>
        {canView && (
          <button
            className={`${styles.tab} ${
              currentForm === "ats" ? styles.activeTab : ""
            }`}
            onClick={() => handleFormSelect("ATS")}
          >
            ⚠️ ATS
          </button>
        )}
        {canView && (
          <button
            className={`${styles.tab} ${
              currentForm === "height" ? styles.activeTab : ""
            }`}
            onClick={() => handleFormSelect("HEIGHT_WORK")}
          >
            🧗 Trabajos en Altura
          </button>
        )}
        {canView && (
          <button
            className={`${styles.tab} ${
              currentForm === "preop" ? styles.activeTab : ""
            }`}
            onClick={() => handleFormSelect("PREOPERATIONAL")}
          >
            ✅ Checklist Preoperacional
          </button>
        )}
        {isAdmin && (
          <button
            className={`${styles.tab} ${
              currentForm === "template" ? styles.activeTab : ""
            }`}
            onClick={() => setCurrentForm("template")}
          >
            🛠️ Plantillas Preoperacionales
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>{renderForm()}</div>

      {/* Modal de detalles del formulario */}
      {showDetailsModal && selectedForm && (
        <FormDetailsModal
          isOpen={showDetailsModal}
          form={selectedForm}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedForm(null);
          }}
          onFormSigned={() => {
            setShowDetailsModal(false);
            setSelectedForm(null);
            loadData();
          }}
          canSignAsSST={
            // Aquí aseguramos que role exista para evitar errores
            (user?.role?.nombreRol?.toUpperCase() || "").includes("SGSST") ||
            (user?.role?.nombreRol?.toUpperCase() || "").includes("SG-SST")
          }
          currentUser={user}
        />
      )}
    </div>
  );
}