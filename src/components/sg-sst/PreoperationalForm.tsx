// src/components/sg-sst/PreoperationalForm.tsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  PreoperationalFormData,
  CheckValue,
} from "../../interfaces/SgSstInterface";
import type { Order } from "../../interfaces/OrderInterfaces";
import type { Client } from "../../interfaces/ClientInterfaces";
import { catalog } from "../../api/catalog";
import { sgSstService } from "../../api/sg-sst";
import { getMyAssignedOrdersRequest } from "../../api/orders";
import SignaturePad from "./SignaturePad";
import { useChecklistForm } from "../../hooks/useToolChecklists";
import styles from "../../styles/components/sg-sst/PreoperationalForm.module.css";

interface Tool {
  herramienta_id: number;
  nombre: string;
  marca?: string;
  serial?: string;
  modelo?: string;
  tipo: string;
  estado: string;
  caracteristicasTecnicas?: string;
  observacion?: string;
  valorUnitario?: number;
}

interface PreoperationalFormProps {
  onSubmit: (data: PreoperationalFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
  userName: string;
}

export default function PreoperationalForm({
  onSubmit,
  onCancel,
  userId,
  createdBy,
  userName,
}: PreoperationalFormProps) {
  const navigate = useNavigate();

  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Órdenes del técnico
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Hook de checklist
  const {
    checklistItems,
    initializeChecklist,
    updateItemValue,
    updateItemObservations,
    validateCurrentChecklist,
    getCurrentStats,
    isChecklistComplete,
  } = useChecklistForm();

  const [formData, setFormData] = useState<
    Omit<PreoperationalFormData, "signatureData" | "signerType" | "userName">
  >({
    toolName: "",
    checks: [],
    userId,
    createdBy,
    workOrderId: 0,
  });

  const redirectToReportsList = () => {
    setTimeout(() => {
      navigate("/sg-sst");
    }, 2000);
  };

  // Validar formulario
  const isFormValid = useMemo(() => {
    const hasSelectedOrder = !!selectedOrder;
    const hasSelectedTool = !!selectedTool;
    const checklistValid = checklistItems.length > 0 && isChecklistComplete();
    const hasSignature = !!signatureData;
    const hasAcceptedTerms = privacyAccepted;

    return (
      hasSelectedOrder &&
      hasSelectedTool &&
      checklistValid &&
      hasSignature &&
      hasAcceptedTerms
    );
  }, [
    selectedOrder,
    selectedTool,
    checklistItems,
    isChecklistComplete,
    signatureData,
    privacyAccepted,
  ]);

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!selectedOrder) errors.push("Selección de orden de trabajo");
    if (!selectedTool) errors.push("Selección de herramienta");

    if (checklistItems.length === 0) {
      errors.push("Checklist preoperacional");
    } else {
      const validation = validateCurrentChecklist();
      if (!validation.isValid) {
        if (validation.missingRequired.length > 0) {
          errors.push(
            `Complete los parámetros requeridos (${validation.missingRequired.length} pendientes)`
          );
        }
        if (validation.criticalIssues.length > 0) {
          errors.push(
            `${validation.criticalIssues.length} problema(s) crítico(s) encontrado(s)`
          );
        }
      }
    }

    if (!signatureData) errors.push("Firma del técnico");
    if (!privacyAccepted) errors.push("Aceptación de términos de seguridad");

