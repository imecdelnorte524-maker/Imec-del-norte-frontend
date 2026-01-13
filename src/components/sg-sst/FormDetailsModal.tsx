import { useState, useEffect } from "react";
import type { SgSstForm, SignatureType } from "../../interfaces/SgSstInterface";
import type { Usuario } from "../../interfaces/UserInterfaces";
import { sgSstService } from "../../api/sg-sst";
import { usersApi } from "../../api/users";
import SignaturePad from "./SignaturePad";
import styles from "../../styles/components/sg-sst/FormDetailsModal.module.css";

interface FormDetailsModalProps {
  isOpen: boolean;
  form: SgSstForm;
  onClose: () => void;
  onFormSigned: () => void;
  canSignAsSST: boolean;
  currentUser?: Usuario | null;
  // NUEVO: descarga PDF
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
  const [activeTab, setActiveTab] = useState<"details" | "sign" | "authorize">(
    "details"
  );

  // Estados para autorización de Trabajo en Alturas
  const [authorizationData, setAuthorizationData] = useState({
    physicalCondition: false,
    instructionsReceived: false,
    fitForHeightWork: false,
    authorizerName: "",
    authorizerIdentification: "",
    authorizationDate: "",
    authorizationTime: "",
  });

  // Estados para autocompletado del autorizador
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [suggestions, setSuggestions] = useState<Usuario[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    // Inicializar datos de autorización si existe
    if (form.formType === "HEIGHT_WORK" && form.heightWork) {
      setAuthorizationData((prev) => ({
        ...prev,
        physicalCondition: form.heightWork?.physicalCondition || false,
        instructionsReceived: form.heightWork?.instructionsReceived || false,
        fitForHeightWork: form.heightWork?.fitForHeightWork || false,
        authorizerName: form.heightWork?.authorizerName || "",
        authorizerIdentification:
          form.heightWork?.authorizerIdentification || "",
        authorizationDate: new Date().toISOString().split("T")[0],
        authorizationTime: new Date().toTimeString().slice(0, 5),
      }));
    }

    // Cargar usuarios para autocompletado
    loadUsers();
  }, [form]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usuariosData = await usersApi.getAllUsers();
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  if (!isOpen) return null;

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  // Manejar cambios en el nombre del autorizador con autocompletado
  const handleAuthorizerNameChange = (value: string) => {
    setAuthorizationData((prev) => ({
      ...prev,
      authorizerName: value,
      authorizerIdentification: "",
    }));

    if (value.length > 1) {
      const filtered = usuarios.filter((usuario) =>
        `${usuario.nombre} ${usuario.apellido}`
          .toLowerCase()
          .includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Seleccionar usuario del autocompletado
  const handleSelectAuthorizer = (usuario: Usuario) => {
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    setAuthorizationData((prev) => ({
      ...prev,
      authorizerName: nombreCompleto,
      authorizerIdentification: usuario.cedula || "",
    }));
    setShowSuggestions(false);
  };

  // Manejar cambios en los campos de autorización
  const handleAuthorizationChange = (field: string, value: any) => {
    setAuthorizationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validar datos de autorización
  const isAuthorizationValid = () => {
    return (
      authorizationData.physicalCondition &&
      authorizationData.instructionsReceived &&
      authorizationData.fitForHeightWork &&
      authorizationData.authorizerName.trim() !== "" &&
      authorizationData.authorizerIdentification.trim() !== "" &&
      signatureData !== ""
    );
  };

  // Función para firmar formularios normales (no trabajo en alturas)
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
        signerType: "SST" as SignatureType,
        userId: currentUser.usuarioId,
        userName: `${currentUser.nombre} ${currentUser.apellido}`,
      };

      const response = await sgSstService.signForm(form.id, signData);

      if (response.success) {
        alert("Formulario firmado exitosamente");
        onFormSigned();
      }
    } catch (error: any) {
      console.error("Error firmando formulario:", error);
      alert(
        `Error al firmar: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSigning(false);
    }
  };

  // Función para autorizar Trabajo en Alturas
  const handleAuthorizeHeightWork = async () => {
    if (!isAuthorizationValid()) {
      alert(
        "Por favor complete todos los campos de autorización y firme el formulario"
      );
      return;
    }

    if (!currentUser || !signatureData) {
      alert("Error: Debe estar autenticado y firmar el formulario");
      return;
    }

    setIsSigning(true);

    try {
      const authorizationPayload = {
        physicalCondition: authorizationData.physicalCondition,
        instructionsReceived: authorizationData.instructionsReceived,
        fitForHeightWork: authorizationData.fitForHeightWork,
        authorizerName: authorizationData.authorizerName,
        authorizerIdentification: authorizationData.authorizerIdentification,
        signatureData: signatureData,
        signerType: "SST" as SignatureType,
        userId: currentUser.usuarioId,
        userName: `${currentUser.nombre} ${currentUser.apellido}`,
      };

      const response = await sgSstService.authorizeHeightWork(
        form.id,
        authorizationPayload
      );

      if (response.success) {
        alert("Trabajo en Alturas autorizado exitosamente");
        onFormSigned();
      }
    } catch (error: any) {
      console.error("Error autorizando trabajo en alturas:", error);
      console.error("Detalles del error:", error.response?.data);
      alert(
        `Error al autorizar: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSigning(false);
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
    const badChecks = checks.filter((check) => check.value === "BAD").length;
    const totalChecks = checks.length;
    const percentageGood =
      totalChecks > 0 ? Math.round((goodChecks / totalChecks) * 100) : 0;

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
              <div className={`${styles.statItem} ${styles.badStat}`}>
                <span className={styles.statNumber}>{badChecks}</span>
                <span className={styles.statLabel}>Incorrectos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{totalChecks}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={`${styles.statItem} ${styles.percentageStat}`}>
                <span className={styles.statNumber}>{percentageGood}%</span>
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
                    {check.value === "GOOD" ? "✅ BUENO" : "❌ MALO"}
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

  const renderAuthorizationTab = () => {
    if (!canSignAsSST) {
      return (
        <div className={styles.unauthorized}>
          <p>No tienes permisos para autorizar trabajos en alturas.</p>
        </div>
      );
    }

    if (form.status === "COMPLETED") {
      return (
        <div className={styles.alreadySigned}>
          <p>✅ Este trabajo en alturas ya ha sido autorizado.</p>
          <div className={styles.authorizationDetails}>
            <h4>Detalles de la autorización:</h4>
            <p>
              <strong>Autorizador:</strong> {form.heightWork?.authorizerName}
            </p>
            <p>
              <strong>Fecha de autorización:</strong>{" "}
              {formatDate(form.sstSignatureDate)}
            </p>
          </div>
        </div>
      );
    }

    if (form.status !== "PENDING_SST") {
      return (
        <div className={styles.unauthorized}>
          <p>Este formulario no está pendiente de autorización.</p>
        </div>
      );
    }

    return (
      <div className={styles.authorizationContent}>
        <div className={styles.authorizationInfo}>
          <h3>🚧 Autorización de Trabajo en Alturas</h3>
          <p>
            Estás autorizando el trabajo en alturas del trabajador{" "}
            <strong>{form.heightWork?.workerName}</strong>.
          </p>
          <p className={styles.warning}>
            ⚠️ Al autorizar, confirmas que el trabajador cumple con todos los
            requisitos de seguridad.
          </p>
        </div>

        {/* Verificaciones de seguridad */}
        <div className={styles.verificationsSection}>
          <h4>✅ Verificaciones de Seguridad</h4>

          <div className={styles.verificationsList}>
            <label className={styles.verificationCheckbox}>
              <input
                type="checkbox"
                checked={authorizationData.physicalCondition}
                onChange={(e) =>
                  handleAuthorizationChange(
                    "physicalCondition",
                    e.target.checked
                  )
                }
                required
              />
              <span className={styles.verificationLabel}>
                El trabajador posee condiciones físicas adecuadas para trabajar
                en alturas
              </span>
            </label>

            <label className={styles.verificationCheckbox}>
              <input
                type="checkbox"
                checked={authorizationData.instructionsReceived}
                onChange={(e) =>
                  handleAuthorizationChange(
                    "instructionsReceived",
                    e.target.checked
                  )
                }
                required
              />
              <span className={styles.verificationLabel}>
                El trabajador recibió instrucciones completas para trabajar en
                alturas
              </span>
            </label>

            <label className={styles.verificationCheckbox}>
              <input
                type="checkbox"
                checked={authorizationData.fitForHeightWork}
                onChange={(e) =>
                  handleAuthorizationChange(
                    "fitForHeightWork",
                    e.target.checked
                  )
                }
                required
              />
              <span className={styles.verificationLabel}>
                El trabajador está declarado apto para trabajo seguro en alturas
              </span>
            </label>
          </div>

          {/* Datos del autorizador */}
          <div className={styles.authorizerSection}>
            <h4>👤 Datos del Autorizador</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Nombre Completo *
                  {!authorizationData.authorizerName && (
                    <span className={styles.requiredIndicator}>
                      {" "}
                      (Requerido)
                    </span>
                  )}
                </label>
                <div className={styles.autocompleteContainer}>
                  <input
                    type="text"
                    className={styles.input}
                    value={authorizationData.authorizerName}
                    onChange={(e) => handleAuthorizerNameChange(e.target.value)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    onFocus={() => {
                      if (authorizationData.authorizerName.length > 1) {
                        setShowSuggestions(true);
                      }
                    }}
                    required
                    placeholder="Escriba para buscar autorizador..."
                  />
                  {isLoadingUsers && (
                    <div className={styles.loadingIndicator}>Cargando...</div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestionsList}>
                      {suggestions.map((usuario) => (
                        <div
                          key={usuario.usuarioId}
                          className={styles.suggestionItem}
                          onClick={() => handleSelectAuthorizer(usuario)}
                        >
                          <div className={styles.suggestionName}>
                            {usuario.nombre} {usuario.apellido}
                          </div>
                          <div className={styles.suggestionDetails}>
                            <span className={styles.suggestionDetail}>
                              Cédula: {usuario.cedula || "No registrada"}
                            </span>
                            {usuario.role?.nombreRol && (
                              <span className={styles.suggestionDetail}>
                                Cargo: {usuario.role.nombreRol}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Identificación *
                  {!authorizationData.authorizerIdentification && (
                    <span className={styles.requiredIndicator}>
                      {" "}
                      (Requerido)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={authorizationData.authorizerIdentification}
                  onChange={(e) =>
                    handleAuthorizationChange(
                      "authorizerIdentification",
                      e.target.value
                    )
                  }
                  required
                  placeholder="Se completa automáticamente"
                  readOnly={!!authorizationData.authorizerName}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha de Autorización</label>
                <input
                  type="date"
                  className={styles.input}
                  value={authorizationData.authorizationDate}
                  onChange={(e) =>
                    handleAuthorizationChange(
                      "authorizationDate",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Hora de Autorización</label>
                <input
                  type="time"
                  className={styles.input}
                  value={authorizationData.authorizationTime}
                  onChange={(e) =>
                    handleAuthorizationChange(
                      "authorizationTime",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Firma del autorizador SST */}
        <div className={styles.signatureSection}>
          <h4>✍️ Firma del Autorizador SST</h4>
          <SignaturePad
            onSignatureSave={handleSignatureSave}
            onClear={handleSignatureClear}
          />

          {signatureData && (
            <div className={styles.signaturePreview}>
              <strong>Firma guardada:</strong>
              <img
                src={signatureData}
                alt="Firma del autorizador SST"
                className={styles.signatureImage}
              />
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className={styles.authorizationActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setActiveTab("details")}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.authorizeButton}
            onClick={handleAuthorizeHeightWork}
            disabled={!isAuthorizationValid() || isSigning}
          >
            {isSigning ? "Autorizando..." : "✅ Autorizar Trabajo en Alturas"}
          </button>
        </div>
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
      </div>
    );
  };

  const renderSignTab = () => {
    if (form.formType === "HEIGHT_WORK") {
      return renderAuthorizationTab();
    }
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

          {form.status === "PENDING_SST" &&
            canSignAsSST &&
            (form.formType === "HEIGHT_WORK" ? (
              <button
                className={`${styles.tab} ${
                  activeTab === "authorize" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("authorize")}
              >
                🚧 Autorizar Trabajo en Alturas
              </button>
            ) : (
              <button
                className={`${styles.tab} ${
                  activeTab === "sign" ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab("sign")}
              >
                ✍️ Firmar como SST
              </button>
            ))}
        </div>

        <div className={styles.content}>
          {activeTab === "details" ? renderFormDetails() : renderSignTab()}
        </div>
      </div>
    </div>
  );
}
