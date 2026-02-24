// src/components/orders/OrderDetail.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  rejectOrderRequest,
  uploadInvoiceRequest,
  addSupplyDetailRequest,
  addToolDetailRequest,
  removeToolDetailRequest,
  removeSupplyDetailRequest,
  createEmergencyOrderRequest,
  signOrderReceiptRequest,
} from "../../api/orders";
import { usersApi } from "../../api/users";
import { inventory } from "../../api/inventory";
import { getEquipmentByClientRequest } from "../../api/equipment";
import { useOrderMutations } from "../../hooks/useOrders";
import type {
  BillingEstado,
  Order,
  UpdateOrderData,
  AssociatedEquipment,
  CostEstado,
} from "../../interfaces/OrderInterfaces";
import type { Usuario } from "../../interfaces/UserInterfaces";
import type { Equipment } from "../../interfaces/EquipmentInterfaces";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { InventoryItem } from "../../interfaces/InventoryInterfaces";
import { playErrorSound } from "../../utils/sounds";
import { useAuth } from "../../hooks/useAuth";
import OrderSignatureModal from "./OrderSignatureModal";
import OrderEvidenceSection from "./OrderEvidenceSection";
import OrderEditModal from "./OrderEditModal";
import AcInspectionModal from "./AcInspectionModal";
import AcTechnicalDataSection from "./AcTechnicalDataSection";
import EquipmentSelectionModal from "./EquipmentSelectionModal";

interface Props {
  order: Order;
  onBack: () => void;
  userRole: "cliente" | "tecnico" | "admin" | "secretaria";
}

interface ConfirmModalState {
  isOpen: boolean;
  type: "tool" | "supply" | null;
  id: number | null;
}

// Función para normalizar el rol recibido
const normalizeUserRole = (role: string): string => {
  if (!role) return "usuario";
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("tec") || lowerRole.includes("téc")) return "tecnico";
  if (lowerRole.includes("admin")) return "admin";
  if (lowerRole.includes("client")) return "cliente";
  if (lowerRole.includes("secret")) return "secretaria";
  if (lowerRole.includes("super")) return "supervisor";
  return lowerRole;
};

type PendingPostRatingAction = "openBillingModal" | "openInvoiceModal" | null;

