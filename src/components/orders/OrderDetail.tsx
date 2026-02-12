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
} from "../../api/orders";
import { usersApi } from "../../api/users";
import { inventory } from "../../api/inventory";
import { getEquipmentByClientRequest } from "../../api/equipment";
import { useOrderDetail, useOrderMutations } from "../../hooks/useOrders";
import type {
  BillingEstado,
  Order,
  UpdateOrderData,
} from "../../interfaces/OrderInterfaces";
import type { Usuario } from "../../interfaces/UserInterfaces";
import type { Equipment } from "../../interfaces/EquipmentInterfaces";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { Inventory } from "../../interfaces/InventoryInterfaces";
import { playErrorSound } from "../../utils/sounds";
import { useAuth } from "../../hooks/useAuth";

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

export default function OrderDetail({
  order: initialOrderData,
  onBack,
  userRole,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { order } = useOrderDetail(initialOrderData.orden_id, initialOrderData);
  const currentOrder = order || initialOrderData;
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

  // Quién puede calificar técnicos
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
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | "">(
    "",
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedBillingStatus, setSelectedBillingStatus] =
    useState<BillingEstado>("");
  const [billingError, setBillingError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: null,
    id: null,
  });

  // --- Modal Emergencia ---
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [clientEquipments, setClientEquipments] = useState<Equipment[]>([]);
  const [selectedEmergencyEquipments, setSelectedEmergencyEquipments] =
    useState<number[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [selectedEmergencyTechId, setSelectedEmergencyTechId] = useState<
    number | null
  >(null);

  // --- Modal Pausa ---
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseObservation, setPauseObservation] = useState("");

  const supplyDetails = currentOrder.supplyDetails ?? [];
  const toolDetails = currentOrder.toolDetails ?? [];

  // --- Rating ---
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [pendingPostRatingAction, setPendingPostRatingAction] =
    useState<PendingPostRatingAction>(null);
  const [showRatingNotice, setShowRatingNotice] = useState(false);

  const isSavingRatings = rateTechnicians.status === "pending";

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

  const refreshData = async () => {
    queryClient.invalidateQueries({
      queryKey: ["orderDetail", currentOrder.orden_id],
    });
    queryClient.invalidateQueries({ queryKey: ["dashboardOrders"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  // --- Emergencia ---
  const handleOpenEmergencyModal = async () => {
    setShowEmergencyModal(true);
    setLoadingEquipments(true);
    setSelectedEmergencyEquipments([]);

    const currentTechs = currentOrder.technicians || [];
    if (currentTechs.length === 1) {
      setSelectedEmergencyTechId(currentTechs[0].tecnicoId);
    } else {
      setSelectedEmergencyTechId(null);
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

  const toggleEmergencyEquipment = (eqId: number) => {
    setSelectedEmergencyEquipments((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId],
    );
  };

  const confirmEmergencyOrder = async () => {
    if (!selectedEmergencyTechId) {
      alert("Debe seleccionar un técnico para la emergencia.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const equipmentIds = selectedEmergencyEquipments;

      const emergencyOrder = await createEmergencyOrderRequest(
        currentOrder.orden_id,
        {
          technicianIds: [selectedEmergencyTechId],
          leaderTechnicianId: selectedEmergencyTechId,
          equipmentIds,
          comentarios: `Emergencia creada desde orden ${currentOrder.orden_id}`,
        },
      );

      await refreshData();
      setShowEmergencyModal(false);
      navigate(`/orders?ordenId=${emergencyOrder.orden_id}`);
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

  // --- Estados y actualizaciones ---
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
    setInvoiceLoading(true);
    setInvoiceError(null);
    try {
      await uploadInvoiceRequest(currentOrder.orden_id, invoiceFile);
      await refreshData();
      setShowInvoiceModal(false);
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
      const availableItems = data.filter((item: Inventory) => {
        const estadoNormalizado =
          item.tool?.estado?.toLowerCase().trim() ||
          item.supply?.estado?.toLowerCase().trim();
        return estadoNormalizado === "disponible";
      });
      setInventoryItems(availableItems);
    } catch (err) {
      setInventoryError("Error cargando inventario");
    } finally {
      setInventoryLoading(false);
    }
  };

  // ---- Lógica de rating: detección de necesidad de calificar ----
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

  const openRatingModal = (action: PendingPostRatingAction) => {
    if (!currentOrder.technicians || currentOrder.technicians.length === 0)
      return;
    const initialRatings: Record<number, number> = {};
    currentOrder.technicians.forEach((t) => {
      // Si en el futuro ya hubiera rating previo, se podría prellenar
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

  const isEquipmentCategory = [
    "Aires Acondicionados",
    "Redes Eléctricas",
    "Redes Contra Incendios",
  ].includes(currentOrder.servicio.categoria_servicio || "");

  const isReadOnly = currentOrder.estado_facturacion === "Facturado";

  const canUploadInvoice =
    isAdminOrSecretaria &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    currentOrder.estado_facturacion === "Por facturar" &&
    !isReadOnly;

  const canAssignInventory =
    (isAdminOrSecretaria || isTechnician) &&
    !isReadOnly &&
    currentOrder.estado !== validStatuses.CANCELADA &&
    currentOrder.estado !== validStatuses.RECHAZADA;

  const canBillingStatus =
    isAdminOrSecretaria &&
    !isReadOnly &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    currentOrder.estado_facturacion === "";

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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
    isAdminOrSecretaria &&
    !isReadOnly &&
    (currentOrder.estado === validStatuses.ASIGNADA ||
      currentOrder.estado === validStatuses.EN_PROCESO);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
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
          {currentOrder.estado_facturacion !== "" && (
            <span
              className={`${styles.billingBadge} ${getBillingColor(
                currentOrder.estado_facturacion,
              )}`}
            >
              {currentOrder.estado_facturacion}
            </span>
          )}
          {currentOrder.factura_pdf_url && (
            <a
              href={`${apiUrl}${currentOrder.factura_pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className={styles.invoiceLinkButton}
            >
              Ver Factura
            </a>
          )}
        </div>
      </div>

      {/* Notificación tipo "push" en el centro cuando hay calificación pendiente */}
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

        {(toolDetails.length > 0 || supplyDetails.length > 0) && (
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

      {isEquipmentCategory && (
        <div className={styles.problemSection}>
          <h3>Equipo y Hoja de Vida</h3>
          <p>
            {currentOrder.servicio.tipo_trabajo === "Instalación"
              ? !currentOrder.equipos || currentOrder.equipos.length === 0
                ? "Instalación sin hoja de vida asociada."
                : `Instalación con ${currentOrder.equipos.length} equipo${
                    currentOrder.equipos.length !== 1 ? "s" : ""
                  } asociado${currentOrder.equipos.length !== 1 ? "s" : ""}.`
              : !currentOrder.equipos || currentOrder.equipos.length === 0
                ? "Mantenimiento sin hoja de vida asociada."
                : `Mantenimiento con ${currentOrder.equipos.length} equipo${
                    currentOrder.equipos.length !== 1 ? "s" : ""
                  } asociado${currentOrder.equipos.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      )}

      {currentOrder.comentarios && (
        <div className={styles.commentsSection}>
          <h3>Comentarios</h3>
          <p>{currentOrder.comentarios}</p>
        </div>
      )}

      {/* ACCIONES */}
      <div className={styles.actions}>
        {canAssignInventory && (
          <button
            className={styles.secondaryButton}
            onClick={handleOpenInventoryModal}
          >
            Asignar Herramienta/Insumo
          </button>
        )}

        {canBillingStatus && (
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

        {canUploadInvoice && (
          <button
            className={styles.invoiceButton}
            onClick={handleOpenInvoiceModal}
          >
            Facturar
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
            onClick={() => handleStatusUpdate(validStatuses.EN_PROCESO)}
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
            onClick={() => handleStatusUpdate(validStatuses.COMPLETADO)}
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

      {/* MODAL CALIFICACIÓN (BLOQUEANTE) */}
      {showRatingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.ratingModalHeader}>
              <h3>Calificar técnicos de la orden</h3>
              <p>
                Asigna una calificación de 0 a 5 estrellas (con pasos de 0.5)
                para cada técnico. Esta acción es obligatoria antes de facturar.
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
                        {tech.isLeader && (
                          <span className={styles.leaderChip}>Líder</span>
                        )}
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

      {/* MODALS RESTO */}
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
                        {inventoryItems.map((i: Inventory) => (
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
                      (i: Inventory) => i.inventarioId === selectedInventoryId,
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
                            (i: Inventory) =>
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
              <small className={styles.helperText}>
                Seleccione uno o más técnicos para asignar a esta orden.
              </small>
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
                <small className={styles.helperText}>
                  El líder será el responsable principal de la orden.
                </small>
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

      {showInvoiceModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Subir Factura</h3>
            {invoiceError && <div className={styles.error}>{invoiceError}</div>}
            <form onSubmit={handleUploadInvoice}>
              <div className={styles.formRow}>
                <label>Archivo PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={invoiceLoading || !invoiceFile}>
                  Subir
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

            {currentOrder.technicians && currentOrder.technicians.length > 1 ? (
              <div className={styles.formRow}>
                <label className={styles.modalSectionTitle}>
                  Seleccione el técnico para la emergencia:
                </label>
                <div className={styles.scrollBoxSmall}>
                  {currentOrder.technicians.map((tech) => {
                    const isSelected =
                      selectedEmergencyTechId === tech.tecnicoId;
                    return (
                      <label
                        key={tech.tecnicoId}
                        className={`${styles.selectableRow} ${
                          isSelected ? styles.selectableRowSelected : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="emergencyTech"
                          value={tech.tecnicoId}
                          checked={isSelected}
                          onChange={() =>
                            setSelectedEmergencyTechId(tech.tecnicoId)
                          }
                          className={styles.checkboxInline}
                        />
                        {tech.technician.nombre} {tech.technician.apellido}
                        {tech.isLeader && (
                          <span className={styles.leaderChipSmall}>
                            (Líder)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={styles.warning}>
                <p>
                  El técnico actual{" "}
                  <strong>
                    {currentOrder.technicians?.[0]?.technician.nombre}
                  </strong>{" "}
                  será asignado a la emergencia.
                </p>
              </div>
            )}

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
              <button onClick={() => setShowBillingModal(false)}>
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
    </div>
  );
}
