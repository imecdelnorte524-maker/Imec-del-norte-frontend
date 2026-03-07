// src/components/sg-sst/PreoperationalForm.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type {
  PreoperationalFormData,
  CheckValue,
  SignFormData,
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

// Valores válidos para checklist
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
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [orders, setOrders] = useState<OrderWithTools[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTools | null>(
    null,
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  // 🔹 Datos internos del formulario (incluye toolName para UI)
  const [formData, setFormData] = useState<{
    toolName?: string;
    checks: { parameter: string; value?: CheckValue; observations?: string }[];
    userId: number;
    createdBy: number;
    workOrderId: number;
  }>({
    toolName: "",
    checks: [],
    userId,
    createdBy,
    workOrderId: 0,
  });

  // 🔹 Estado para OTP
  const [createdFormId, setCreatedFormId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");

  const redirectToReportsList = () => {
    setTimeout(() => {
      navigate("/sg-sst");
    }, 2000);
  };

  // Validación global (NO incluye OTP, OTP se valida aparte)
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
      if (!validation.isValid && validation.missingRequired.length > 0) {
        errors.push(
          `Complete los parámetros requeridos (${validation.missingRequired.length} pendientes)`,
        );
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
        return !!selectedTool && toolsForSelectedOrder.length > 0;
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

      const { items } = await initializeChecklist(tool.nombre.toUpperCase());

      setFormData((prev) => ({
        ...prev,
        toolName: tool.nombre,
        checks: items.map((item) => ({
          parameter: item.parameter,
          value: item.value,
          observations: item.observations,
        })),
      }));
    } catch (error) {
      console.error("Error al cargar checklist:", error);
    }
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
    observations: string,
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

    // Paso 1: Crear Formulario y Solicitar OTP
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
        };

        // 1) Crear formulario preoperacional
        const resp = await sgSstService.createPreoperational(submitDto as any);
        const newFormId = resp?.data?.form?.id;

        if (!newFormId) {
          throw new Error(
            "No se pudo obtener el ID del formulario preoperacional creado",
          );
        }

        // 2) Solicitar OTP
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

    // Paso 2: Firmar con OTP
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
        equipmentTool: formData.toolName,
        checks: formData.checks,
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
          className={`${styles.validationIndicator} ${
            isFormValid ? styles.valid : styles.invalid
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
              ) : validOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No hay órdenes con herramientas asignadas disponibles.</p>
                </div>
              ) : (
                <select
                  className={`${styles.input} ${
                    !selectedOrder ? styles.inputError : ""
                  }`}
                  value={selectedOrder?.orden_id || ""}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  required
                >
                  <option value="">
                    Seleccione una orden con herramientas...
                  </option>
                  {validOrders.map((order, index) => {
                    const personaClient = order.cliente;
                    const clientName =
                      order.cliente_empresa?.nombre ||
                      (personaClient
                        ? `${personaClient.nombre} ${
                            personaClient.apellido ?? ""
                          }`.trim()
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
            <h2 className={styles.sectionTitle}>
              2. Selección de Herramienta
              {selectedOrder && ` - Orden #${selectedOrder.orden_id}`}
            </h2>
            {getSectionStatus(2) && toolsForSelectedOrder.length > 0 && (
              <span className={styles.sectionStatus}>✓</span>
            )}
            {!getSectionStatus(2) && selectedOrder && (
              <span className={styles.requiredIndicator}>
                {" "}
                (
                {toolsForSelectedOrder.length === 0
                  ? "No hay herramientas"
                  : "Seleccione una herramienta"}
                )
              </span>
            )}
          </div>

          {!selectedOrder ? (
            <div className={styles.infoText}>
              <p>
                Primero seleccione una orden de trabajo con herramientas
                asignadas.
              </p>
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
              <p className={styles.infoText}>
                Esta orden no tiene herramientas en el campo{" "}
                <code>toolDetails</code>. Contacte al administrador para asignar
                herramientas a esta orden.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.infoText}>
                <p>
                  <strong>Orden #{selectedOrder.orden_id}:</strong>{" "}
                  {toolsForSelectedOrder.length} herramienta(s) disponible(s)
                  para preoperacional
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
                    className={`${styles.equipmentCard} ${
                      selectedTool?.herramientaId === tool.herramientaId
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() => handleToolSelect(tool)}
                  >
                    <div className={styles.equipmentHeader}>
                      <h3 className={styles.equipmentName}>{tool.nombre}</h3>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(
                          tool.estado,
                        )}`}
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
                      {tool.detalleHerramientaId && (
                        <div className={styles.detail}>
                          <strong>ID Detalle:</strong>{" "}
                          {tool.detalleHerramientaId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedTool && (
          <div
            className={`${styles.section} ${
              !getSectionStatus(3) ? styles.sectionIncomplete : ""
            }`}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleContainer}>
                <h2 className={styles.sectionTitle}>
                  3. Checklist Preoperacional - {selectedTool.nombre}
                  {selectedOrder && ` (Orden #${selectedOrder.orden_id})`}
                </h2>
                <div className={styles.statsContainer}>
                  {loadingChecklist ? (
                    <span className={styles.statsText}>
                      Cargando checklist...
                    </span>
                  ) : checklistItems.length > 0 ? (
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
                  ) : (
                    <span className={styles.statsText}>
                      No hay parámetros configurados para este herramienta
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.sectionStatusContainer}>
                {getSectionStatus(3) && checklistItems.length > 0 && (
                  <span className={styles.sectionStatus}>✓</span>
                )}
                {!getSectionStatus(3) && (
                  <span className={styles.requiredIndicator}>Completar</span>
                )}
              </div>
            </div>

            {checklistError && (
              <div className={styles.error}>{checklistError}</div>
            )}

            {checklistItems.length > 0 && (
              <>
                <div className={styles.checklist}>
                  {checklistItems.map((check, index) => (
                    <div
                      key={
                        check.parameterId
                          ? `check-${check.parameterId}`
                          : `check-index-${index}`
                      }
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
                          {CHECK_VALUES.map((value, valueIndex) => (
                            <label
                              key={`${check.parameterId || `check-${index}`}-value-${valueIndex}`}
                              className={styles.valueOption}
                            >
                              <input
                                type="radio"
                                name={`check-${check.parameterId || `check-${index}`}`}
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
              </>
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
              verificación de la herramienta{" "}
              <strong>{selectedTool.nombre}</strong>
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
                <label className={styles.label}>
                  Código OTP enviado a tu correo *
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  placeholder="Ingresa los 6 dígitos"
                  style={{
                    fontSize: "1.5rem",
                    letterSpacing: "0.25rem",
                    textAlign: "center",
                    maxWidth: "250px",
                    margin: "0 auto",
                    display: "block",
                  }}
                />
                <p
                  className={styles.otpHelpText}
                  style={{ marginTop: "10px", textAlign: "center" }}
                >
                  Revisa tu bandeja de entrada.
                </p>
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
                He verificado el estado de la herramienta{" "}
                <strong>
                  {selectedTool?.nombre || "[NOMBRE HERRAMIENTA]"}
                </strong>{" "}
                según el checklist preoperacional.
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
              {selectedOrder && (
                <li>
                  Esta verificación corresponde a la Orden de Trabajo #
                  {selectedOrder.orden_id}.
                </li>
              )}
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
              Confirmo que he realizado la verificación preoperacional de la
              herramienta{" "}
              <strong>{selectedTool?.nombre || "[NOMBRE HERRAMIENTA]"}</strong>
              {selectedOrder && ` para la Orden #${selectedOrder.orden_id}`} y
              acepto los términos establecidos. *
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
              !isFormValid && !isOtpStep ? styles.submitButtonDisabled : ""
            }`}
            disabled={
              isSubmitting ||
              (!isFormValid && !isOtpStep) ||
              (isOtpStep && !otpCode.trim()) ||
              (!!successMessage && !isOtpStep)
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
    </div>
  );
}
