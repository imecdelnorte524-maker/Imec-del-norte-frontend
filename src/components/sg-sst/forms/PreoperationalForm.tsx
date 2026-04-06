import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  PreoperationalFormData,
  CheckValue,
  SignFormData,
  TermsAcceptancePayload,
} from "../../../interfaces/SgSstInterface";
import type { Order } from "../../../interfaces/OrderInterfaces";
import type { Client } from "../../../interfaces/ClientInterfaces";
import { toolsApi } from "../../../api/tools";
import { sgSstService } from "../../../api/sg-sst";
import { getMyAssignedOrdersRequest } from "../../../api/orders";
import SignaturePad from "../SignaturePad";
import { useChecklistForm } from "../../../hooks/useToolChecklists";
import styles from "../../../styles/components/sg-sst/forms/PreoperationalForm.module.css";
import { playErrorSound } from "../../../utils/sounds";
import {
  type OrderToolDetail,
  type Tool as ApiTool,
  ToolType,
  ToolStatus,
} from "../../../interfaces/ToolsInterfaces";
import { useModal } from "../../../context/ModalContext";
import TermsModal from "../TermsModal";

interface OrderWithTools extends Omit<Order, "toolDetails"> {
  toolDetails?: OrderToolDetail[];
}

type ToolWithDetail = ApiTool & {
  herramientaId: number;
  detalleHerramientaId?: number;
};

interface PreoperationalFormProps {
  onSubmit: (data: PreoperationalFormData) => void;
  onCancel: () => void;
  userId: number;
  createdBy: number;
  userName: string;
}

const CHECK_VALUES: CheckValue[] = ["GOOD", "REGULAR", "BAD"];