    return errors;
  };

  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1:
        return !!selectedOrder;
      case 2:
        return !!selectedTool;
      case 3:
        return checklistItems.length > 0 && isChecklistComplete();
      case 4:
        return !!signatureData;
      case 5:
        return privacyAccepted;
      default:
        return true;
    }
  };

  // Cargar herramientas y órdenes
  useEffect(() => {
    loadTools();
    loadOrders();
  }, []);

  const loadTools = async () => {
    try {
      setLoadingTools(true);
      setError("");
      const toolList = await catalog.getAvailableHerramientas();
      setTools(toolList || []);
    } catch (error: any) {
      console.error("Error cargando herramientas:", error);
      setError(error.message || "Error al cargar la lista de herramientas");
      setTools([]);
    } finally {
      setLoadingTools(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const data = await getMyAssignedOrdersRequest();
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error cargando órdenes del técnico:", error);
      setOrdersError(
        error.response?.data?.message ||
          "Error al cargar las órdenes del técnico"
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const id = parseInt(orderId, 10);
    const order = orders.find((o) => o.orden_id === id) || null;
    setSelectedOrder(order);

    if (order?.cliente_empresa) {
      setSelectedClient(order.cliente_empresa as any);
    } else {
      setSelectedClient(null);
    }

    setFormData((prev) => ({
      ...prev,
      workOrderId: order ? order.orden_id : 0,
    }));
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);

    const { items } = initializeChecklist(tool.nombre);

    setFormData((prev) => ({
      ...prev,
      toolName: tool.nombre,
      checks: items.map((item) => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations,
      })),
    }));
  };

  const handleCheckChange = (parameterId: string, value: CheckValue) => {
    updateItemValue(parameterId, value);

    setFormData((prev) => ({
      ...prev,
      checks: checklistItems.map((item) => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations,
      })),
    }));
  };

  const handleObservationsChange = (
    parameterId: string,
    observations: string
  ) => {
    updateItemObservations(parameterId, observations);

    setFormData((prev) => ({
      ...prev,
      checks: checklistItems.map((item) => ({
        parameter: item.parameter,
        value: item.value,
        observations: item.observations,
      })),
    }));
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      const errors = getValidationErrors();
      alert(
        `Por favor complete los siguientes campos antes de enviar:\n\n• ${errors.join(
          "\n• "
        )}`
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // DTO que coincide con CreatePreoperationalWithSignatureDto
      const submitDto = {
        equipmentTool: formData.toolName || undefined,
        checks: formData.checks.map((c) => ({
          parameter: c.parameter,
          value: c.value,
          observations: c.observations,
        })),
        userId: formData.userId,
        createdBy: formData.createdBy,
        workOrderId: formData.workOrderId,
        signatureData,
        signerType: "TECHNICIAN" as const,
        userName,
      };

      console.log("📤 Enviando Checklist Preoperacional:", submitDto);

      const result = await sgSstService.createPreoperationalWithSignature(
        submitDto as any
      );
      console.log("✅ Checklist Preoperacional creado:", result);

      setSuccessMessage(
        "¡Checklist preoperacional guardado exitosamente! Redirigiendo al listado de reportes..."
      );

      // Callback al padre con tu tipo interno
      const callbackData: PreoperationalFormData = {
        ...formData,
        signatureData,
        signerType: "TECHNICIAN",
        userName,
      };

      if (onSubmit) {
        await onSubmit(callbackData);
      }

      redirectToReportsList();
    } catch (error: any) {
      console.error("Error enviando Checklist Preoperacional:", error);

      const errorMessage = error.response?.data?.message || error.message;
      setError(`Error al guardar el checklist: ${errorMessage}`);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "disponible":
        return styles.statusAvailable;
      case "en uso":
        return styles.statusInUse;
      case "en mantenimiento":
        return styles.statusMaintenance;
      case "dañado":
        return styles.statusDamaged;
      case "activo":
        return styles.statusAvailable;
      case "inactivo":
        return styles.statusMaintenance;
      default:
        return styles.statusUnknown;
    }
  };

  const checklistStats = getCurrentStats();
  const validation = validateCurrentChecklist();

  // Helpers para contacto y teléfono
  const getClientContactDisplay = () => {
    const empresaContact = (selectedClient as any)?.contacto as
      | string
      | undefined;

    if (empresaContact && empresaContact.trim() !== "") {
      return empresaContact;
    }

    if (selectedOrder) {
      const { cliente } = selectedOrder;
      return `${cliente.nombre} ${cliente.apellido || ""}`.trim();
    }

    return "N/D";
  };

  const getClientPhoneDisplay = () => {
    if (selectedClient?.telefono) return selectedClient.telefono;
    if (selectedOrder?.cliente.telefono) return selectedOrder.cliente.telefono;
    return "N/D";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Checklist Preoperacional</h1>

        <div
          className={`${styles.validationIndicator} ${
            isFormValid ? styles.valid : styles.invalid
          }`}
        >
          {isFormValid ? "✓ Formulario completo" : "✗ Formulario incompleto"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Mensaje de éxito */}
        {successMessage && (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successText}>
              <strong>¡Éxito!</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* SECCIÓN 1: ORDEN DE TRABAJO / CLIENTE */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(1) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              1. Orden de Trabajo e Información del Cliente
            </h2>
            {getSectionStatus(1) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Orden de trabajo *
                {!selectedOrder && (
                  <span className={styles.requiredIndicator}> (Requerido)</span>
                )}
              </label>
              {ordersLoading ? (
                <p>Cargando órdenes...</p>
              ) : ordersError ? (
                <p className={styles.error}>{ordersError}</p>
              ) : (
                <select
                  className={`${styles.input} ${
                    !selectedOrder ? styles.inputError : ""
                  }`}
                  value={selectedOrder?.orden_id || ""}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  required
                >
                  <option value="">Seleccione una orden...</option>
                  {orders.map((o) => (
                    <option key={o.orden_id} value={o.orden_id}>
                      #{o.orden_id} -{" "}
                      {o.cliente_empresa?.nombre ||
                        `${o.cliente.nombre} ${
                          o.cliente.apellido || ""
                        }`.trim()}{" "}
                      - {o.servicio.nombre_servicio}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cliente seleccionado</label>
              {selectedClient ? (
                <div className={styles.selectedClientCard}>
                  <div className={styles.clientCardHeader}>
                    <h3 className={styles.clientCardTitle}>
                      {selectedClient.nombre}
                    </h3>
                  </div>
                  <div className={styles.clientCardDetails}>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>NIT:</span>
                      <span className={styles.detailValue}>
                        {selectedClient.nit}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Contacto:</span>
                      <span className={styles.detailValue}>
                        {getClientContactDisplay()}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Email:</span>
                      <span className={styles.detailValue}>
                        {selectedClient.email}
                      </span>
                    </div>
                    <div className={styles.clientDetail}>
                      <span className={styles.detailLabel}>Teléfono:</span>
                      <span className={styles.detailValue}>
                        {getClientPhoneDisplay()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={styles.infoText}>
                  Seleccione una orden de trabajo para ver la información del
                  cliente.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: SELECCIÓN DE HERRAMIENTA */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(2) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>2. Selección de Herramienta</h2>
            {getSectionStatus(2) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(2) && (
              <span className={styles.requiredIndicator}>
                {" "}
                (Seleccione una herramienta)
              </span>
            )}
          </div>

          {error && !successMessage && (
            <div className={styles.error}>{error}</div>
          )}

          {loadingTools ? (
            <div className={styles.loading}>Cargando herramientas...</div>
          ) : tools.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay herramientas disponibles en el inventario.</p>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={loadTools}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className={styles.equipmentGrid}>
              {tools.map((tool) => (
                <div
                  key={tool.herramienta_id}
                  className={`${styles.equipmentCard} ${
                    selectedTool?.herramienta_id === tool.herramienta_id
                      ? styles.selected
                      : ""
                  }`}
                  onClick={() => handleToolSelect(tool)}
                >
                  <div className={styles.equipmentHeader}>
                    <h3 className={styles.equipmentName}>{tool.nombre}</h3>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        tool.estado
                      )}`}
                    >
                      {tool.estado}
                    </span>
                  </div>

                  <div className={styles.equipmentDetails}>
                    {tool.marca && (
                      <div className={styles.detail}>
                        <strong>Marca:</strong> {tool.marca}
                      </div>
                    )}
                    {tool.modelo && (
                      <div className={styles.detail}>
                        <strong>Modelo:</strong> {tool.modelo}
                      </div>
                    )}
                    {tool.serial && (
                      <div className={styles.detail}>
                        <strong>Serial:</strong> {tool.serial}
                      </div>
                    )}
                    <div className={styles.detail}>
                      <strong>Tipo:</strong> {tool.tipo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN 3: CHECKLIST PREOPERACIONAL */}
        {selectedTool && checklistItems.length > 0 && (
          <div
            className={`${styles.section} ${
              !getSectionStatus(3) ? styles.sectionIncomplete : ""
            }`}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleContainer}>
                <h2 className={styles.sectionTitle}>
                  3. Checklist Preoperacional - {selectedTool.nombre}
                </h2>
                <div className={styles.statsContainer}>
                  <span className={styles.statsText}>
                    {checklistStats.completed}/{checklistStats.total}{" "}
                    completados
                    {checklistStats.criticalWithIssues > 0 && (
                      <span className={styles.criticalStats}>
                        {" "}
                        • {checklistStats.criticalWithIssues} crítico(s)
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.sectionStatusContainer}>
                {getSectionStatus(3) && (
                  <span className={styles.sectionStatus}>✓</span>
                )}
                {!getSectionStatus(3) && (
                  <span className={styles.requiredIndicator}>Completar</span>
                )}
              </div>
            </div>

            <div className={styles.checklist}>
              {checklistItems.map((check, index) => (
                <div
                  key={check.parameterId}
                  className={`${styles.checkItem} ${
                    check.critical ? styles.checkItemCritical : ""
                  }`}
                >
                  <div className={styles.checkHeader}>
                    <div className={styles.checkQuestion}>
                      <span className={styles.questionNumber}>
                        {index + 1}.
                      </span>
                      <div className={styles.questionContent}>
                        <span className={styles.questionText}>
                          {check.parameter}
                        </span>
                        {check.critical && (
                          <span className={styles.criticalLabel}>
                            ⚠️ CRÍTICO
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.checkControls}>
                    <div className={styles.valueOptions}>
                      {(["GOOD", "BAD"] as CheckValue[]).map((value) => (
                        <label key={value} className={styles.valueOption}>
                          <input
                            type="radio"
                            name={`check-${check.parameterId}`}
                            value={value}
                            checked={check.value === value}
                            onChange={(e) =>
                              handleCheckChange(
                                check.parameterId,
                                e.target.value as CheckValue
                              )
                            }
                            required={check.required}
                          />
                          <span className={styles.valueLabel}>
                            {value === "GOOD" ? "✅ BUENO" : "❌ MALO"}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className={styles.observations}>
                      <textarea
                        placeholder={
                          check.critical && check.value === "BAD"
                            ? "Observaciones obligatorias..."
                            : "Observaciones (opcional)..."
                        }
                        value={check.observations || ""}
                        onChange={(e) =>
                          handleObservationsChange(
                            check.parameterId,
                            e.target.value
                          )
                        }
                        className={styles.observationsInput}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {validation.criticalIssues.length > 0 && (
              <div className={styles.warningBox}>
                <div className={styles.warningHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <strong>
                    Atención: {validation.criticalIssues.length} problema(s)
                    crítico(s) encontrado(s)
                  </strong>
                </div>
                <p>
                  No utilice la herramienta hasta que se resuelvan estos
                  problemas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 4: FIRMA DEL TÉCNICO */}
        {selectedTool && checklistItems.length > 0 && (
          <div
            className={`${styles.section} ${
              !getSectionStatus(4) ? styles.sectionIncomplete : ""
            }`}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>4. Firma del Técnico</h2>
              {getSectionStatus(4) && (
                <span className={styles.sectionStatus}>✓</span>
              )}
              {!getSectionStatus(4) && (
                <span className={styles.requiredIndicator}> (Requerida)</span>
              )}
            </div>
            <p className={styles.sectionSubtitle}>
              {userName}, firme en el área inferior para confirmar la
              verificación de la herramienta
            </p>

            <SignaturePad
              onSignatureSave={handleSignatureSave}
              onClear={handleSignatureClear}
            />

            {signatureData && (
              <div className={styles.signaturePreview}>
                <strong>Firma guardada:</strong>
                <img
                  src={signatureData}
                  alt="Firma del técnico"
                  className={styles.signatureImage}
                />
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 5: TÉRMINOS Y CONDICIONES */}
        <div
          className={`${styles.section} ${
            !getSectionStatus(5) ? styles.sectionIncomplete : ""
          }`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Términos y Condiciones</h2>
            {getSectionStatus(5) && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(5) && (
              <span className={styles.requiredIndicator}> (Requerida)</span>
            )}
          </div>
          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>
                He verificado el estado de la herramienta según el checklist.
              </li>
              <li>Los resultados de la inspección son veraces y completos.</li>
              <li>
                Reportaré cualquier anomalía encontrada al supervisor inmediato.
              </li>
              <li>
                No utilizaré herramientas en mal estado o con deficiencias
                identificadas.
              </li>
              <li>
                Acepto seguir los procedimientos establecidos para uso de
                herramientas.
              </li>
            </ul>
          </div>
          <label className={styles.privacyCheckbox}>
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              required
            />
            <span className={styles.checkboxLabel}>
              Confirmo que he realizado la verificación preoperacional y acepto
              los términos establecidos. *
            </span>
          </label>
        </div>

        {/* Botones de acción */}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${
              !isFormValid ? styles.submitButtonDisabled : ""
            }`}
            disabled={isSubmitting || !isFormValid || !!successMessage}
          >
            {isSubmitting
              ? "Guardando..."
              : successMessage
              ? "✅ Guardado"
              : isFormValid
              ? "✅ Guardar Checklist"
              : "Completar formulario primero"}
          </button>
        </div>

        {!isFormValid && !successMessage && (
          <div className={styles.validationMessage}>
            <strong>⚠️ Complete los siguientes campos:</strong>
            <ul>
              {getValidationErrors().map((error, index) => (
                <li key={index}> {error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
