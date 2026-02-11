// src/components/sg-sst/forms/FormDetailsModal.tsx
import { useState } from "react";
import type { SgSstForm, SignerType } from "../../../interfaces/SgSstInterface";
import type { Usuario } from "../../../interfaces/UserInterfaces";
import { sgSstService } from "../../../api/sg-sst";
import SignaturePad from "../SignaturePad";
import styles from "../../../styles/components/sg-sst/forms/FormDetailsModal.module.css";

interface FormDetailsModalProps {
  isOpen: boolean;
  form: SgSstForm;
  onClose: () => void;
  onFormSigned: () => void; // se usa tanto para "firmar" como para "rechazar" (refresca lista + cierra)
  canSignAsSST: boolean;
  currentUser?: Usuario | null;
  onDownloadPdf?: (formId: number) => void;
  pdfLoading?: boolean;
}

export default function FormDetailsModal({
  isOpen,
  form,
  onClose,
  onFormSigned,
  canSignAsSST,
  currentUser,
  onDownloadPdf,
  pdfLoading = false,
}: FormDetailsModalProps) {
  const [signatureData, setSignatureData] = useState<string>("");
  const [isSigning, setIsSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "sign">("details");

  // Estados para rechazo
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectArea, setShowRejectArea] = useState(false);

  if (!isOpen) return null;

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  // Función para firmar formularios como SST (cualquier tipo)
  const handleSignForm = async () => {
    if (!signatureData || !currentUser) {
      alert("Debe firmar el formulario antes de enviarlo");
      return;
    }

    if (!currentUser.usuarioId) {
      alert("Error: Usuario no válido");
      return;
    }

    setIsSigning(true);

    try {
      const signData = {
        signatureData: signatureData,
        signerType: "SST" as SignerType,
        userId: currentUser.usuarioId,
        userName: `${currentUser.nombre} ${currentUser.apellido || ""}`.trim(),
      };

      const response = await sgSstService.signForm(form.id, signData);

      if (response.success) {
        alert("Formulario firmado exitosamente");
        onFormSigned();
      }
    } catch (error: any) {
      console.error("Error firmando formulario:", error);
      alert(
        `Error al firmar: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsSigning(false);
    }
  };

  // Función para rechazar formulario como SST
  const handleRejectForm = async () => {
    if (!currentUser) {
      alert("Error: Usuario no válido");
      return;
    }

    if (!window.confirm("¿Seguro que deseas rechazar este formulario?")) {
      return;
    }

    setIsRejecting(true);
    try {
      const payload = {
        userId: currentUser.usuarioId,
        userName: `${currentUser.nombre} ${currentUser.apellido || ""}`.trim(),
        reason: rejectReason || undefined,
      };

      const response = await sgSstService.rejectForm(form.id, payload as any);

      if (response.success) {
        alert("Formulario rechazado exitosamente");
        onFormSigned();
      } else {
        alert(response.message || "Error al rechazar formulario");
      }
    } catch (error: any) {
      console.error("Error rechazando formulario:", error);
      alert(
        `Error al rechazar: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsRejecting(false);
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
      return <p>No se seleccionaron riesgos</p>;
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
      return <p>No se seleccionaron equipos o herramientas</p>;
    }

    const selectedItems = Object.entries(ppe)
      .filter(([_, isSelected]) => isSelected)
      .map(([item]) => item);

    if (selectedItems.length === 0) {
      return <p>No se seleccionaron equipos o herramientas</p>;
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
        {/* SECCIÓN 1: INFORMACIÓN GENERAL DEL ATS */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>
            📋 Información General del ATS
          </h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>ID del Reporte:</label>
              <span>#{atsReport.id}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Fecha de Creación:</label>
              <span>{formatDate(atsReport.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN DEL TRABAJADOR */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>👤 Información del Trabajador</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Nombre Completo:</label>
              <span>{atsReport.workerName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Cargo:</label>
              <span>{atsReport.position || "No especificado"}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Área de Trabajo:</label>
              <span>{atsReport.area || "No especificado"}</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: INFORMACIÓN DEL TRABAJO */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>🔧 Información del Trabajo</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Fecha del Trabajo:</label>
              <span>{atsReport.date || "No especificada"}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Hora de Inicio:</label>
              <span>{formatTime(atsReport.startTime)}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Hora de Fin:</label>
              <span>{formatTime(atsReport.endTime)}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Ubicación:</label>
              <span>{atsReport.location || "No especificada"}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Trabajo a Realizar:</label>
            <div className={styles.workDescription}>
              {atsReport.workToPerform || "No especificado"}
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: IDENTIFICACIÓN DE RIESGOS */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>⚠️ Identificación de Riesgos</h3>
          {renderSelectedRisks(atsReport.selectedRisks || {})}
        </div>

        {/* SECCIÓN 5: EPP Y HERRAMIENTAS REQUERIDAS */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>🛡️ Equipos y Herramientas</h3>
          {renderSelectedPPEAndTools(atsReport.requiredPpe || {})}
        </div>

        {/* SECCIÓN 6: OBSERVACIONES */}
        {atsReport.observations && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>📝 Observaciones</h3>
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
      <div className={styles.detailSection}>
        <h3 className={styles.sectionTitle}>
          🔧 Detalles del Trabajo en Alturas
        </h3>

        {/* Información del trabajador */}
        <div className={styles.subsection}>
          <h4 className={styles.subsectionTitle}>
            👤 Información del Trabajador
          </h4>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Nombre Completo:</label>
              <span>{heightWork.workerName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Identificación:</label>
              <span>{heightWork.identification || "No especificado"}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Cargo:</label>
              <span>{heightWork.position || "No especificado"}</span>
            </div>
          </div>
        </div>

        {/* Descripción del trabajo */}
        <div className={styles.subsection}>
          <h4 className={styles.subsectionTitle}>📝 Descripción del Trabajo</h4>
          <div className={styles.detailItem}>
            <label>Descripción:</label>
            <div className={styles.textValue}>
              {heightWork.workDescription || "No especificado"}
            </div>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Ubicación:</label>
              <span>{heightWork.location || "No especificado"}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Tiempo Estimado:</label>
              <span>{heightWork.estimatedTime || "No especificado"}</span>
            </div>
          </div>
        </div>

        {/* Elementos de protección */}
        {heightWork.protectionElements &&
          Object.keys(heightWork.protectionElements).length > 0 && (
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>
                🛡️ Elementos de Protección
              </h4>
              <div className={styles.protectionList}>
                {Object.entries(heightWork.protectionElements)
                  .filter(([_, value]) => value === true)
                  .map(([element]) => (
                    <div key={element} className={styles.protectionItem}>
                      <span className={styles.protectionIcon}>✓</span>
                      <span>{element}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Estado de autorización */}
        {form.status === "COMPLETED" && (
          <div className={styles.subsection}>
            <h4 className={styles.subsectionTitle}>✅ Autorización SST</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Autorizado por:</label>
                <span>{heightWork.authorizerName || "No especificado"}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Identificación del autorizador:</label>
                <span>
                  {heightWork.authorizerIdentification || "No especificado"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <label>Condiciones físicas verificadas:</label>
                <span>{heightWork.physicalCondition ? "✅ Sí" : "❌ No"}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Instrucciones recibidas:</label>
                <span>
                  {heightWork.instructionsReceived ? "✅ Sí" : "❌ No"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <label>Apto para trabajo en alturas:</label>
                <span>{heightWork.fitForHeightWork ? "✅ Sí" : "❌ No"}</span>
              </div>
              {form.sstSignatureDate && (
                <div className={styles.detailItem}>
                  <label>Fecha de autorización:</label>
                  <span>{formatDate(form.sstSignatureDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
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
    // Asignar pesos: GOOD=1, REGULAR=0.5, BAD=0
    const totalScore = goodChecks * 1 + regularChecks * 0.5 + badChecks * 0;
    const maxScore = totalChecks;
    const percentageScore =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return (
      <>
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>🔍 Checklist Preoperacional</h3>

          {/* Resumen */}
          <div className={styles.summarySection}>
            <div className={styles.summaryStats}>
              <div className={`${styles.statItem} ${styles.goodStat}`}>
                <span className={styles.statNumber}>{goodChecks}</span>
                <span className={styles.statLabel}>Correctos</span>
              </div>
              <div className={`${styles.statItem} ${styles.regularStat}`}>
                <span className={styles.statNumber}>{regularChecks}</span>
                <span className={styles.statLabel}>Regular</span>
              </div>
              <div className={`${styles.statItem} ${styles.badStat}`}>
                <span className={styles.statNumber}>{badChecks}</span>
                <span className={styles.statLabel}>Incorrectos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{totalChecks}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={`${styles.statItem} ${styles.percentageStat}`}>
                <span className={styles.statNumber}>{percentageScore}%</span>
                <span className={styles.statLabel}>Aprobación</span>
              </div>
            </div>
          </div>

          {/* Lista de checks */}
          <div className={styles.checksList}>
            {checks.map((check, index) => (
              <div
                key={index}
                className={`${styles.checkItem} ${
                  check.value === "GOOD" ? styles.goodCheck : styles.badCheck
                }`}
              >
                <div className={styles.checkHeader}>
                  <span className={styles.checkNumber}>{index + 1}.</span>
                  <span className={styles.checkParameter}>
                    {check.parameter}
                  </span>
                  <span
                    className={`${styles.checkValue} ${
                      check.value === "GOOD"
                        ? styles.goodValue
                        : styles.badValue
                    }`}
                  >
                    {check.value === "GOOD"
                      ? "✅ BUENO"
                      : check.value === "REGULAR"
                        ? "⚠️ REGULAR"
                        : "❌ MALO"}
                  </span>
                </div>
                {check.observations && (
                  <div className={styles.checkObservations}>
                    <strong>Observaciones:</strong> {check.observations}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Conclusión */}
          <div className={styles.conclusionSection}>
            <h4 className={styles.conclusionTitle}>
              📋 Conclusión del Checklist
            </h4>
            <div className={styles.conclusionContent}>
              {badChecks === 0 ? (
                <div className={styles.successConclusion}>
                  <span className={styles.conclusionIcon}>✅</span>
                  <div>
                    <strong>Equipo en óptimas condiciones</strong>
                    <p>
                      Todos los puntos del checklist fueron aprobados. El
                      herramienta está apto para uso.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.warningConclusion}>
                  <span className={styles.conclusionIcon}>⚠️</span>
                  <div>
                    <strong>Equipo con observaciones</strong>
                    <p>
                      Se encontraron {badChecks} punto(s) que requieren
                      atención. Verifique antes de usar el herramienta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderFormDetails = () => {
    return (
      <div className={styles.detailsContent}>
        {/* INFORMACIÓN GENERAL DEL FORMULARIO */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>📄 Información General</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <label>Tipo de Formulario:</label>
              <span>{getFormTypeLabel(form.formType)}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Estado:</label>
              <span
                className={styles.status}
                style={{ color: getStatusColor(form.status) }}
              >
                {getStatusLabel(form.status)}
              </span>
            </div>
            <div className={styles.detailItem}>
              <label>ID del Formulario:</label>
              <span>#{form.id}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Creado por:</label>
              <span>
                {form.user
                  ? `${form.user.nombre} ${form.user.apellido}`
                  : `Usuario #${form.createdBy}`}
              </span>
            </div>
            <div className={styles.detailItem}>
              <label>Fecha de creación:</label>
              <span>{formatDate(form.createdAt)}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Última actualización:</label>
              <span>{formatDate(form.updatedAt)}</span>
            </div>
          </div>

          {/* Motivo de rechazo (si aplica) */}
          {form.status === "REJECTED" && (
            <div className={styles.rejectionBox}>
              <h4>Motivo de rechazo</h4>
              <p>
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

        {/* FIRMAS */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>✍️ Firmas</h3>
          <div className={styles.signaturesList}>
            <div className={styles.signatureItem}>
              <strong>Técnico:</strong>
              <span
                className={
                  form.technicianSignatureDate ? styles.signed : styles.pending
                }
              >
                {form.technicianSignatureDate ? "✅ Firmado" : "❌ Pendiente"}
              </span>
              {form.technicianSignatureDate && (
                <small>{formatDate(form.technicianSignatureDate)}</small>
              )}
            </div>
            <div className={styles.signatureItem}>
              <strong>SG-SST:</strong>
              <span
                className={
                  form.sstSignatureDate ? styles.signed : styles.pending
                }
              >
                {form.sstSignatureDate ? "✅ Firmado" : "❌ Pendiente"}
              </span>
              {form.sstSignatureDate && (
                <small>{formatDate(form.sstSignatureDate)}</small>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN DESCARGAR PDF */}
        {form.status === "COMPLETED" && onDownloadPdf && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>📂 PDF del Reporte</h3>
            <p className={styles.downloadDescription}>
              El formulario está completado. Puedes generar y descargar el PDF
              con toda la información registrada.
            </p>
            <button
              type="button"
              className={styles.downloadButton}
              onClick={() => onDownloadPdf(form.id)}
              disabled={pdfLoading}
            >
              {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>
        )}

        {/* DETALLES ESPECÍFICOS */}
        {form.formType === "ATS" && renderAtsDetails()}
        {form.formType === "HEIGHT_WORK" && renderHeightWorkDetails()}
        {form.formType === "PREOPERATIONAL" && renderPreoperationalDetails()}

        {/* REGISTRO DE FIRMAS */}
        {form.signatures && form.signatures.length > 0 && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>
              📋 Registro de Firmas Digitales
            </h3>
            <div className={styles.signaturesDetail}>
              {form.signatures.map((signature, index) => (
                <div key={index} className={styles.signatureDetail}>
                  <div className={styles.signatureInfo}>
                    <strong>{signature.userName}</strong>
                    <span className={styles.signatureType}>
                      ({signature.signatureType})
                    </span>
                    <small>{formatDate(signature.signedAt)}</small>
                  </div>
                  {signature.signatureData && (
                    <div className={styles.signatureImageContainer}>
                      <img
                        src={signature.signatureData}
                        alt={`Firma de ${signature.userName}`}
                        className={styles.signatureImageSmall}
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
        <div className={styles.unauthorized}>
          <p>No tienes permisos para firmar formularios como SG-SST.</p>
        </div>
      );
    }

    if (form.status === "COMPLETED") {
      return (
        <div className={styles.alreadySigned}>
          <p>✅ Este formulario ya ha sido aprobado.</p>
        </div>
      );
    }

    if (form.status === "REJECTED") {
      return (
        <div className={styles.alreadySigned}>
          <p>❌ Este formulario ha sido rechazado.</p>
        </div>
      );
    }

    if (form.status !== "PENDING_SST") {
      return (
        <div className={styles.unauthorized}>
          <p>Este formulario no está pendiente de firma SST.</p>
        </div>
      );
    }

    return (
      <div className={styles.signContent}>
        <div className={styles.signInfo}>
          <h3>Firmar como SG-SST</h3>
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
          <p className={styles.warning}>
            ⚠️ Al firmar, el formulario será marcado como{" "}
            <strong>Aprobado</strong> y no podrá ser editado.
          </p>
        </div>

        <div className={styles.signatureSection}>
          <SignaturePad
            onSignatureSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />

          {signatureData && (
            <div className={styles.signaturePreview}>
              <strong>Firma guardada:</strong>
              <img
                src={signatureData}
                alt="Firma del SG-SST"
                className={styles.signatureImage}
              />
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
            disabled={!signatureData || isSigning}
          >
            {isSigning ? "Firmando..." : "Aprobar y Firmar"}
          </button>
        </div>

        {/* Bloque de rechazo */}
        <div className={styles.rejectSection}>
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
              <h4>Rechazar formulario</h4>
              <p>
                Indique el motivo del rechazo. El formulario quedará marcado
                como <strong>Rechazado</strong> y no podrá ser editado por el
                técnico.
              </p>
              <textarea
                className={styles.rejectTextarea}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo..."
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
                  {isRejecting ? "Rechazando..." : "Rechazar formulario"}
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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {getFormTypeLabel(form.formType)} - #{form.id}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "details" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("details")}
          >
            📋 Detalles Completos
          </button>

          {form.status === "PENDING_SST" && canSignAsSST && (
            <button
              className={`${styles.tab} ${
                activeTab === "sign" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("sign")}
            >
              ✍️ Firmar / Rechazar
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