export default function OrderDetail({ order, onBack, userRole }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentOrder = order;

  const {
    updateOrder,
    assignTechnician,
    unassignTechnician,
    cancelOrder,
    rateTechnicians,
  } = useOrderMutations();

  const normalizedUserRole = normalizeUserRole(userRole);
  const isClient = normalizedUserRole === "cliente";
  const isTechnician = normalizedUserRole === "tecnico";
  const isAdminOrSecretaria =
    normalizedUserRole === "admin" || normalizedUserRole === "secretaria";

  const normalizedAuthRole = normalizeUserRole(
    (user as any)?.role?.nombreRol || (user as any)?.role || userRole,
  );

  const canRateTechnicians =
    normalizedAuthRole === "admin" || normalizedAuthRole === "supervisor";

  const validStatuses = {
    PENDIENTE: "Pendiente" as const,
    ASIGNADA: "Asignada" as const,
    EN_PROCESO: "En Proceso" as const,
    PAUSADA: "Pausada" as const,
    COMPLETADO: "Completado" as const,
    CANCELADA: "Cancelada" as const,
    RECHAZADA: "Rechazada" as const,
  };

  const isAirConditioningOrder =
    (currentOrder.servicio.categoria_servicio || "").toLowerCase().trim() ===
    "aires acondicionados";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState<number[]>([]);
  const [leaderTechnicianId, setLeaderTechnicianId] = useState<number | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  const [technicians, setTechnicians] = useState<Usuario[]>([]);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | "">(
    "",
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBillingStatus, setSelectedBillingStatus] =
    useState<BillingEstado>("");
  const [selectedCostStatus, setSelectedCostStatus] = useState<CostEstado>("");
  const [billingError, setBillingError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: null,
    id: null,
  });

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [clientEquipments, setClientEquipments] = useState<Equipment[]>([]);
  const [selectedEmergencyEquipments, setSelectedEmergencyEquipments] =
    useState<number[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);

  const [selectedEmergencyTechnicians, setSelectedEmergencyTechnicians] =
    useState<number[]>([]);
  const [emergencyLeaderId, setEmergencyLeaderId] = useState<number | null>(
    null,
  );
  const [emergencyComment, setEmergencyComment] = useState("");

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseObservation, setPauseObservation] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);

  const [showAcInspectionModal, setShowAcInspectionModal] = useState(false);
  const [showEqSelector, setShowEqSelector] = useState(false);
  const [selectedEquipment, setSelectedEquipment] =
    useState<AssociatedEquipment | null>(null);
  const [acPhase, setAcPhase] = useState<"BEFORE" | "AFTER">("BEFORE");

  const supplyDetails = currentOrder.supplyDetails ?? [];
  const toolDetails = currentOrder.toolDetails ?? [];

  const [activeEquipmentId, setActiveEquipmentId] = useState<number | null>(
    currentOrder.equipos?.[0]?.equipmentId ?? null,
  );

  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);

  useEffect(() => {
    setActiveEquipmentId(currentOrder.equipos?.[0]?.equipmentId ?? null);
  }, [currentOrder.orden_id, currentOrder.equipos?.length]);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [pendingPostRatingAction, setPendingPostRatingAction] =
    useState<PendingPostRatingAction>(null);
  const [showRatingNotice, setShowRatingNotice] = useState(false);

  const isSavingRatings = rateTechnicians.status === "pending";

  const handleOpenAcInspectionForEquipment = (eq: AssociatedEquipment) => {
    setSelectedEquipment(eq);

    const hasBefore =
      currentOrder.acInspections?.some(
        (insp) =>
          insp.equipmentId === eq.equipmentId && insp.phase === "BEFORE",
      ) ?? false;

    const hasAfter =
      currentOrder.acInspections?.some(
        (insp) => insp.equipmentId === eq.equipmentId && insp.phase === "AFTER",
      ) ?? false;

    let nextPhase: "BEFORE" | "AFTER" = "BEFORE";

    if (!hasBefore) {
      nextPhase = "BEFORE";
    } else if (hasBefore && !hasAfter) {
      nextPhase = "AFTER";
    } else {
      nextPhase = "BEFORE";
    }

    setAcPhase(nextPhase);
    setShowAcInspectionModal(true);
  };

  useEffect(() => {
    if (!isAdminOrSecretaria) return;
    const loadTechnicians = async () => {
      try {
        const data = await usersApi.getTechnicians();
        setTechnicians(data);
      } catch (err: any) {
        console.error("Error cargando técnicos", err);
      }
    };
    loadTechnicians();
  }, [isAdminOrSecretaria]);

  useEffect(() => {
    if (
      selectedTechnicians.length > 0 &&
      !selectedTechnicians.includes(leaderTechnicianId || 0)
    ) {
      setLeaderTechnicianId(selectedTechnicians[0]);
    } else if (selectedTechnicians.length === 0) {
      setLeaderTechnicianId(null);
    }
  }, [selectedTechnicians, leaderTechnicianId]);

  useEffect(() => {
    if (
      selectedEmergencyTechnicians.length > 0 &&
      !selectedEmergencyTechnicians.includes(emergencyLeaderId || 0)
    ) {
      setEmergencyLeaderId(selectedEmergencyTechnicians[0]);
    } else if (selectedEmergencyTechnicians.length === 0) {
      setEmergencyLeaderId(null);
    }
  }, [selectedEmergencyTechnicians, emergencyLeaderId]);

  const refreshData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["orderDetail", currentOrder.orden_id],
    });
    await queryClient.refetchQueries({
      queryKey: ["orderDetail", currentOrder.orden_id],
    });
  };

  const hasBillingStatus = currentOrder.estado_facturacion !== "";

  const canEditOrderDetails =
    isAdminOrSecretaria &&
    currentOrder.estado !== validStatuses.COMPLETADO &&
    !hasBillingStatus;

  const handleStartOrderClick = () => {
    if (isAirConditioningOrder) {
      setAcPhase("BEFORE");
      if (currentOrder.equipos.length === 1) {
        setSelectedEquipment(currentOrder.equipos[0]);
        setShowAcInspectionModal(true);
      } else {
        setShowEqSelector(true);
      }
    } else {
      handleStatusUpdate(validStatuses.EN_PROCESO);
    }
  };

  const hasReceiptSignature =
    !!currentOrder.received_by_name &&
    !!currentOrder.received_by_position &&
    !!currentOrder.received_by_signature_data;

  const handleCompleteOrderClick = () => {
    if (isAirConditioningOrder) {
      const totalEq = currentOrder.equipos.length;
      const completedInspections =
        currentOrder.acInspections?.filter((i) => i.phase === "AFTER").length ||
        0;

      if (completedInspections < totalEq) {
        setAcPhase("AFTER");

        if (currentOrder.equipos.length === 1) {
          setSelectedEquipment(currentOrder.equipos[0]);
          setShowAcInspectionModal(true);
        } else {
          setShowEqSelector(true);
        }
      } else if (!hasReceiptSignature) {
        setShowSignatureModal(true);
      } else {
        handleStatusUpdate(validStatuses.COMPLETADO);
      }
    } else {
      if (hasReceiptSignature) {
        handleStatusUpdate(validStatuses.COMPLETADO);
      } else {
        setShowSignatureModal(true);
      }
    }
  };

  const handleEquipmentSelected = (eq: AssociatedEquipment) => {
    setSelectedEquipment(eq);
    setShowEqSelector(false);
    setShowAcInspectionModal(true);
  };

  const handleAcInspectionSuccess = async () => {
    setShowAcInspectionModal(false);
    await refreshData();

    if (
      acPhase === "BEFORE" &&
      (currentOrder.estado === "Pendiente" ||
        currentOrder.estado === "Asignada")
    ) {
      await handleStatusUpdate(validStatuses.EN_PROCESO);
    }
  };

  const handleOpenEmergencyModal = async () => {
    setShowEmergencyModal(true);
    setLoadingEquipments(true);
    setSelectedEmergencyEquipments([]);
    setSelectedEmergencyTechnicians([]);
    setEmergencyLeaderId(null);
    setEmergencyComment("");

    const currentTechs = currentOrder.technicians || [];
    if (currentTechs.length === 1) {
      const onlyTechId = currentTechs[0].tecnicoId;
      setSelectedEmergencyTechnicians([onlyTechId]);
      setEmergencyLeaderId(onlyTechId);
    }

    try {
      if (currentOrder.cliente_empresa?.id_cliente) {
        const data = await getEquipmentByClientRequest(
          currentOrder.cliente_empresa.id_cliente,
        );
        setClientEquipments(data);
      }
    } catch (err) {
      console.error("Error cargando equipos", err);
    } finally {
      setLoadingEquipments(false);
    }
  };

  const handleOpenEditModal = async () => {
    setError(null);
    if (
      currentOrder.cliente_empresa?.id_cliente &&
      clientEquipments.length === 0
    ) {
      try {
        setLoadingEquipments(true);
        const data = await getEquipmentByClientRequest(
          currentOrder.cliente_empresa.id_cliente,
        );
        setClientEquipments(data);
      } catch (err) {
        console.error("Error cargando equipos para edición", err);
      } finally {
        setLoadingEquipments(false);
      }
    }
    setShowEditModal(true);
  };

  const toggleEmergencyEquipment = (eqId: number) => {
    setSelectedEmergencyEquipments((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId],
    );
  };

  const toggleEmergencyTechnician = (techId: number) => {
    setSelectedEmergencyTechnicians((prev) =>
      prev.includes(techId)
        ? prev.filter((id) => id !== techId)
        : [...prev, techId],
    );
  };

  const confirmEmergencyOrder = async () => {
    if (selectedEmergencyTechnicians.length === 0) {
      alert("Debe seleccionar al menos un técnico para la emergencia.");
      return;
    }

    if (selectedEmergencyEquipments.length === 0) {
      alert("Debe seleccionar al menos un equipo para la emergencia.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const equipmentIds = selectedEmergencyEquipments;
      const technicianIds = selectedEmergencyTechnicians;

      const leaderId =
        emergencyLeaderId && technicianIds.includes(emergencyLeaderId)
          ? emergencyLeaderId
          : technicianIds[0];

      const commentToSend =
        emergencyComment.trim() ||
        `Emergencia creada desde orden ${currentOrder.orden_id}`;

      const emergencyOrder = await createEmergencyOrderRequest(
        currentOrder.orden_id,
        {
          technicianIds,
          leaderTechnicianId: leaderId,
          equipmentIds,
          comentarios: commentToSend,
        },
      );

      await refreshData();
      setShowEmergencyModal(false);

      navigate("/orders", {
        state: { initialOrderId: emergencyOrder.orden_id },
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error creando orden de emergencia",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    newStatus: Order["estado"],
    pauseObs?: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updateData: UpdateOrderData = { estado: newStatus };

      if (newStatus === validStatuses.EN_PROCESO)
        updateData.fecha_inicio = new Date().toISOString();
      else if (newStatus === validStatuses.COMPLETADO)
        updateData.fecha_finalizacion = new Date().toISOString();

      if (pauseObs !== undefined) {
        (updateData as any).pause_observation = pauseObs;
      }

      await updateOrder.mutateAsync({
        orderId: currentOrder.orden_id,
        data: updateData,
      });
      await refreshData();

      if (
        newStatus === validStatuses.COMPLETADO ||
        newStatus === validStatuses.CANCELADA
      ) {
        onBack();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al actualizar orden");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrderDetails = async (changes: {
    comentarios?: string;
    equipmentIds: number[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const dataToSend: any = {};
      if (changes.comentarios !== undefined) {
        dataToSend.comentarios = changes.comentarios;
      }
      if (changes.equipmentIds !== undefined) {
        dataToSend.equipmentIds = changes.equipmentIds;
        dataToSend.equipment_ids = changes.equipmentIds;
      }

      await updateOrder.mutateAsync({
        orderId: currentOrder.orden_id,
        data: dataToSend,
      });
      await refreshData();
      setShowEditModal(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al editar la orden",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnicians = async () => {
    if (selectedTechnicians.length === 0) {
      setError("Debe seleccionar al menos un técnico");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const techniciansData = selectedTechnicians.map((id) => ({
        tecnicoId: id,
        isLeader: id === (leaderTechnicianId || selectedTechnicians[0]),
      }));
      await assignTechnician.mutateAsync({
        orderId: currentOrder.orden_id,
        technicians: techniciansData,
      });
      await refreshData();
      setShowAssignForm(false);
      setSelectedTechnicians([]);
      setLeaderTechnicianId(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al asignar técnicos",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTechnician = async (tecnicoId?: number) => {
    setLoading(true);
    setError(null);
    try {
      await unassignTechnician.mutateAsync({
        orderId: currentOrder.orden_id,
        tecnicoId,
      });
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error quitando técnico");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await rejectOrderRequest(currentOrder.orden_id, rejectReason);
      await refreshData();
      setShowRejectForm(false);
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error rechazando orden");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("¿Cancelar orden?")) return;
    setLoading(true);
    setError(null);
    try {
      await cancelOrder.mutateAsync(currentOrder.orden_id);
      await refreshData();
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error cancelando orden");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceFile) {
      setInvoiceError("Seleccione un archivo");
      return;
    }
    if (!selectedCostStatus) {
      setInvoiceError("Seleccione el estado de pago");
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      const formData = new FormData();
      formData.append("file", invoiceFile);

      await uploadInvoiceRequest(
        currentOrder.orden_id,
        formData,
        selectedCostStatus,
      );

      await refreshData();
      setShowInvoiceModal(false);
      setSelectedCostStatus("");
      setInvoiceFile(null);
    } catch (err: any) {
      setInvoiceError(err.response?.data?.message || "Error subiendo factura");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleOpenInventoryModal = async () => {
    setInventoryError(null);
    setSelectedInventoryId("");
    setSelectedQuantity(1);
    setShowInventoryModal(true);
    try {
      setInventoryLoading(true);
      const data = await inventory.getAllInventory();
      const availableItems = data.filter((item: InventoryItem) => {
        const estadoNormalizado =
          item.tool?.estado?.toLowerCase().trim() ||
          item.supply?.estado?.toLowerCase().trim() ||
          "";
        return estadoNormalizado === "disponible";
      });
      setInventoryItems(availableItems);
    } catch (err) {
      setInventoryError("Error cargando inventario");
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setShowPaymentConfirmModal(true);
  };

  const confirmMarkAsPaid = async () => {
    setShowPaymentConfirmModal(false);
    setLoading(true);
    setError(null);

    const payload: UpdateOrderData = {
      estado_pago: "Pagado" as CostEstado,
    };

    try {
      await updateOrder.mutateAsync({
        orderId: currentOrder.orden_id,
        data: payload,
      });
      await refreshData();
    } catch (err: any) {
      console.error("Error completo:", err);
      setError(err.response?.data?.message || "Error al marcar como pagado");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const hasTechnicians =
    currentOrder.technicians && currentOrder.technicians.length > 0;

  const hasUnratedTechnicians =
    !!hasTechnicians &&
    currentOrder.technicians.some(
      (t) => t.rating === null || t.rating === undefined,
    );

  const needsRating =
    canRateTechnicians &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    hasUnratedTechnicians;

  useEffect(() => {
    if (needsRating) {
      setShowRatingNotice(true);
    } else {
      setShowRatingNotice(false);
    }
  }, [needsRating]);

  useEffect(() => {
    setSelectedCostStatus(currentOrder.estado_pago || "");
  }, [currentOrder.orden_id, currentOrder.estado_pago]);

  const openRatingModal = (action: PendingPostRatingAction) => {
    if (!currentOrder.technicians || currentOrder.technicians.length === 0)
      return;
    const initialRatings: Record<number, number> = {};
    currentOrder.technicians.forEach((t) => {
      initialRatings[t.tecnicoId] = t.rating ?? 0;
    });
    setRatings(initialRatings);
    setRatingError(null);
    setPendingPostRatingAction(action);
    setShowRatingModal(true);
  };

  const handleOpenBillingModal = () => {
    setBillingError(null);

    if (needsRating) {
      openRatingModal("openBillingModal");
      return;
    }

    setSelectedBillingStatus(currentOrder.estado_facturacion);
    setShowBillingModal(true);
  };

  const handleOpenInvoiceModal = () => {
    setInvoiceError(null);

    if (needsRating) {
      openRatingModal("openInvoiceModal");
      return;
    }

    setShowInvoiceModal(true);
  };

  const handleAssignInventoryItem = async () => {
    if (!selectedInventoryId) return;
    const selected = inventoryItems.find(
      (i) => i.inventarioId === selectedInventoryId,
    );
    if (!selected) return;

    setInventoryError(null);
    setLoading(true);
    try {
      if (selected.tipo === "insumo") {
        if (!selected.supply) return;
        if (!selectedQuantity || selectedQuantity <= 0) {
          setInventoryError("Cantidad inválida");
          setLoading(false);
          return;
        }
        if (selectedQuantity > selected.cantidadActual) {
          setInventoryError(`Stock insuficiente: ${selected.cantidadActual}`);
          setLoading(false);
          return;
        }
        await addSupplyDetailRequest(currentOrder.orden_id, {
          insumoId: selected.supply.insumoId,
          cantidadUsada: selectedQuantity,
        });
      } else {
        if (!selected.tool) return;
        await addToolDetailRequest(currentOrder.orden_id, {
          herramientaId: selected.tool.herramientaId,
        });
      }

      await refreshData();
      setShowInventoryModal(false);
      setSelectedInventoryId("");
      setSelectedQuantity(1);
    } catch (err: any) {
      setInventoryError(err.response?.data?.message || "Error asignando ítem");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBillingStatus = async () => {
    if (!selectedBillingStatus) return;

    setLoading(true);
    setBillingError(null);

    try {
      await updateOrder.mutateAsync({
        orderId: currentOrder.orden_id,
        data: {
          estado_facturacion: selectedBillingStatus,
        },
      });

      await refreshData();
      setShowBillingModal(false);
    } catch (err: any) {
      setBillingError(
        err.response?.data?.message ||
          err.message ||
          "Error asignando estado de facturación",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRatings = async () => {
    setRatingError(null);

    if (!currentOrder.technicians || currentOrder.technicians.length === 0) {
      setShowRatingModal(false);
      return;
    }

    const payload = currentOrder.technicians.map((tech) => ({
      technicianId: tech.tecnicoId,
      rating: ratings[tech.tecnicoId] ?? 0,
    }));

    try {
      await rateTechnicians.mutateAsync({
        orderId: currentOrder.orden_id,
        ratings: payload,
      });

      await refreshData();
      setShowRatingModal(false);

      if (pendingPostRatingAction === "openBillingModal") {
        setSelectedBillingStatus(currentOrder.estado_facturacion);
        setShowBillingModal(true);
      } else if (pendingPostRatingAction === "openInvoiceModal") {
        setShowInvoiceModal(true);
      }
      setPendingPostRatingAction(null);
    } catch (err: any) {
      setRatingError(
        err.response?.data?.message ||
          err.message ||
          "Error al guardar calificaciones",
      );
      playErrorSound();
    }
  };

  const requestReturnTool = (id: number) =>
    setConfirmModal({ isOpen: true, type: "tool", id });
  const requestRemoveSupply = (id: number) =>
    setConfirmModal({ isOpen: true, type: "supply", id });
  const closeConfirmModal = () =>
    setConfirmModal({ isOpen: false, type: null, id: null });

  const handleConfirmDelete = async () => {
    const { type, id } = confirmModal;
    if (!type || !id) return;
    setLoading(true);
    setConfirmModal({ isOpen: false, type: null, id: null });
    try {
      if (type === "tool")
        await removeToolDetailRequest(currentOrder.orden_id, id);
      else await removeSupplyDetailRequest(currentOrder.orden_id, id);

      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error eliminando elemento");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const toggleTechnicianSelection = (techId: number) => {
    setSelectedTechnicians((prev) => {
      if (prev.includes(techId)) {
        return prev.filter((id) => id !== techId);
      } else {
        return [...prev, techId];
      }
    });
  };

  const handleSubmitSignature = async (data: {
    name: string;
    position: string;
    signatureData: string | null;
  }) => {
    setSignatureLoading(true);
    setError(null);
    try {
      await signOrderReceiptRequest(currentOrder.orden_id, {
        name: data.name,
        position: data.position,
        signatureData: data.signatureData,
      });

      await refreshData();
      setShowSignatureModal(false);

      await handleStatusUpdate(validStatuses.COMPLETADO);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error guardando firma de recibido",
      );
      playErrorSound();
    } finally {
      setSignatureLoading(false);
    }
  };

  const handleViewInvoice = async (url: string, orderId: number) => {
    if (!url) return;

    try {
      setLoading(true);

      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `factura-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error descargando factura:", error);
      window.open(url, "_blank");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (st: string) => {
    if (st === validStatuses.PENDIENTE || st === validStatuses.ASIGNADA)
      return styles.statusPending;
    if (st === validStatuses.EN_PROCESO) return styles.statusInProgress;
    if (st === validStatuses.PAUSADA) return styles.statusPaused;
    if (st === validStatuses.COMPLETADO) return styles.statusCompleted;
    if (st === validStatuses.CANCELADA) return styles.statusCancelled;
    if (st === validStatuses.RECHAZADA) return styles.statusRejected;
    return styles.statusPending;
  };

  const getBillingColor = (st: string) =>
    st === "Facturado"
      ? styles.billingBilled
      : st === "Garantía"
        ? styles.billingWarranty
        : styles.billingNotBilled;

  const isReadOnly = currentOrder.estado_facturacion === "Facturado";

  const canUploadInvoice =
    isAdminOrSecretaria &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    !currentOrder.factura_pdf_url &&
    !currentOrder.estado_pago;

  const canAssignInventory =
    (isAdminOrSecretaria || isTechnician) &&
    !isReadOnly &&
    currentOrder.estado !== validStatuses.CANCELADA &&
    currentOrder.estado !== validStatuses.RECHAZADA &&
    currentOrder.estado !== validStatuses.COMPLETADO;

  const canBillingStatus =
    isAdminOrSecretaria &&
    !isReadOnly &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    currentOrder.estado_facturacion === "";

  const isTechnicianAssigned =
    user &&
    currentOrder.technicians?.some((tech) => tech.tecnicoId === user.usuarioId);

  const canTechnicianStartOrder =
    isTechnician &&
    !isReadOnly &&
    isTechnicianAssigned &&
    currentOrder.estado === validStatuses.ASIGNADA;

  const canTechnicianCompleteOrder =
    isTechnician &&
    !isReadOnly &&
    isTechnicianAssigned &&
    currentOrder.estado === validStatuses.EN_PROCESO;

  const canPauseOrder =
    !isReadOnly &&
    currentOrder.estado === validStatuses.EN_PROCESO &&
    ((isTechnician && isTechnicianAssigned) || isAdminOrSecretaria);

  const canResumeOrder =
    !isReadOnly &&
    currentOrder.estado === validStatuses.PAUSADA &&
    ((isTechnician && isTechnicianAssigned) || isAdminOrSecretaria);

  const canCreateEmergency =
    !isClient &&
    !isReadOnly &&
    (currentOrder.estado === validStatuses.ASIGNADA ||
      currentOrder.estado === validStatuses.EN_PROCESO);

  const canEditEvidence =
    !isReadOnly &&
    (isAdminOrSecretaria || (isTechnician && !!isTechnicianAssigned));

  const hasBeforeInspection =
    currentOrder.acInspections?.some((i) => i.phase === "BEFORE") ?? false;

  const handleBackClick = () => {
    onBack();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handleBackClick}>
          ← Volver
        </button>
        <h1>Orden de Servicio #{currentOrder.orden_id}</h1>
        <div className={styles.statusRow}>
          <span
            className={`${styles.statusBadge} ${getStatusColor(
              currentOrder.estado,
            )}`}
          >
            {currentOrder.estado}
          </span>

          {/* Badge de estado de facturación */}
          {currentOrder.estado_facturacion !== "" && (
            <span
              className={`${styles.billingBadge} ${getBillingColor(
                currentOrder.estado_facturacion,
              )}`}
            >
              {currentOrder.estado_facturacion}
            </span>
          )}

          {/* Badge de estado de pago - Por pagar */}
          {currentOrder.estado_pago === "Por pagar" && (
            <span className={`${styles.paymentBadge} ${styles.paymentPending}`}>
              <span className={styles.paymentIcon}>⏳</span>
              {currentOrder.estado_pago}
            </span>
          )}

          {/* Badge de estado de pago - Pagado */}
          {currentOrder.estado_pago === "Pagado" && (
            <span className={`${styles.paymentBadge} ${styles.paymentPaid}`}>
              <span className={styles.paymentIcon}>✓</span>
              Pagado
            </span>
          )}

          {/* Botón de ver factura mejorado */}
          {currentOrder.factura_pdf_url && (
            <div className={styles.invoiceActions}>
              <button
                onClick={() => {
                  if (currentOrder.factura_pdf_url) {
                    handleViewInvoice(
                      currentOrder.factura_pdf_url,
                      currentOrder.orden_id,
                    );
                  }
                }}
                className={styles.invoiceLinkButton}
              >
                <span className={styles.invoiceIcon}>📄</span>
                Ver Factura
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notificación calificación pendiente */}
      {needsRating && showRatingNotice && !showRatingModal && (
        <div className={styles.pushOverlay}>
          <div className={styles.pushCard}>
            <div className={styles.pushTitle}>Calificación pendiente</div>
            <p className={styles.pushText}>
              Esta orden está finalizada y tiene técnicos pendientes por
              calificar. Debe completar la calificación antes de facturar.
            </p>
            <div className={styles.pushActions}>
              <button
                className={styles.pushSecondaryButton}
                onClick={() => setShowRatingNotice(false)}
              >
                Más tarde
              </button>
              <button
                className={styles.pushPrimaryButton}
                onClick={() => {
                  openRatingModal(null);
                  setShowRatingNotice(false);
                }}
              >
                Calificar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {/* DETALLES */}
      <div className={styles.detailsGrid}>
        <div className={styles.section}>
          <h3>Información Cliente</h3>
          {currentOrder.cliente_empresa && (
            <div className={styles.detailItem}>
              <strong>Empresa:</strong>
              <span>{currentOrder.cliente_empresa.nombre}</span>
            </div>
          )}
          <div className={styles.detailItem}>
            <strong>Contacto:</strong>
            <span>
              {currentOrder.cliente?.nombre || ""}{" "}
              {currentOrder.cliente?.apellido || ""}
            </span>
          </div>
          <div className={styles.detailItem}>
            <strong>Teléfono del Contacto:</strong>
            <span>{currentOrder.cliente?.telefono || "No disponible"}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Servicio</h3>
          <div className={styles.detailItem}>
            <strong>Servicio:</strong>
            <span>{currentOrder.servicio.nombre_servicio}</span>
          </div>
          <div className={styles.detailItem}>
            <strong>Descripción:</strong>
            <span>{currentOrder.servicio.descripcion || "N/A"}</span>
          </div>
          {currentOrder.tipo_servicio && (
            <div className={styles.detailItem}>
              <strong>Tipo:</strong>
              <span>{currentOrder.tipo_servicio}</span>
            </div>
          )}
          {currentOrder.maintenance_type && (
            <div className={styles.detailItem}>
              <strong>Clase:</strong>
              <span className={styles.serviceClassLabel}>
                {currentOrder.maintenance_type.nombre}
              </span>
            </div>
          )}
          {currentOrder.servicio.categoria_servicio && (
            <div className={styles.detailItem}>
              <strong>Categoría:</strong>
              <span>{currentOrder.servicio.categoria_servicio}</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3>Técnicos Asignados</h3>
          {currentOrder.technicians && currentOrder.technicians.length > 0 ? (
            <div className={styles.techniciansList}>
              {currentOrder.technicians.map((tech) => (
                <div key={tech.id} className={styles.technicianItem}>
                  <div className={styles.technicianInfo}>
                    <strong>
                      {tech.technician.nombre} {tech.technician.apellido}
                      {tech.isLeader && (
                        <span className={styles.leaderChip}>Líder</span>
                      )}
                    </strong>
                    <span>{tech.technician.email}</span>
                    <span>📞 {tech.technician.telefono || "N/A"}</span>
                    {typeof tech.rating === "number" && (
                      <span className={styles.technicianRatingText}>
                        Calificación: {tech.rating.toFixed(1)} / 5
                      </span>
                    )}
                  </div>
                  {isAdminOrSecretaria &&
                    currentOrder.estado !== validStatuses.CANCELADA &&
                    currentOrder.estado !== validStatuses.COMPLETADO && (
                      <button
                        className={styles.removeTechnicianButton}
                        onClick={() => handleUnassignTechnician(tech.tecnicoId)}
                        disabled={loading}
                      >
                        Quitar
                      </button>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <span className={styles.unassigned}>Sin técnicos asignados</span>
          )}
        </div>

        <div className={styles.section}>
          <h3>Fechas</h3>
          <div className={styles.detailItem}>
            <strong>Solicitado:</strong>
            <span>
              {new Date(currentOrder.fecha_solicitud).toLocaleString()}
            </span>
          </div>
          {currentOrder.fecha_inicio && (
            <div className={styles.detailItem}>
              <strong>Iniciado:</strong>
              <span>
                {new Date(currentOrder.fecha_inicio).toLocaleString()}
              </span>
            </div>
          )}
          {currentOrder.fecha_finalizacion && (
            <div className={styles.detailItem}>
              <strong>Finalizado:</strong>
              <span>
                {new Date(currentOrder.fecha_finalizacion).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {currentOrder.equipos && currentOrder.equipos.length > 0 && (
          <div className={styles.section}>
            <h3>Equipos Asociados</h3>
            <div className={styles.subSection}>
              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Ubicación</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.equipos.map((equipo) => (
                      <tr key={equipo.equipmentId}>
                        <td>{equipo.code || `#${equipo.equipmentId}`}</td>
                        <td>
                          {equipo.subArea?.nombre ? (
                            <span>
                              {equipo.area?.nombre &&
                                `${equipo.area.nombre} - ${equipo.subArea.nombre}`}
                            </span>
                          ) : equipo.area?.nombre ? (
                            <span>{equipo.area.nombre}</span>
                          ) : (
                            <span className={styles.unassigned}>
                              Sin ubicación
                            </span>
                          )}
                        </td>
                        <td>
                          {!isClient && (
                            <Link
                              to={`/equipment/${equipo.equipmentId}`}
                              className={styles.viewEquipmentButton}
                            >
                              Ver Hoja de Vida
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(toolDetails.length > 0 || supplyDetails.length > 0) && !isClient && (
          <div className={styles.section}>
            <h3>Inventario Asignado</h3>
            {toolDetails.length > 0 && (
              <div className={styles.subSection}>
                <h4>Herramientas</h4>
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Marca</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolDetails.map((t) => (
                        <tr key={t.detalleHerramientaId}>
                          <td>{t.nombreHerramienta}</td>
                          <td>{t.marca || "-"}</td>
                          <td>
                            {canAssignInventory && (
                              <button
                                className={styles.deleteIconButton}
                                onClick={() =>
                                  requestReturnTool(t.detalleHerramientaId)
                                }
                                disabled={loading}
                                title="Devolver"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {supplyDetails.length > 0 && (
              <div className={styles.subSection}>
                <h4>Insumos</h4>
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Cant.</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyDetails.map((s) => (
                        <tr key={s.detalleInsumoId}>
                          <td>{s.nombreInsumo}</td>
                          <td>{s.cantidadUsada}</td>
                          <td>
                            {canAssignInventory && (
                              <button
                                className={styles.deleteIconButton}
                                onClick={() =>
                                  requestRemoveSupply(s.detalleInsumoId)
                                }
                                disabled={loading}
                                title="Quitar"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isAirConditioningOrder && hasBeforeInspection && (
        <AcTechnicalDataSection
          acInspections={currentOrder.acInspections}
          equipments={currentOrder.equipos}
          onEquipmentChange={setActiveEquipmentId}
          onEditEquipmentInspection={handleOpenAcInspectionForEquipment}
          estadoOrden={currentOrder.estado}
        />
      )}

      {hasBeforeInspection && (
        <OrderEvidenceSection
          orderId={currentOrder.orden_id}
          canEdit={canEditEvidence}
          orderStatus={currentOrder.estado}
          equipments={currentOrder.equipos}
          activeEquipmentId={activeEquipmentId}
        />
      )}

      <div className={styles.commentsSection}>
        <h3>Comentarios y Observaciones</h3>

        <div className={styles.commentsContainer}>
          {/* 1. Comentario General de la Solicitud */}
          {currentOrder.comentarios && (
            <div className={styles.commentBlock}>
              <div className={styles.commentHeader}>
                <strong>Nota General de la Orden</strong>
              </div>
              <div className={styles.commentContent}>
                <p>{currentOrder.comentarios}</p>
              </div>
            </div>
          )}

          {!currentOrder.comentarios &&
            (!currentOrder.acInspections ||
              currentOrder.acInspections.length === 0) &&
            !currentOrder.images?.some((i) => i.observation) && (
              <p className={styles.unassigned}>
                No hay comentarios ni observaciones registradas para esta orden.
              </p>
            )}
        </div>
      </div>

      {/* ACCIONES */}
      <div className={styles.actions}>
        {canEditOrderDetails && (
          <button
            className={styles.secondaryButton}
            onClick={handleOpenEditModal}
          >
            Editar Orden
          </button>
        )}

        {canAssignInventory && (
          <button
            className={styles.secondaryButton}
            onClick={handleOpenInventoryModal}
          >
            Asignar Herramienta/Insumo
          </button>
        )}

        {canBillingStatus &&
          !currentOrder.estado_pago &&
          currentOrder.estado_facturacion !== "" && (
            <button
              className={styles.secondaryButton}
              onClick={handleOpenBillingModal}
            >
              Asignar Estado de Facturación
            </button>
          )}

        {canCreateEmergency && (
          <button
            className={styles.invoiceButton}
            onClick={handleOpenEmergencyModal}
            disabled={loading}
          >
            Crear Orden de Emergencia
          </button>
        )}

        {canUploadInvoice &&
          currentOrder.estado_facturacion === "Por facturar" && (
            <button
              className={styles.invoiceButton}
              onClick={handleOpenInvoiceModal}
            >
              <span className={styles.buttonIcon}>📎</span>
              Facturar
            </button>
          )}

        {/* Botón para marcar como pagado */}
        {currentOrder.estado_pago === "Por pagar" &&
          currentOrder.factura_pdf_url &&
          isAdminOrSecretaria && (
            <button
              className={styles.payButton}
              onClick={handleMarkAsPaid}
              disabled={loading}
            >
              <span className={styles.payButtonIcon}>✓</span>
              Marcar como Pagado
            </button>
          )}

        {isAdminOrSecretaria &&
          !isReadOnly &&
          currentOrder.estado !== validStatuses.CANCELADA &&
          currentOrder.estado !== validStatuses.COMPLETADO && (
            <div className={styles.adminActions}>
              <button
                className={styles.assignButton}
                onClick={() => setShowAssignForm(true)}
              >
                Asignar Técnico(s)
              </button>
              {normalizedUserRole === "admin" && (
                <button
                  className={styles.rejectButton}
                  onClick={() => setShowRejectForm(true)}
                >
                  Rechazar
                </button>
              )}
            </div>
          )}

        {canTechnicianStartOrder && (
          <button
            className={styles.startButton}
            onClick={handleStartOrderClick}
            disabled={loading}
          >
            Iniciar Orden
          </button>
        )}

        {canPauseOrder && (
          <button
            className={styles.startButton}
            onClick={() => {
              setPauseObservation("");
              setShowPauseModal(true);
            }}
            disabled={loading}
          >
            Pausar Orden
          </button>
        )}

        {canResumeOrder && (
          <button
            className={styles.startButton}
            onClick={() => handleStatusUpdate(validStatuses.EN_PROCESO)}
            disabled={loading}
          >
            Reanudar Orden
          </button>
        )}

        {canTechnicianCompleteOrder && (
          <button
            className={styles.completeButton}
            onClick={handleCompleteOrderClick}
            disabled={loading}
          >
            Completar Orden
          </button>
        )}

        {normalizedUserRole === "cliente" &&
          (currentOrder.estado === validStatuses.PENDIENTE ||
            currentOrder.estado === validStatuses.ASIGNADA) &&
          !isReadOnly && (
            <button
              className={styles.cancelButton}
              onClick={handleCancelOrder}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
      </div>

      {/* MODAL ESTADO DE FACTURACIÓN */}
      {showBillingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Asignar Estado de Facturación</h3>
              <button
                onClick={() => setShowBillingModal(false)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>

            {billingError && <div className={styles.error}>{billingError}</div>}

            <div className={styles.formRow}>
              <label>Estado de Facturación</label>
              <select
                className={styles.technicianSelect}
                value={selectedBillingStatus}
                onChange={(e) =>
                  setSelectedBillingStatus(e.target.value as BillingEstado)
                }
              >
                <option value="">Seleccionar estado...</option>
                <option value="Sin facturar">Sin factura</option>
                <option value="Por facturar">Por facturar</option>
                <option value="Garantía">Garantía</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowBillingModal(false)}
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignBillingStatus}
                disabled={!selectedBillingStatus || loading}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN ORDEN (comentarios + equipos) */}
      <OrderEditModal
        order={currentOrder}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveOrderDetails}
        loading={loading}
        equipments={clientEquipments}
      />

      {/* MODAL SELECTOR DE EQUIPO */}
      <EquipmentSelectionModal
        isOpen={showEqSelector}
        onClose={() => setShowEqSelector(false)}
        equipments={currentOrder.equipos}
        order={currentOrder}
        phase={acPhase}
        onSelect={handleEquipmentSelected}
      />

      {/* MODAL INSPECCIÓN AC (Pasa el equipo seleccionado) */}
      {selectedEquipment && (
        <AcInspectionModal
          order={currentOrder}
          equipment={selectedEquipment}
          phase={acPhase}
          isOpen={showAcInspectionModal}
          onClose={() => setShowAcInspectionModal(false)}
          onSuccess={handleAcInspectionSuccess}
        />
      )}

      <OrderSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSubmit={handleSubmitSignature}
        loading={signatureLoading}
      />

      {/* OTROS MODALES (RECHAZO, PAUSA, INVENTARIO, ETC) */}
      {showRejectForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Rechazar Orden</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={styles.rejectTextarea}
              placeholder="Ingrese el motivo del rechazo..."
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRejectForm(false)}>Cancelar</button>
              <button
                onClick={handleRejectOrder}
                className={styles.rejectButton}
                disabled={!rejectReason.trim() || loading}
              >
                {loading ? "Rechazando..." : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FACTURA */}
      {showInvoiceModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Subir Factura</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>

            {invoiceError && <div className={styles.error}>{invoiceError}</div>}

            <form onSubmit={handleUploadInvoice}>
              {/* SOLO EL SELECT DE ESTADO DE PAGO (NO el de facturación) */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Estado de Pago</label>
                <select
                  className={styles.paymentStatusSelect}
                  value={selectedCostStatus}
                  onChange={(e) =>
                    setSelectedCostStatus(e.target.value as CostEstado)
                  }
                  required
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Por pagar">Por pagar</option>
                </select>
              </div>

              {/* UPLOAD DE ARCHIVO */}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Archivo PDF</label>
                <div className={styles.fileUploadContainer}>
                  <input
                    type="file"
                    id="invoice-file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setInvoiceFile(e.target.files?.[0] || null)
                    }
                    className={styles.fileInput}
                  />
                  <label
                    htmlFor="invoice-file"
                    className={styles.fileInputLabel}
                  >
                    <span className={styles.fileIcon}>📄</span>
                    <span className={styles.fileText}>
                      {invoiceFile
                        ? invoiceFile.name
                        : "Seleccionar archivo PDF"}
                    </span>
                    <span className={styles.fileButton}>Examinar</span>
                  </label>
                </div>
                {invoiceFile && (
                  <div className={styles.filePreview}>
                    <span className={styles.filePreviewIcon}>✓</span>
                    <span className={styles.filePreviewName}>
                      {invoiceFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInvoiceFile(null)}
                      className={styles.fileRemoveButton}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    invoiceLoading || !invoiceFile || !selectedCostStatus
                  }
                  className={styles.submitButton}
                >
                  {invoiceLoading ? "Subiendo..." : "Subir Factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EMERGENCIA */}
      {showEmergencyModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Crear Orden de Emergencia</h3>
            <p className={styles.modalDescription}>
              Esta acción creará una nueva orden de emergencia.
            </p>

            <div className={styles.formRow}>
              <label className={styles.modalSectionTitle}>
                Seleccione los técnicos para la emergencia:
              </label>
              {currentOrder.technicians &&
              currentOrder.technicians.length > 0 ? (
                <div className={styles.scrollBoxSmall}>
                  {currentOrder.technicians.map((tech) => {
                    const isSelected = selectedEmergencyTechnicians.includes(
                      tech.tecnicoId,
                    );
                    return (
                      <label
                        key={tech.tecnicoId}
                        className={`${styles.selectableRow} ${
                          isSelected ? styles.selectableRowSelected : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleEmergencyTechnician(tech.tecnicoId)
                          }
                          className={styles.checkboxInline}
                        />
                        {tech.technician.nombre} {tech.technician.apellido}
                        {tech.isLeader && (
                          <span className={styles.leaderChipSmall}>
                            (Líder actual)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.warning}>
                  La orden original no tiene técnicos asignados.
                </div>
              )}
            </div>

            <div className={styles.formRow}>
              <label>Técnico líder de la emergencia</label>
              <select
                className={styles.technicianSelect}
                value={emergencyLeaderId || ""}
                onChange={(e) => setEmergencyLeaderId(Number(e.target.value))}
              >
                {selectedEmergencyTechnicians.map((techId) => {
                  const tech = currentOrder.technicians?.find(
                    (t) => t.tecnicoId === techId,
                  );
                  return (
                    <option key={techId} value={techId}>
                      {tech?.technician.nombre} {tech?.technician.apellido}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.formRow}>
              <label>Comentario para la orden de emergencia</label>
              <textarea
                className={styles.rejectTextarea}
                value={emergencyComment}
                onChange={(e) => setEmergencyComment(e.target.value)}
                placeholder="Ej: Falla crítica en equipo, prioridad alta..."
              />
            </div>

            <p className={styles.modalSectionTitle}>
              Seleccione los equipos que atenderá en esta emergencia:
            </p>

            {loadingEquipments ? (
              <div className={styles.loading}>Cargando equipos...</div>
            ) : clientEquipments.length === 0 ? (
              <div className={styles.warning}>
                El cliente no tiene equipos registrados.
              </div>
            ) : (
              <div className={styles.scrollBoxLarge}>
                {clientEquipments.map((eq) => {
                  const isSelected = selectedEmergencyEquipments.includes(
                    eq.equipmentId,
                  );
                  return (
                    <div
                      key={eq.equipmentId}
                      className={`${styles.selectableRow} ${
                        isSelected ? styles.selectableRowSelected : ""
                      }`}
                      onClick={() => toggleEmergencyEquipment(eq.equipmentId)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleEmergencyEquipment(eq.equipmentId)
                        }
                        className={styles.checkboxInline}
                      />
                      <div>
                        <strong>
                          {eq.code || `#${eq.equipmentId}`} - {eq.category}
                        </strong>
                        <div className={styles.rowMeta}>
                          {eq.subArea?.nombreSubArea ||
                            eq.area?.nombreArea ||
                            "Sin ubicación"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.modalActions}>
              <button onClick={() => setShowEmergencyModal(false)}>
                Cancelar
              </button>
              <button onClick={confirmEmergencyOrder} disabled={loading}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAUSA */}
      {showPauseModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Pausar Orden</h3>
            <p className={styles.modalDescription}>
              Ingrese el motivo de la pausa (quedará registrado en el
              historial).
            </p>
            <textarea
              className={styles.rejectTextarea}
              value={pauseObservation}
              onChange={(e) => setPauseObservation(e.target.value)}
              placeholder="Ej: Esperando repuestos, cliente no disponible, etc."
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowPauseModal(false)}>Cancelar</button>
              <button
                onClick={() => {
                  handleStatusUpdate(validStatuses.PAUSADA, pauseObservation);
                  setShowPauseModal(false);
                }}
                disabled={loading}
              >
                Confirmar Pausa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INVENTARIO */}
      {showInventoryModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Asignar Herramientas/Insumos</h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            {inventoryLoading && (
              <div className={styles.loading}>
                Cargando inventario disponible...
              </div>
            )}
            {inventoryError && (
              <div className={styles.error}>{inventoryError}</div>
            )}
            {!inventoryLoading && (
              <>
                {inventoryItems.length === 0 ? (
                  <div className={styles.warning}>
                    No hay ítems disponibles en el inventario
                  </div>
                ) : (
                  <>
                    <div className={styles.formRow}>
                      <label>Ítem Disponible</label>
                      <select
                        className={styles.technicianSelect}
                        value={selectedInventoryId}
                        onChange={(e) => {
                          setSelectedInventoryId(
                            Number(e.target.value)
                              ? Number(e.target.value)
                              : "",
                          );
                          setSelectedQuantity(1);
                        }}
                      >
                        <option value="">Seleccionar ítem disponible...</option>
                        {inventoryItems.map((i: InventoryItem) => (
                          <option key={i.inventarioId} value={i.inventarioId}>
                            {i.nombreItem} ({i.tipo}) - Stock:{" "}
                            {i.tipo === "insumo"
                              ? i.cantidadActual
                              : "Disponible"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {inventoryItems.find(
                      (i: InventoryItem) =>
                        i.inventarioId === selectedInventoryId,
                    )?.tipo === "insumo" && (
                      <div className={styles.formRow}>
                        <label>Cantidad a usar</label>
                        <input
                          type="number"
                          min="1"
                          value={selectedQuantity}
                          onChange={(e) =>
                            setSelectedQuantity(Number(e.target.value))
                          }
                        />
                        <small className={styles.helperText}>
                          Máximo disponible:{" "}
                          {inventoryItems.find(
                            (i: InventoryItem) =>
                              i.inventarioId === selectedInventoryId,
                          )?.cantidadActual || 0}
                        </small>
                      </div>
                    )}
                    <div className={styles.formActions}>
                      <button onClick={() => setShowInventoryModal(false)}>
                        Cancelar
                      </button>
                      <button
                        onClick={handleAssignInventoryItem}
                        disabled={!selectedInventoryId || loading}
                      >
                        Guardar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR TÉCNICOS */}
      {showAssignForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Asignar Técnico(s)</h3>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedTechnicians([]);
                  setLeaderTechnicianId(null);
                }}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            <div className={styles.formRow}>
              <label>Seleccionar Técnicos</label>
              <div className={styles.scrollBoxLarge}>
                {technicians.map((t: Usuario) => {
                  const isSelected = selectedTechnicians.includes(t.usuarioId);
                  return (
                    <div
                      key={t.usuarioId}
                      className={`${styles.selectableRow} ${
                        isSelected ? styles.selectableRowSelected : ""
                      }`}
                      onClick={() => toggleTechnicianSelection(t.usuarioId)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTechnicianSelection(t.usuarioId)}
                        className={styles.checkboxInline}
                      />
                      <div className={styles.flexGrow}>
                        <strong>
                          {t.nombre} {t.apellido}
                        </strong>
                        <div className={styles.rowMeta}>{t.email}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedTechnicians.length > 1 && (
              <div className={styles.formRow}>
                <label>Técnico Líder</label>
                <select
                  className={styles.technicianSelect}
                  value={leaderTechnicianId || ""}
                  onChange={(e) =>
                    setLeaderTechnicianId(Number(e.target.value))
                  }
                >
                  {selectedTechnicians.map((techId) => {
                    const tech = technicians.find(
                      (t) => t.usuarioId === techId,
                    );
                    return (
                      <option key={techId} value={techId}>
                        {tech?.nombre} {tech?.apellido}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            <div className={styles.formActions}>
              <button
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedTechnicians([]);
                  setLeaderTechnicianId(null);
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignTechnicians}
                disabled={selectedTechnicians.length === 0 || loading}
              >
                {loading ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CALIFICACIÓN (BLOQUEANTE) */}
      {showRatingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeButtonRating}
              onClick={() => setShowRatingModal(false)}
            >
              X
            </button>
            <div className={styles.ratingModalHeader}>
              <h3>Calificar técnicos de la orden</h3>
              <p>
                Asigna una calificación de 0 a 5 estrellas (con pasos de 0.5)
                para cada técnico.
              </p>
            </div>

            {ratingError && <div className={styles.error}>{ratingError}</div>}

            <div className={styles.ratingList}>
              {currentOrder.technicians?.map((tech) => {
                const value = ratings[tech.tecnicoId] ?? 0;
                const fullStars = Math.floor(value);
                const hasHalf = value - fullStars >= 0.5;

                return (
                  <div key={tech.id} className={styles.ratingTechnicianRow}>
                    <div className={styles.ratingAvatar}>
                      {(tech.technician.nombre?.[0] || "").toUpperCase()}
                      {(tech.technician.apellido?.[0] || "").toUpperCase()}
                    </div>
                    <div className={styles.ratingInfo}>
                      <div className={styles.ratingTechnicianHeader}>
                        {tech.technician.nombre} {tech.technician.apellido}
                      </div>

                      <div className={styles.ratingStars}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const starIndex = index + 1;
                          let starClass = styles.starEmpty;
                          if (starIndex <= fullStars) {
                            starClass = styles.starFull;
                          } else if (starIndex === fullStars + 1 && hasHalf) {
                            starClass = styles.starHalf;
                          }
                          return (
                            <span
                              key={starIndex}
                              className={`${styles.star} ${starClass}`}
                            >
                              ★
                            </span>
                          );
                        })}
                      </div>

                      <div className={styles.ratingSliderWrapper}>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={0.5}
                          value={value}
                          onChange={(e) =>
                            setRatings((prev) => ({
                              ...prev,
                              [tech.tecnicoId]: Number(e.target.value),
                            }))
                          }
                        />
                        <span className={styles.ratingValue}>
                          {value.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleSubmitRatings} disabled={isSavingRatings}>
                {isSavingRatings ? "Guardando..." : "Guardar calificaciones"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE PAGO */}
      {showPaymentConfirmModal && (
        <div className={styles.modal}>
          <div className={styles.confirmationModalContent}>
            <div className={styles.confirmationIconWrapper}>
              <span className={styles.confirmationIcon}>💰</span>
            </div>
            <h3 className={styles.confirmationTitle}>Confirmar Pago</h3>
            <p className={styles.confirmationText}>
              ¿Está seguro de marcar esta orden como pagada?
            </p>
            <div className={styles.confirmationActions}>
              <button
                className={styles.cancelDeleteButton}
                onClick={() => setShowPaymentConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmPayButton}
                onClick={confirmMarkAsPaid}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Procesando...
                  </>
                ) : (
                  "Sí, marcar como pagado"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN BORRADO */}
      {confirmModal.isOpen && (
        <div className={styles.modal}>
          <div className={styles.confirmationModalContent}>
            <span className={styles.confirmationIcon}>⚠️</span>
            <h3>¿Confirmar?</h3>
            <p>Se eliminará el elemento.</p>
            <div className={styles.confirmationActions}>
              <button
                className={styles.cancelDeleteButton}
                onClick={closeConfirmModal}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