export default function PreoperationalForm({
  onSubmit,
  onCancel,
  userId,
  createdBy,
  userName,
}: PreoperationalFormProps) {
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [allTools, setAllTools] = useState<ToolWithDetail[]>([]);
  const [toolsForSelectedOrder, setToolsForSelectedOrder] = useState<
    ToolWithDetail[]
  >([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolWithDetail | null>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [orders, setOrders] = useState<OrderWithTools[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTools | null>(
    null,
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAcceptedVersion, setTermsAcceptedVersion] = useState<number | null>(
    null,
  );

  const {
    checklistItems,
    initializeChecklist,
    updateItemValue,
    updateItemObservations,
    validateCurrentChecklist,
    getCurrentStats,
    isChecklistComplete,
    loadingChecklist,
    checklistError,
  } = useChecklistForm();

  // Estado interno
  const [formData, setFormData] = useState<{
    templateId?: number;
    toolName?: string;
    userId: number;
    createdBy: number;
    workOrderId: number;
  }>({
    templateId: undefined,
    toolName: "",
    userId,
    createdBy,
    workOrderId: 0,
  });

  const [createdFormId, setCreatedFormId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");

  const redirectToReportsList = () => {
    setTimeout(() => {
      navigate("/sg-sst");
    }, 2000);
  };

  const isFormValid = useMemo(() => {
    const hasSelectedOrder = !!selectedOrder;
    const hasSelectedTool = !!selectedTool;
    const hasTemplate = !!formData.templateId;
    const checklistValid = checklistItems.length > 0 && isChecklistComplete();
    const hasSignature = !!signatureData;
    const hasAcceptedTerms = !!termsAcceptedVersion;

    return (
      hasSelectedOrder &&
      hasSelectedTool &&
      hasTemplate &&
      checklistValid &&
      hasSignature &&
      hasAcceptedTerms
    );
  }, [
    selectedOrder,
    selectedTool,
    formData.templateId,
    checklistItems,
    isChecklistComplete,
    signatureData,
    termsAcceptedVersion,
  ]);

  const getValidationErrors = () => {
    const errors: string[] = [];

    if (!selectedOrder) errors.push("Selección de orden de trabajo");
    if (!selectedTool) errors.push("Selección de herramienta");
    if (!formData.templateId) errors.push("Plantilla preoperacional");

    if (checklistItems.length === 0) {
      errors.push("Checklist preoperacional");
    } else {
      const validation = validateCurrentChecklist();
      if (!validation.isValid && validation.missingRequired.length > 0) {
        errors.push(
          `Complete los parámetros requeridos (${validation.missingRequired.length} pendientes)`,
        );
      }
    }

    if (!signatureData) errors.push("Firma del técnico");
    if (!termsAcceptedVersion) errors.push("Aceptación de términos");

    return errors;
  };

  const getSectionStatus = (sectionNumber: number) => {
    switch (sectionNumber) {
      case 1:
        return !!selectedOrder;
      case 2:
        return !!selectedTool && toolsForSelectedOrder.length > 0;
      case 3:
        return !!formData.templateId && checklistItems.length > 0 && isChecklistComplete();
      case 4:
        return !!signatureData;
      case 5:
        return !!termsAcceptedVersion;
      default:
        return true;
    }
  };

  useEffect(() => {
    loadAllTools();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllTools = async () => {
    try {
      setLoadingTools(true);
      setError("");
      const toolList = await toolsApi.getAvailableHerramientas();
      setAllTools((toolList || []) as ToolWithDetail[]);
    } catch (error: any) {
      console.error("Error cargando herramientas:", error);
      setError(error.message || "Error al cargar la lista de herramientas");
      playErrorSound();
      showModal({
        type: "error",
        title: "Error",
        message: error.message || "Error al cargar la lista de herramientas",
      });
      setAllTools([]);
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
        "Error al cargar las órdenes del técnico",
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const createSyntheticToolFromDetail = (
    toolDetail: OrderToolDetail,
    index: number,
  ): ToolWithDetail => {
    const now = new Date().toISOString();
    return {
      herramientaId:
        (toolDetail as any).herramientaId ||
        toolDetail.detalleHerramientaId ||
        index + 1000,
      nombre: toolDetail.nombreHerramienta,
      marca: toolDetail.marca || "",
      serial: toolDetail.serial || "",
      modelo: toolDetail.modelo || "",
      caracteristicasTecnicas: "",
      observacion: "",
      fechaRegistro: now,
      fechaEliminacion: undefined,
      tipo: ToolType.HERRAMIENTA,
      estado: ToolStatus.DISPONIBLE,
      motivoEliminacion: undefined,
      observacionEliminacion: undefined,
      valorUnitario: 0,
      cantidadActual: 1,
      inventarioId: undefined,
      bodega: undefined,
      imagenes: [],
      detalleHerramientaId: toolDetail.detalleHerramientaId,
    };
  };

  const convertToolDetailsToTools = (
    toolDetails: OrderToolDetail[],
  ): ToolWithDetail[] => {
    return toolDetails.map((toolDetail, index) =>
      createSyntheticToolFromDetail(toolDetail, index),
    );
  };

  const findMatchingInventoryTools = (
    toolDetails: OrderToolDetail[],
  ): ToolWithDetail[] => {
    if (!allTools || allTools.length === 0) {
      return convertToolDetailsToTools(toolDetails);
    }

    const matchedTools: ToolWithDetail[] = [];

    toolDetails.forEach((toolDetail, index) => {
      const matchingTool = allTools.find(
        (inventoryTool) =>
          inventoryTool.nombre.toLowerCase() ===
          toolDetail.nombreHerramienta.toLowerCase(),
      );

      if (matchingTool) {
        matchedTools.push({
          ...matchingTool,
          detalleHerramientaId: toolDetail.detalleHerramientaId,
        });
      } else {
        matchedTools.push(createSyntheticToolFromDetail(toolDetail, index));
      }
    });

    return matchedTools;
  };

  const handleSelectOrder = async (orderId: string) => {
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
      templateId: undefined,
      toolName: "",
    }));

    setSelectedTool(null);
    setToolsForSelectedOrder([]);

    if (order && order.toolDetails && order.toolDetails.length > 0) {
      try {
        setLoadingTools(true);
        const orderTools = findMatchingInventoryTools(order.toolDetails);
        setToolsForSelectedOrder(orderTools);
        setError("");
      } catch (error) {
        console.error("Error procesando herramientas de la orden:", error);
        setError("Error al procesar las herramientas de esta orden");
      } finally {
        setLoadingTools(false);
      }
    } else {
      setToolsForSelectedOrder([]);
      setError("Esta orden no tiene herramientas asignadas.");
    }
  };

  const handleToolSelect = async (tool: ToolWithDetail) => {
    try {
      setSelectedTool(tool);

      const { meta } = await initializeChecklist(tool.nombre.toUpperCase());

      setFormData((prev) => ({
        ...prev,
        templateId: meta?.id,
        toolName: tool.nombre,
      }));

      if (!meta?.id) {
        throw new Error("No se pudo obtener el templateId de la plantilla");
      }
    } catch (error) {
      console.error("Error al cargar checklist:", error);
      setFormData((prev) => ({
        ...prev,
        templateId: undefined,
      }));
    }
  };

  const handleCheckChange = (parameterId: number, value: CheckValue) => {
    updateItemValue(parameterId, value);
  };

  const handleObservationsChange = (
    parameterId: number,
    observations: string,
  ) => {
    updateItemObservations(parameterId, observations);
  };

  const handleSignatureSave = (signature: string) => {
    setSignatureData(signature);
  };

  const handleSignatureClear = () => {
    setSignatureData("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createdFormId) {
      if (!isFormValid) {
        const errors = getValidationErrors();
        showModal({
          type: "warning",
          title: "Formulario incompleto",
          message: (
            <>
              <p>Por favor complete los siguientes campos antes de enviar:</p>
              <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </>
          ),
        });
        return;
      }

      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      try {
        const termsAcceptances: TermsAcceptancePayload[] = [
          {
            termsType: "dataprivacy",
            termsVersion: termsAcceptedVersion!,
          },
          {
            termsType: "PREOPERATIONAL",
            termsVersion: termsAcceptedVersion!,
          },
        ];

        const submitDto: PreoperationalFormData = {
          templateId: formData.templateId!,
          equipmentTool: formData.toolName || undefined,
          checks: checklistItems.map((item) => ({
            parameterId: item.parameterId,
            value: item.value,
            observations: item.observations,
          })),
          termsAcceptances,
          userId: formData.userId,
          createdBy: formData.createdBy,
          workOrderId: formData.workOrderId,
        };

        const resp = await sgSstService.createPreoperational(submitDto);
        const newFormId = resp?.data?.form?.id;

        if (!newFormId) {
          throw new Error(
            "No se pudo obtener el ID del formulario preoperacional creado",
          );
        }

        await sgSstService.requestSignOtp(newFormId, "TECHNICIAN");

        setCreatedFormId(newFormId);
        setSuccessMessage(
          "Checklist guardado. Se envió un código OTP a tu correo para firmar el formulario.",
        );
        showModal({
          type: "success",
          title: "Guardado",
          message:
            "Revisa tu correo, ingresa el código OTP y haz clic en Firmar.",
        });
      } catch (error: any) {
        console.error("Error creando checklist preoperacional:", error);
        const errorMessage = error.response?.data?.message || error.message;
        setError(`Error al guardar el checklist: ${errorMessage}`);
        playErrorSound();
        showModal({
          type: "error",
          title: "Error al guardar",
          message: errorMessage,
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!otpCode.trim()) {
      showModal({
        type: "warning",
        title: "Código Requerido",
        message: "Por favor ingresa el código OTP enviado a tu correo.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const signPayload: SignFormData = {
        signerType: "TECHNICIAN",
        signatureData,
        otpCode: otpCode.trim(),
      };

      await sgSstService.signForm(createdFormId, signPayload);

      showModal({
        type: "success",
        title: "¡Éxito!",
        message: "¡Checklist preoperacional firmado exitosamente con OTP!",
      });

      const callbackData: PreoperationalFormData = {
        templateId: formData.templateId!,
        equipmentTool: formData.toolName,
        checks: checklistItems.map((item) => ({
          parameterId: item.parameterId,
          value: item.value,
          observations: item.observations,
        })),
        termsAcceptances: [
          {
            termsType: "dataprivacy",
            termsVersion: termsAcceptedVersion!,
          },
          {
            termsType: "PREOPERATIONAL",
            termsVersion: termsAcceptedVersion!,
          },
        ],
        userId: formData.userId,
        createdBy: formData.createdBy,
        workOrderId: formData.workOrderId,
      };

      await onSubmit(callbackData);
      redirectToReportsList();
    } catch (error: any) {
      console.error("Error firmando Checklist Preoperacional:", error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Error al firmar el checklist: ${errorMessage}`);
      playErrorSound();
      showModal({
        type: "error",
        title: "Error al firmar",
        message: errorMessage,
      });
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

  const getClientContactDisplay = () => {
    const empresaContact = (selectedClient as any)?.contacto as
      | string
      | undefined;

    if (empresaContact && empresaContact.trim() !== "") {
      return empresaContact;
    }

    const personaClient = selectedOrder?.cliente;
    if (personaClient) {
      return `${personaClient.nombre} ${personaClient.apellido ?? ""}`.trim();
    }

    return "N/D";
  };

  const getClientPhoneDisplay = () => {
    if (selectedClient?.telefono) return selectedClient.telefono;
    if (selectedOrder?.cliente?.telefono) return selectedOrder.cliente.telefono;
    return "N/D";
  };

  const validOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.estado === "Cancelada" || order.estado === "Completado") {
        return false;
      }
      return order.toolDetails && order.toolDetails.length > 0;
    });
  }, [orders]);

  const getValueLabel = (value: CheckValue): string => {
    switch (value) {
      case "GOOD":
        return "✅ BUENO";
      case "REGULAR":
        return "⚠️ REGULAR";
      case "BAD":
        return "❌ MALO";
      default:
        return value;
    }
  };

  const isOtpStep = createdFormId !== null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onCancel}>
          ← Volver
        </button>
        <h1 className={styles.title}>Checklist Preoperacional</h1>

        <div
          className={`${styles.validationIndicator} ${isFormValid ? styles.valid : styles.invalid
            }`}
        >
          {isOtpStep
            ? "Código OTP pendiente de ingreso"
            : isFormValid
              ? "✓ Formulario completo"
              : "✗ Formulario incompleto"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {successMessage && (
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successText}>
              <strong>¡Paso 1 completado!</strong>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* 1. ORDEN / CLIENTE */}
        <div className={`${styles.section} ${!getSectionStatus(1) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              1. Orden de Trabajo e Información del Cliente
            </h2>
            {getSectionStatus(1) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Orden de trabajo *</label>
              {ordersLoading ? (
                <p>Cargando órdenes...</p>
              ) : ordersError ? (
                <p className={styles.error}>{ordersError}</p>
              ) : validOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No hay órdenes con herramientas asignadas disponibles.</p>
                </div>
              ) : (
                <select
                  className={`${styles.input} ${!selectedOrder ? styles.inputError : ""}`}
                  value={selectedOrder?.orden_id || ""}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  required
                >
                  <option value="">Seleccione una orden con herramientas...</option>
                  {validOrders.map((order, index) => {
                    const personaClient = order.cliente;
                    const clientName =
                      order.cliente_empresa?.nombre ||
                      (personaClient
                        ? `${personaClient.nombre} ${personaClient.apellido ?? ""}`.trim()
                        : "N/D");

                    return (
                      <option
                        key={
                          order.orden_id
                            ? `order-${order.orden_id}`
                            : `order-index-${index}`
                        }
                        value={order.orden_id || ""}
                      >
                        #{order.orden_id || "N/A"} - {clientName} -{" "}
                        {order.servicio?.nombre_servicio ||
                          "Servicio no disponible"}
                      </option>
                    );
                  })}
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
                    {selectedOrder?.toolDetails && (
                      <span className={styles.statsText}>
                        {selectedOrder.toolDetails.length} herramienta(s)
                        asignada(s)
                      </span>
                    )}
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
                  Seleccione una orden de trabajo para ver la información del cliente.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. HERRAMIENTA */}
        <div className={`${styles.section} ${!getSectionStatus(2) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              2. Selección de Herramienta
              {selectedOrder && ` - Orden #${selectedOrder.orden_id}`}
            </h2>
            {getSectionStatus(2) && toolsForSelectedOrder.length > 0 && (
              <span className={styles.sectionStatus}>✓</span>
            )}
          </div>

          {!selectedOrder ? (
            <div className={styles.infoText}>
              <p>Primero seleccione una orden de trabajo con herramientas asignadas.</p>
            </div>
          ) : error && !successMessage ? (
            <div className={styles.error}>{error}</div>
          ) : loadingTools ? (
            <div className={styles.loading}>
              Cargando herramientas para la orden #{selectedOrder.orden_id}...
            </div>
          ) : toolsForSelectedOrder.length === 0 ? (
            <div className={styles.emptyState}>
              <p>⚠️ No hay herramientas asignadas a esta orden.</p>
            </div>
          ) : (
            <>
              <div className={styles.infoText}>
                <p>
                  <strong>Orden #{selectedOrder.orden_id}:</strong>{" "}
                  {toolsForSelectedOrder.length} herramienta(s) disponible(s)
                </p>
              </div>
              <div className={styles.equipmentGrid}>
                {toolsForSelectedOrder.map((tool, index) => (
                  <div
                    key={
                      tool.detalleHerramientaId
                        ? `tool-detail-${tool.detalleHerramientaId}`
                        : `tool-index-${index}`
                    }
                    className={`${styles.equipmentCard} ${selectedTool?.herramientaId === tool.herramientaId
                      ? styles.selected
                      : ""
                      }`}
                    onClick={() => handleToolSelect(tool)}
                  >
                    <div className={styles.equipmentHeader}>
                      <h3 className={styles.equipmentName}>{tool.nombre}</h3>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(tool.estado)}`}
                      >
                        {tool.estado}
                      </span>
                    </div>

                    <div className={styles.equipmentDetails}>
                      {tool.marca && tool.marca !== "Sin marca" && (
                        <div className={styles.detail}>
                          <strong>Marca:</strong> {tool.marca}
                        </div>
                      )}
                      {tool.modelo && tool.modelo !== "N/A" && (
                        <div className={styles.detail}>
                          <strong>Modelo:</strong> {tool.modelo}
                        </div>
                      )}
                      {tool.serial && tool.serial !== "N/A" && (
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
            </>
          )}
        </div>

        {/* 3. CHECKLIST */}
        {selectedTool && (
          <div className={`${styles.section} ${!getSectionStatus(3) ? styles.sectionIncomplete : ""}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleContainer}>
                <h2 className={styles.sectionTitle}>
                  3. Checklist Preoperacional - {selectedTool.nombre}
                  {selectedOrder && ` (Orden #${selectedOrder.orden_id})`}
                </h2>
                <div className={styles.statsContainer}>
                  {loadingChecklist ? (
                    <span className={styles.statsText}>Cargando checklist...</span>
                  ) : checklistItems.length > 0 ? (
                    <span className={styles.statsText}>
                      {checklistStats.completed}/{checklistStats.total} completados
                      {checklistStats.criticalWithIssues > 0 && (
                        <span className={styles.criticalStats}>
                          {" "}
                          • {checklistStats.criticalWithIssues} crítico(s)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className={styles.statsText}>
                      No hay parámetros configurados para esta herramienta
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.sectionStatusContainer}>
                {getSectionStatus(3) && checklistItems.length > 0 && (
                  <span className={styles.sectionStatus}>✓</span>
                )}
              </div>
            </div>

            {checklistError && <div className={styles.error}>{checklistError}</div>}

            {checklistItems.length > 0 && (
              <>
                <div className={styles.checklist}>
                  {checklistItems.map((check, index) => (
                    <div
                      key={`check-${check.parameterId}-${index}`}
                      className={`${styles.checkItem} ${check.critical ? styles.checkItemCritical : ""
                        }`}
                    >
                      <div className={styles.checkHeader}>
                        <div className={styles.checkQuestion}>
                          <span className={styles.questionNumber}>{index + 1}.</span>
                          <div className={styles.questionContent}>
                            <span className={styles.questionText}>{check.parameter}</span>
                            {check.critical && (
                              <span className={styles.criticalLabel}>⚠️ CRÍTICO</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.checkControls}>
                        <div className={styles.valueOptions}>
                          {CHECK_VALUES.map((value, valueIndex) => (
                            <label
                              key={`${check.parameterId}-value-${valueIndex}`}
                              className={styles.valueOption}
                            >
                              <input
                                type="radio"
                                name={`check-${check.parameterId}`}
                                value={value}
                                checked={check.value === value}
                                onChange={(e) =>
                                  handleCheckChange(
                                    check.parameterId,
                                    e.target.value as CheckValue,
                                  )
                                }
                                required={check.required}
                              />
                              <span className={styles.valueLabel}>
                                {getValueLabel(value)}
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
                                e.target.value,
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
                        Atención: {validation.criticalIssues.length} problema(s) crítico(s)
                      </strong>
                    </div>
                    <p>No utilice la herramienta hasta que se resuelvan estos problemas.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 4. FIRMA */}
        {selectedTool && checklistItems.length > 0 && (
          <div className={`${styles.section} ${!getSectionStatus(4) ? styles.sectionIncomplete : ""}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>4. Firma del Técnico</h2>
              {getSectionStatus(4) && <span className={styles.sectionStatus}>✓</span>}
            </div>

            <p className={styles.sectionSubtitle}>
              {userName}, firme en el área inferior para confirmar la verificación
              de la herramienta <strong>{selectedTool.nombre}</strong>
              {selectedOrder && ` para la Orden #${selectedOrder.orden_id}`}
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

            {isOtpStep && (
              <div className={styles.otpSection} style={{ marginTop: "20px" }}>
                <label className={styles.label}>Código OTP enviado a tu correo *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  placeholder="Ingresa los 6 dígitos"
                />
              </div>
            )}
          </div>
        )}

        {/* 5. TÉRMINOS */}
        <div className={`${styles.section} ${!getSectionStatus(5) ? styles.sectionIncomplete : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Términos y Condiciones</h2>
            {getSectionStatus(5) && <span className={styles.sectionStatus}>✓</span>}
          </div>

          <div className={styles.termsBox}>
            <p>Declaro que:</p>
            <ul className={styles.termsList}>
              <li>
                He verificado el estado de la herramienta{" "}
                <strong>{selectedTool?.nombre || "[NOMBRE HERRAMIENTA]"}</strong>{" "}
                según el{" "}
                <button
                  type="button"
                  className={styles.termsLink}
                  onClick={() => setShowTermsModal(true)}
                >
                  checklist preoperacional
                </button>.
              </li>
              <li>Los resultados de la inspección son veraces y completos.</li>
              <li>Reportaré cualquier anomalía encontrada al supervisor inmediato.</li>
              <li>No utilizaré herramientas en mal estado o con deficiencias identificadas.</li>
              <li>Acepto seguir los procedimientos establecidos para uso de herramientas.</li>
              {selectedOrder && (
                <li>Esta verificación corresponde a la Orden de Trabajo #{selectedOrder.orden_id}.</li>
              )}
            </ul>
          </div>

          <label className={styles.privacyCheckbox}>
            <input
              type="checkbox"
              checked={!!termsAcceptedVersion}
              onChange={(e) => {
                if (!e.target.checked) setTermsAcceptedVersion(null);
              }}
            />
            <span className={styles.checkboxLabel}>
              Confirmo que he realizado la verificación preoperacional de la herramienta{" "}
              <strong>{selectedTool?.nombre || "[NOMBRE HERRAMIENTA]"}</strong>
              {selectedOrder && ` para la Orden #${selectedOrder.orden_id}`} y
              acepto los{" "}
              <button
                type="button"
                className={styles.termsLink}
                onClick={() => setShowTermsModal(true)}
              >
                términos y condiciones
              </button>{" "}
              establecidos. *
            </span>
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="submit"
            className={`${styles.submitButton} ${!isFormValid && !isOtpStep ? styles.submitButtonDisabled : ""
              }`}
            disabled={
              isSubmitting ||
              (!isFormValid && !isOtpStep) ||
              (isOtpStep && !otpCode.trim())
            }
          >
            {isSubmitting
              ? "Procesando..."
              : isOtpStep
                ? "Firmar con OTP"
                : "✅ Guardar y solicitar OTP"}
          </button>
        </div>

        {!isFormValid && !successMessage && !isOtpStep && (
          <div className={styles.validationMessage}>
            <strong>⚠️ Complete los siguientes campos:</strong>
            <ul>
              {getValidationErrors().map((error, index) => (
                <li key={`validation-error-${index}`}> {error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={(version) => {
          setTermsAcceptedVersion(version);
          setShowTermsModal(false);
        }}
        onReject={() => {
          setTermsAcceptedVersion(null);
          setShowTermsModal(false);
        }}
        type="preoperational_form"
      />
    </div>
  );
}