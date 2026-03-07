// src/components/sg-sst/forms/FormDetailsModal.tsx
import { useState, useEffect, useRef } from "react";
import type {
  SgSstForm,
  SignFormData,
} from "../../../interfaces/SgSstInterface";
import type { Usuario } from "../../../interfaces/UserInterfaces";
import { sgSstService } from "../../../api/sg-sst";
import SignaturePad from "../SignaturePad";
import styles from "../../../styles/components/sg-sst/forms/FormDetailsModal.module.css";
import { useModal } from "../../../context/ModalContext";

interface FormDetailsModalProps {
  isOpen: boolean;
  form: SgSstForm;
  onClose: () => void;
  onFormSigned: () => void;
  canSignAsSST: boolean;
  currentUser?: Usuario | null;
}

export default function FormDetailsModal({
  isOpen,
  form,
  onClose,
  onFormSigned,
  canSignAsSST,
  currentUser,
}: FormDetailsModalProps) {
  const { showModal } = useModal();
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSigning, setIsSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "sign">("details");
  const modalRef = useRef<HTMLDivElement>(null);

  // Estados para OTP
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Estados para rechazo
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectArea, setShowRejectArea] = useState(false);

  // Estado para descarga de PDF
  const [isDownloading, setIsDownloading] = useState(false);

  // Resetear estados cuando cambia el formulario
  useEffect(() => {
    if (form) {
      setSignatureData("");
      setOtpRequested(false);
      setOtpCode("");
      setRejectReason("");
      setShowRejectArea(false);
      setActiveTab("details");
      setIsDownloading(false);
    }
  }, [form]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  // 1. Solicitar OTP
  const handleRequestOtp = async () => {
    if (!currentUser?.usuarioId) {
      showModal({
        type: "error",
        title: "Error",
        message: "Usuario no válido",
      });
      return;
    }

    try {
      setIsSigning(true);
      await sgSstService.requestSignOtp(form.id, "SST");
      setOtpRequested(true);
      showModal({
        type: "success",
        title: "OTP Enviado",
        message: "Se ha enviado un código OTP a tu correo electrónico.",
      });
    } catch (error: any) {
      console.error("Error solicitando OTP:", error);
      showModal({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSigning(false);
    }
  };

  // 2. Firmar con OTP
  const handleSignForm = async () => {
    if (!signatureData) {
      showModal({
        type: "warning",
        title: "Firma requerida",
        message: "Debe firmar el formulario antes de enviarlo",
      });
      return;
    }
    if (!otpCode.trim()) {
      showModal({
        type: "warning",
        title: "Código OTP requerido",
        message: "Debe ingresar el código OTP enviado a su correo",
      });
      return;
    }

    setIsSigning(true);

    try {
      const signData: SignFormData = {
        signatureData: signatureData,
        signerType: "SST",
        otpCode: otpCode.trim(),
      };

      const response = await sgSstService.signForm(form.id, signData);

      if (response.success) {
        showModal({
          type: "success",
          title: "¡Éxito!",
          message: "Formulario aprobado y firmado exitosamente",
        });
        onFormSigned();
      }
    } catch (error: any) {
      console.error("Error firmando formulario:", error);
      showModal({
        type: "error",
        title: "Error al firmar",
        message: error.response?.data?.message || error.message,
      });
    } finally {
      setIsSigning(false);
    }
  };

  // Función para rechazar formulario como SST
  const handleRejectForm = async () => {
    if (!currentUser) {
      showModal({
        type: "error",
        title: "Error",
        message: "Usuario no válido",
      });
      return;
    }

    showModal({
      type: "warning",
      title: "Confirmar rechazo",
      message: "¿Seguro que deseas rechazar este formulario?",
      buttons: [
        {
          text: "Cancelar",
          variant: "secondary",
          onClick: () => {},
        },
        {
          text: "Sí, rechazar",
          variant: "danger",
          onClick: async () => {
            setIsRejecting(true);
            try {
              const payload = {
                userId: currentUser.usuarioId,
                userName:
                  `${currentUser.nombre} ${currentUser.apellido || ""}`.trim(),
                reason: rejectReason || undefined,
              };

              const response = await sgSstService.rejectForm(
                form.id,
                payload as any,
              );

              if (response.success) {
                showModal({
                  type: "success",
                  title: "Formulario rechazado",
                  message: "El formulario ha sido rechazado exitosamente",
                });
                onFormSigned();
              } else {
                showModal({
                  type: "error",
                  title: "Error",
                  message: response.message || "Error al rechazar formulario",
                });
              }
            } catch (error: any) {
              console.error("Error rechazando formulario:", error);
              showModal({
                type: "error",
                title: "Error al rechazar",
                message: error.response?.data?.message || error.message,
              });
            } finally {
              setIsRejecting(false);
            }
          },
        },
      ],
    });
  };

  // Función de Descarga de PDF
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const response = await sgSstService.downloadPdf(form.id);

      // Crear URL del Blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Nombre del archivo (usar el del form o generar uno)
      const filename =
        form.pdfFileName || `${form.formType}_${form.id}_Report.pdf`;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      // Limpieza
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      showModal({
        type: "error",
        title: "Error",
        message: "No se pudo descargar el PDF. Intente nuevamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString) return "No especificado";
    return timeString.substring(0, 5);
  };

  const getFormTypeLabel = (formType: string): string => {
    switch (formType) {
      case "ATS":
        return "Análisis de Trabajo Seguro (ATS)";
      case "HEIGHT_WORK":
        return "Trabajo en Alturas";
      case "PREOPERATIONAL":
        return "Checklist Preoperacional";
      default:
        return formType;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "DRAFT":
        return "Borrador";
      case "PENDING_SST":
        return "Pendiente de Autorización SST";
      case "COMPLETED":
        return "Autorizado";
      case "REJECTED":
        return "Rechazado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "DRAFT":
        return "#6B7280";
      case "PENDING_SST":
        return "#F59E0B";
      case "COMPLETED":
        return "#10b981";
      case "REJECTED":
        return "#dc2626";
      default:
        return "#6B7280";
    }
  };

  const renderSelectedRisks = (risks: Record<string, string[]>) => {
    if (!risks || Object.keys(risks).length === 0) {
      return <p className={styles.emptyMessage}>No se seleccionaron riesgos</p>;
    }

    return (
      <div className={styles.risksContainer}>
        {Object.entries(risks).map(([category, riskList]) => (
          <div key={category} className={styles.riskCategory}>
            <h4 className={styles.riskCategoryTitle}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>
            <ul className={styles.riskList}>
              {riskList.map((risk, index) => (
                <li key={index} className={styles.riskItem}>
                  <span className={styles.riskBullet}>•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderSelectedPPEAndTools = (ppe: Record<string, boolean>) => {
    if (!ppe || Object.keys(ppe).length === 0) {
      return (
        <p className={styles.emptyMessage}>
          No se seleccionaron equipos o herramientas
        </p>
      );
    }

    const selectedItems = Object.entries(ppe)
      .filter(([_, isSelected]) => isSelected)
      .map(([item]) => item);

    if (selectedItems.length === 0) {
      return (
        <p className={styles.emptyMessage}>
          No se seleccionaron equipos o herramientas
        </p>
      );
    }

    return (
      <div className={styles.ppeContainer}>
        {selectedItems.map((item, index) => (
          <div key={index} className={styles.ppeItem}>
            <span className={styles.ppeCheck}>✓</span>
            <span className={styles.ppeName}>{item}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderAtsDetails = () => {
    const atsReport = form.atsReport;
    if (!atsReport) return null;

    return (
      <>
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📋</span>
            Información General del ATS
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ID del Reporte:</span>
              <span className={styles.infoValue}>#{atsReport.id}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha de Creación:</span>
              <span className={styles.infoValue}>
                {formatDate(atsReport.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>👤</span>
            Información del Trabajador
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre Completo:</span>
              <span className={styles.infoValue}>{atsReport.workerName}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cargo:</span>
              <span className={styles.infoValue}>
                {atsReport.position || "No especificado"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Área de Trabajo:</span>
              <span className={styles.infoValue}>
                {atsReport.area || "No especificado"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🔧</span>
            Información del Trabajo
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha del Trabajo:</span>
              <span className={styles.infoValue}>
                {atsReport.date || "No especificada"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hora de Inicio:</span>
              <span className={styles.infoValue}>
                {formatTime(atsReport.startTime)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hora de Fin:</span>
              <span className={styles.infoValue}>
                {formatTime(atsReport.endTime)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ubicación:</span>
              {atsReport.location ? (
                <button
                  className={styles.locationButton}
                  onClick={() => {
                    window.open(
                      atsReport.location,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                  title="Abrir ubicación en Google Maps"
                >
                  <span className={styles.locationIcon}>📍</span>
                  <span className={styles.infoValue}>Ubicación Maps</span>
                </button>
              ) : (
                <span className={styles.infoValue}>No especificado</span>
              )}
            </div>
          </div>

          <div className={styles.fullWidthItem}>
            <span className={styles.infoLabel}>Trabajo a Realizar:</span>
            <div className={styles.textContent}>
              {atsReport.workToPerform || "No especificado"}
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>⚠️</span>
            Identificación de Riesgos
          </h3>
          {renderSelectedRisks(atsReport.selectedRisks || {})}
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🛡️</span>
            Equipos y Herramientas
          </h3>
          {renderSelectedPPEAndTools(atsReport.requiredPpe || {})}
        </div>

        {atsReport.observations && (
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📝</span>
              Observaciones
            </h3>
            <div className={styles.observations}>{atsReport.observations}</div>
          </div>
        )}
      </>
    );
  };

  const renderHeightWorkDetails = () => {
    const heightWork = form.heightWork;
    if (!heightWork) return null;

    return (
      <>
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🔧</span>
            Detalles del Trabajo en Alturas
          </h3>

          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>
              <span className={styles.subsectionIcon}>👤</span>
              Información del Trabajador
            </h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Nombre Completo:</span>
                <span className={styles.infoValue}>
                  {heightWork.workerName}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Identificación:</span>
                <span className={styles.infoValue}>
                  {heightWork.identification || "No especificado"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Cargo:</span>
                <span className={styles.infoValue}>
                  {heightWork.position || "No especificado"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>
              <span className={styles.subsectionIcon}>📝</span>
              Descripción del Trabajo
            </h4>
            <div className={styles.fullWidthItem}>
              <span className={styles.infoLabel}>Descripción:</span>
              <div className={styles.textContent}>
                {heightWork.workDescription || "No especificado"}
              </div>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ubicación:</span>
                {heightWork.location ? (
                  <button
                    className={styles.locationButton}
                    onClick={() => {
                      window.open(
                        heightWork.location,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    title="Abrir ubicación en Google Maps"
                  >
                    <span className={styles.locationIcon}>📍</span>
                    <span className={styles.infoValue}>Ubicación Maps</span>
                  </button>
                ) : (
                  <span className={styles.infoValue}>No especificado</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tiempo Estimado:</span>
                <span className={styles.infoValue}>
                  {heightWork.estimatedTime || "No especificado"}
                </span>
              </div>
            </div>
          </div>

          {heightWork.protectionElements &&
            Object.keys(heightWork.protectionElements).length > 0 && (
              <div className={styles.subsection}>
                <h4 className={styles.subsectionTitle}>
                  <span className={styles.subsectionIcon}>🛡️</span>
                  Elementos de Protección
                </h4>
                <div className={styles.badgeList}>
                  {Object.entries(heightWork.protectionElements)
                    .filter(([_, value]) => value === true)
                    .map(([element]) => (
                      <span key={element} className={styles.badge}>
                        ✓ {element}
                      </span>
                    ))}
                </div>
              </div>
            )}

          {form.status === "COMPLETED" && (
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>
                <span className={styles.subsectionIcon}>✅</span>
                Autorización SST
              </h4>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Autorizado por:</span>
                  <span className={styles.infoValue}>
                    {heightWork.authorizerName || "No especificado"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Identificación:</span>
                  <span className={styles.infoValue}>
                    {heightWork.authorizerIdentification || "No especificado"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Condiciones físicas:</span>
                  <span
                    className={`${styles.statusBadge} ${heightWork.physicalCondition ? styles.success : styles.error}`}
                  >
                    {heightWork.physicalCondition
                      ? "✅ Verificadas"
                      : "❌ No verificadas"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Instrucciones:</span>
                  <span
                    className={`${styles.statusBadge} ${heightWork.instructionsReceived ? styles.success : styles.error}`}
                  >
                    {heightWork.instructionsReceived
                      ? "✅ Recibidas"
                      : "❌ No recibidas"}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Apto para alturas:</span>
                  <span
                    className={`${styles.statusBadge} ${heightWork.fitForHeightWork ? styles.success : styles.error}`}
                  >
                    {heightWork.fitForHeightWork ? "✅ Sí" : "❌ No"}
                  </span>
                </div>
                {form.sstSignatureDate && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Fecha autorización:
                    </span>
                    <span className={styles.infoValue}>
                      {formatDate(form.sstSignatureDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPreoperationalDetails = () => {
    const preoperational = form.preoperationalChecks;
    const checks = preoperational || [];

    if (checks.length === 0) return null;

    const goodChecks = checks.filter((check) => check.value === "GOOD").length;
    const regularChecks = checks.filter(
      (checks) => checks.value === "REGULAR",
    ).length;
    const badChecks = checks.filter((check) => check.value === "BAD").length;
    const totalChecks = checks.length;
    const totalScore = goodChecks * 1 + regularChecks * 0.5 + badChecks * 0;
    const maxScore = totalChecks;
    const percentageScore =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return (
      <>
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🔍</span>
            Checklist Preoperacional
          </h3>

          <div className={styles.summaryStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{goodChecks}</span>
              <span className={styles.statLabel}>Correctos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{regularChecks}</span>
              <span className={styles.statLabel}>Regular</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{badChecks}</span>
              <span className={styles.statLabel}>Incorrectos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalChecks}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={`${styles.statItem} ${styles.percentageStat}`}>
              <span className={styles.statValue}>{percentageScore}%</span>
              <span className={styles.statLabel}>Aprobación</span>
            </div>
          </div>

          <div className={styles.checksList}>
            {checks.map((check, index) => (
              <div
                key={index}
                className={`${styles.checkItem} ${
                  check.value === "GOOD"
                    ? styles.goodCheck
                    : check.value === "REGULAR"
                      ? styles.regularCheck
                      : styles.badCheck
                }`}
              >
                <div className={styles.checkHeader}>
                  <span className={styles.checkNumber}>{index + 1}.</span>
                  <span className={styles.checkParameter}>
                    {check.parameter}
                  </span>
                  <span className={styles.checkValue}>
                    {check.value === "GOOD"
                      ? "✅"
                      : check.value === "REGULAR"
                        ? "⚠️"
                        : "❌"}
                  </span>
                </div>
                {check.observations && (
                  <div className={styles.checkObservations}>
                    <span className={styles.observationsLabel}>
                      Observaciones:
                    </span>
                    <span>{check.observations}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.conclusionBox}>
            <h4 className={styles.conclusionTitle}>📋 Conclusión</h4>
            {badChecks === 0 ? (
              <div className={styles.successConclusion}>
                <span className={styles.conclusionIcon}>✅</span>
                <div>
                  <strong>Equipo en óptimas condiciones</strong>
                  <p>
                    Todos los puntos fueron aprobados. El herramienta está apto
                    para uso.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.warningConclusion}>
                <span className={styles.conclusionIcon}>⚠️</span>
                <div>
                  <strong>Equipo con observaciones</strong>
                  <p>
                    Se encontraron {badChecks} punto(s) que requieren atención.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderFormDetails = () => {
    return (
      <div className={styles.detailsContainer}>
        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📄</span>
            Información General
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tipo:</span>
              <span className={styles.infoValue}>
                {getFormTypeLabel(form.formType)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Estado:</span>
              <span
                className={styles.statusBadge}
                style={{
                  backgroundColor: getStatusColor(form.status) + "20",
                  color: getStatusColor(form.status),
                }}
              >
                {getStatusLabel(form.status)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ID del Formulario:</span>
              <span className={styles.infoValue}>#{form.id}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Creado por:</span>
              <span className={styles.infoValue}>
                {form.user
                  ? `${form.user.nombre} ${form.user.apellido}`
                  : `Usuario #${form.createdBy}`}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Creación:</span>
              <span className={styles.infoValue}>
                {formatDate(form.createdAt)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Actualización:</span>
              <span className={styles.infoValue}>
                {formatDate(form.updatedAt)}
              </span>
            </div>
          </div>

          {form.status === "REJECTED" && (
            <div className={styles.rejectionBox}>
              <h4 className={styles.rejectionTitle}>Motivo de rechazo</h4>
              <p className={styles.rejectionReason}>
                <strong>
                  {form.rejectedByUserName || "Rechazado por SG-SST"}:
                </strong>{" "}
                {form.rejectionReason || "Sin motivo especificado"}
              </p>
              {form.rejectedAt && (
                <p className={styles.rejectionDate}>
                  Fecha: {formatDate(form.rejectedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>✍️</span>
            Firmas
          </h3>
          <div className={styles.signaturesGrid}>
            <div className={styles.signatureCard}>
              <span className={styles.signatureRole}>Técnico</span>
              <span
                className={`${styles.signatureStatus} ${
                  form.technicianSignatureDate ? styles.signed : styles.pending
                }`}
              >
                {form.technicianSignatureDate ? "✅ Firmado" : "⏳ Pendiente"}
              </span>
              {form.technicianSignatureDate && (
                <span className={styles.signatureDate}>
                  {formatDate(form.technicianSignatureDate)}
                </span>
              )}
            </div>
            <div className={styles.signatureCard}>
              <span className={styles.signatureRole}>SG-SST</span>
              <span
                className={`${styles.signatureStatus} ${
                  form.sstSignatureDate ? styles.signed : styles.pending
                }`}
              >
                {form.sstSignatureDate ? "✅ Firmado" : "⏳ Pendiente"}
              </span>
              {form.sstSignatureDate && (
                <span className={styles.signatureDate}>
                  {formatDate(form.sstSignatureDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 🟢 BOTÓN DE DESCARGA: Solo si está completado */}
        {form.status === "COMPLETED" && (
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📂</span>
              PDF del Reporte
            </h3>
            <p className={styles.downloadDescription}>
              El formulario está completado y firmado. Puedes descargar el PDF.
            </p>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className={styles.spinner}></span>
                  Descargando...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Descargar PDF Firmado
                </>
              )}
            </button>
          </div>
        )}

        {form.formType === "ATS" && renderAtsDetails()}
        {form.formType === "HEIGHT_WORK" && renderHeightWorkDetails()}
        {form.formType === "PREOPERATIONAL" && renderPreoperationalDetails()}

        {form.signatures && form.signatures.length > 0 && (
          <div className={styles.detailCard}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📋</span>
              Registro de Firmas Digitales
            </h3>
            <div className={styles.signaturesDetail}>
              {form.signatures.map((signature, index) => (
                <div key={index} className={styles.signatureDetail}>
                  <div className={styles.signatureInfo}>
                    <span className={styles.signatureName}>
                      {signature.userName}
                    </span>
                    <span className={styles.signatureType}>
                      ({signature.signatureType})
                    </span>
                    <span className={styles.signatureDate}>
                      {formatDate(signature.signedAt)}
                    </span>
                  </div>
                  {signature.signatureData && (
                    <div className={styles.signatureImageContainer}>
                      <img
                        src={signature.signatureData}
                        alt={`Firma de ${signature.userName}`}
                        className={styles.signatureImage}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStandardSignTab = () => {
    if (!canSignAsSST) {
      return (
        <div className={styles.messageContainer}>
          <div className={styles.errorMessage}>
            <span className={styles.messageIcon}>⚠️</span>
            <p>No tienes permisos para firmar formularios como SG-SST.</p>
          </div>
        </div>
      );
    }

    if (form.status === "COMPLETED") {
      return (
        <div className={styles.messageContainer}>
          <div className={styles.successMessage}>
            <span className={styles.messageIcon}>✅</span>
            <p>Este formulario ya ha sido aprobado.</p>
          </div>
        </div>
      );
    }

    if (form.status === "REJECTED") {
      return (
        <div className={styles.messageContainer}>
          <div className={styles.errorMessage}>
            <span className={styles.messageIcon}>❌</span>
            <p>Este formulario ha sido rechazado.</p>
          </div>
        </div>
      );
    }

    if (form.status !== "PENDING_SST") {
      return (
        <div className={styles.messageContainer}>
          <div className={styles.warningMessage}>
            <span className={styles.messageIcon}>⏳</span>
            <p>Este formulario no está pendiente de firma SST.</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.signContainer}>
        <div className={styles.signInfoCard}>
          <h3 className={styles.signInfoTitle}>Firmar como SG-SST</h3>
          <p>
            Estás a punto de firmar el formulario{" "}
            <strong>{getFormTypeLabel(form.formType)}</strong> creado por{" "}
            <strong>
              {form.user
                ? `${form.user.nombre} ${form.user.apellido}`
                : `Usuario #${form.createdBy}`}
            </strong>
            .
          </p>
          <div className={styles.warningBox}>
            <span className={styles.warningIcon}>⚠️</span>
            <p>
              Al firmar, el formulario será marcado como{" "}
              <strong>Aprobado</strong> y no podrá ser editado.
            </p>
          </div>
        </div>

        <div className={styles.signatureCard}>
          <SignaturePad
            onSignatureSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />

          {signatureData && (
            <div className={styles.signaturePreview}>
              <span className={styles.previewLabel}>Firma guardada:</span>
              <img
                src={signatureData}
                alt="Firma del SG-SST"
                className={styles.previewImage}
              />
            </div>
          )}

          {/* INPUT PARA OTP */}
          {!otpRequested ? (
            <div className={styles.otpRequestBox}>
              <button
                type="button"
                className={styles.otpRequestButton}
                onClick={handleRequestOtp}
                disabled={isSigning}
              >
                {isSigning ? (
                  <>
                    <span className={styles.spinner}></span>
                    Enviando OTP...
                  </>
                ) : (
                  "Solicitar Código OTP"
                )}
              </button>
              <p className={styles.otpHelp}>
                Recibirás un código en tu correo electrónico.
              </p>
            </div>
          ) : (
            <div className={styles.otpInputBox}>
              <label className={styles.otpLabel}>Código OTP:</label>
              <input
                type="text"
                className={styles.otpInput}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
              <p className={styles.otpHelp}>
                Ingresa el código de 6 dígitos enviado a tu correo.
              </p>
            </div>
          )}
        </div>

        <div className={styles.signActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setActiveTab("details")}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.signButton}
            onClick={handleSignForm}
            disabled={!signatureData || isSigning || !otpRequested || !otpCode}
          >
            {isSigning ? (
              <>
                <span className={styles.spinner}></span>
                Firmando...
              </>
            ) : (
              "Aprobar y Firmar"
            )}
          </button>
        </div>

        <div className={styles.rejectContainer}>
          {!showRejectArea ? (
            <button
              type="button"
              className={styles.rejectToggleButton}
              onClick={() => setShowRejectArea(true)}
            >
              Rechazar formulario
            </button>
          ) : (
            <div className={styles.rejectBox}>
              <h4 className={styles.rejectTitle}>Rechazar formulario</h4>
              <p className={styles.rejectDescription}>
                Indica el motivo del rechazo. El formulario quedará marcado como{" "}
                <strong>Rechazado</strong>.
              </p>
              <textarea
                className={styles.rejectTextarea}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo..."
                rows={3}
              />
              <div className={styles.rejectActions}>
                <button
                  type="button"
                  className={styles.cancelRejectButton}
                  onClick={() => {
                    setShowRejectArea(false);
                    setRejectReason("");
                  }}
                  disabled={isRejecting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={handleRejectForm}
                  disabled={isRejecting}
                >
                  {isRejecting ? (
                    <>
                      <span className={styles.spinner}></span>
                      Rechazando...
                    </>
                  ) : (
                    "Rechazar formulario"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSignTab = () => {
    return renderStandardSignTab();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {getFormTypeLabel(form.formType)} - #{form.id}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "details"}
            className={`${styles.tab} ${
              activeTab === "details" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            📋 Detalles
          </button>

          {/* ✅ Solo aparece cuando está pendiente y el usuario puede firmar */}
          {form.status === "PENDING_SST" && canSignAsSST && (
            <button
              role="tab"
              aria-selected={activeTab === "sign"}
              className={`${styles.tab} ${
                activeTab === "sign" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("sign")}
            >
              ✍️ Firmar
            </button>
          )}
        </div>

        <div className={styles.content}>
          {activeTab === "details" ? renderFormDetails() : renderSignTab()}
        </div>
      </div>
    </div>
  );
}
