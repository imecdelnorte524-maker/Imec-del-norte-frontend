import { useState } from "react";
import type {
  SgSstForm,
  FormType,
  FormStatus,
} from "../../../interfaces/SgSstInterface";
import { sgSstService } from "../../../api/sg-sst";
import styles from "../../../styles/components/sg-sst/forms/FormsList.module.css";

interface FormsListProps {
  forms: SgSstForm[];
  onFormClick: (formId: number) => void;
  onFormCreated?: () => void;
  isLoading?: boolean;
  userRole?: string;
  accessLevel?: "full" | "own" | "none";
}

export default function FormsList({
  forms,
  onFormClick,
  isLoading = false,
  userRole,
  accessLevel = "none",
}: FormsListProps) {
  // Estado para controlar qué ID se está descargando (para mostrar spinner)
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const getFormTypeIcon = (formType: FormType): string => {
    switch (formType) {
      case "ATS":
        return "📋";
      case "HEIGHT_WORK":
        return "🪜";
      case "PREOPERATIONAL":
        return "🔧";
      default:
        return "📄";
    }
  };

  const getFormTypeLabel = (formType: FormType): string => {
    switch (formType) {
      case "ATS":
        return "ATS";
      case "HEIGHT_WORK":
        return "Alturas";
      case "PREOPERATIONAL":
        return "Preoperacional";
      default:
        return formType;
    }
  };

  const getStatusColor = (status: FormStatus): string => {
    switch (status) {
      case "DRAFT":
        return "#6B7280";
      case "PENDING_SST":
        return "#F59E0B";
      case "COMPLETED":
        return "#10B981";
      case "REJECTED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: FormStatus): string => {
    switch (status) {
      case "DRAFT":
        return "Borrador";
      case "PENDING_SST":
        return "Pendiente SST";
      case "COMPLETED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCreatorName = (form: SgSstForm): string => {
    if (form.user) {
      return `${form.user.nombre} ${form.user.apellido}`;
    }
    return `Usuario #${form.createdBy}`;
  };

  // Determinar el texto del botón según el rol y estado
  const getButtonText = (form: SgSstForm): string => {
    if (
      userRole?.toUpperCase().includes("SGSST") &&
      form.status === "PENDING_SST"
    ) {
      return "Firmar →";
    }
    return "Ver detalles →";
  };

  // Determinar la clase del botón según el rol y estado
  const getButtonClass = (form: SgSstForm): string => {
    if (
      userRole?.toUpperCase().includes("SGSST") &&
      form.status === "PENDING_SST"
    ) {
      return styles.signButton;
    }
    return styles.viewButton;
  };

  // Función para descargar PDF desde la lista
  const handleDownload = async (e: React.MouseEvent, form: SgSstForm) => {
    e.stopPropagation(); // Evita que se abra el modal al hacer clic en descargar
    if (downloadingId === form.id) return;

    try {
      setDownloadingId(form.id);
      const response = await sgSstService.downloadPdf(form.id);

      // Crear Blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const filename = form.pdfFileName || `${form.formType}_${form.id}.pdf`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar el PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando formularios...</p>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📄</div>
        <h3 className={styles.emptyTitle}>
          {accessLevel === "own"
            ? "No tienes formularios"
            : "No hay formularios"}
        </h3>
        <p className={styles.emptyDescription}>
          {accessLevel === "own"
            ? "Aún no has creado ningún formulario SG-SST."
            : "No se encontraron formularios en el sistema."}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.accessInfo}>
        {accessLevel === "full" && (
          <div className={styles.accessBadgeFull}>
            👁️ Viendo todos los formularios del sistema
          </div>
        )}
        {accessLevel === "own" && (
          <div className={styles.accessBadgeOwn}>
            📋 Viendo solo tus formularios
          </div>
        )}
      </div>

      <div className={styles.list}>
        {forms.map((form) => (
          <div
            key={form.id}
            className={styles.formItem}
            onClick={() => onFormClick(form.id)}
          >
            <div className={styles.formHeader}>
              <div className={styles.formType}>
                <span className={styles.formIcon}>
                  {getFormTypeIcon(form.formType)}
                </span>
                <span className={styles.formTypeLabel}>
                  {getFormTypeLabel(form.formType)}
                </span>
              </div>

              <div
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(form.status) }}
              >
                {getStatusLabel(form.status)}
              </div>
            </div>

            <div className={styles.formContent}>
              {form.toolName && (
                <div className={styles.tool}>
                  <strong>Herramienta:</strong> {form.toolName}
                </div>
              )}

              <div className={styles.formMeta}>
                {accessLevel === "full" && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Creado por:</span>
                    <span className={styles.metaValue}>
                      {getCreatorName(form)}
                    </span>
                  </div>
                )}

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Fecha:</span>
                  <span className={styles.metaValue}>
                    {formatDate(form.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.formFooter}>
              <div className={styles.signatures}>
                {form.technicianSignatureDate && (
                  <span
                    className={styles.signatureIndicator}
                    title="Firmado por técnico"
                  >
                    👤
                  </span>
                )}
                {form.sstSignatureDate && (
                  <span
                    className={styles.signatureIndicator}
                    title="Firmado por SST"
                  >
                    🛡️
                  </span>
                )}
              </div>

              <div className={styles.actionsRow}>
                {/* Botón de descarga rápida solo si está completado */}
                {form.status === "COMPLETED" && (
                  <button
                    className={styles.iconButton}
                    onClick={(e) => handleDownload(e, form)}
                    title="Descargar PDF"
                    disabled={downloadingId === form.id}
                  >
                    {downloadingId === form.id ? (
                      <span className={styles.miniSpinner}></span>
                    ) : (
                      "📥"
                    )}
                  </button>
                )}

                <div className={getButtonClass(form)}>
                  {getButtonText(form)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
