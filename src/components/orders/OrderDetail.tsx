import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  updateOrderRequest,
  cancelOrderRequest,
  rejectOrderRequest,
  assignTechnicianRequest,
  uploadInvoiceRequest,
  unassignTechnicianRequest,
  addSupplyDetailRequest,
  addToolDetailRequest,
  removeToolDetailRequest,
  removeSupplyDetailRequest,
} from "../../api/orders";
import { usersApi } from "../../api/users";
import { inventory } from "../../api/inventory";
import { useOrderDetail } from "../../hooks/useOrders";
import type { Order, UpdateOrderData } from "../../interfaces/OrderInterfaces";
import type { Usuario } from "../../interfaces/UserInterfaces";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { Inventory } from "../../interfaces/InventoryInterfaces";
import { playErrorSound } from "../../utils/sounds";

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
  return lowerRole;
};

export default function OrderDetail({
  order: initialOrderData,
  onBack,
  userRole,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { order } = useOrderDetail(initialOrderData.orden_id, initialOrderData);
  const currentOrder = order || initialOrderData;

  // Normalizar el rol para uso interno
  const normalizedUserRole = normalizeUserRole(userRole);

  const isClient = normalizedUserRole === "cliente";
  const isTechnician = normalizedUserRole === "tecnico";
  const isAdminOrSecretaria =
    normalizedUserRole === "admin" || normalizedUserRole === "secretaria";

  // Agregar "Asignada" al validStatuses
  const validStatuses = {
    PENDIENTE: "Pendiente" as const,
    ASIGNADA: "Asignada" as const,
    EN_PROCESO: "En Proceso" as const,
    COMPLETADO: "Completado" as const,
    CANCELADA: "Cancelada" as const,
    RECHAZADA: "Rechazada" as const,
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(
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

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: null,
    id: null,
  });

  const supplyDetails = currentOrder.supplyDetails ?? [];
  const toolDetails = currentOrder.toolDetails ?? [];

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

  const refreshData = async () => {
    queryClient.invalidateQueries({
      queryKey: ["orderDetail", currentOrder.orden_id],
    });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const handleStatusUpdate = async (newStatus: Order["estado"]) => {
    setLoading(true);
    try {
      const updateData: UpdateOrderData = { estado: newStatus };
      if (newStatus === validStatuses.EN_PROCESO)
        updateData.fecha_inicio = new Date().toISOString();
      else if (newStatus === validStatuses.COMPLETADO)
        updateData.fecha_finalizacion = new Date().toISOString();

      await updateOrderRequest(currentOrder.orden_id, updateData);
      await refreshData();
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al actualizar orden");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;
    setLoading(true);
    try {
      await assignTechnicianRequest(currentOrder.orden_id, selectedTechnician);
      await refreshData();
      setShowAssignForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al asignar técnico");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTechnician = async () => {
    setLoading(true);
    try {
      await unassignTechnicianRequest(currentOrder.orden_id);
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
    try {
      await cancelOrderRequest(currentOrder.orden_id);
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
      // Filtrar solo los ítems con estado "Disponible"
      const availableItems = data.filter((item: Inventory) => {
        const estadoNormalizado = item.tool?.estado?.toLowerCase().trim() || item.supply?.estado?.toLowerCase().trim();
        return estadoNormalizado === "disponible";
      });
      setInventoryItems(availableItems);
    } catch (err) {
      setInventoryError("Error cargando inventario");
    } finally {
      setInventoryLoading(false);
    }
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

  const getStatusColor = (st: string) => {
    if (st === validStatuses.PENDIENTE || st === validStatuses.ASIGNADA)
      return styles.statusPending;
    if (st === validStatuses.EN_PROCESO) return styles.statusInProgress;
    if (st === validStatuses.COMPLETADO) return styles.statusCompleted;
    if (st === validStatuses.CANCELADA) return styles.statusCancelled;
    if (st === validStatuses.RECHAZADA) return styles.statusRejected;
    return styles.statusPending;
  };

  const getBillingColor = (st: string) =>
    st === "Facturado" ? styles.billingBilled : styles.billingNotBilled;

  const isEquipmentCategory = [
    "Aires Acondicionados",
    "Redes Eléctricas",
    "Redes Contra Incendios",
  ].includes(currentOrder.servicio.categoria_servicio || "");

  const isReadOnly = currentOrder.estado_facturacion === "Facturado";

  const canUploadInvoice =
    isAdminOrSecretaria &&
    currentOrder.estado === validStatuses.COMPLETADO &&
    !isReadOnly;

  const canAssignInventory =
    (isAdminOrSecretaria || isTechnician) &&
    !isReadOnly &&
    currentOrder.estado !== validStatuses.CANCELADA &&
    currentOrder.estado !== validStatuses.RECHAZADA;

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Verificar si el técnico puede iniciar la orden
  const canTechnicianStartOrder =
    isTechnician &&
    !isReadOnly &&
    currentOrder.tecnico &&
    (currentOrder.estado === validStatuses.PENDIENTE ||
      currentOrder.estado === validStatuses.ASIGNADA);

  const canTechnicianCompleteOrder =
    isTechnician &&
    !isReadOnly &&
    currentOrder.estado === validStatuses.EN_PROCESO;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1>Orden de Servicio #{currentOrder.orden_id}</h1>
        <div className={styles.statusRow}>
          <span
            className={`${styles.statusBadge} ${getStatusColor(currentOrder.estado)}`}
          >
            {currentOrder.estado}
          </span>
          <span
            className={`${styles.billingBadge} ${getBillingColor(currentOrder.estado_facturacion)}`}
          >
            {currentOrder.estado_facturacion}
          </span>
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
            <strong>Cliente:</strong>
            <span>
              {currentOrder.cliente.nombre} {currentOrder.cliente.apellido}
            </span>
          </div>
          <div className={styles.detailItem}>
            <strong>Teléfono:</strong>
            <span>
              {currentOrder.cliente_empresa?.telefono ||
                currentOrder.cliente.telefono}
            </span>
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

          {/* NUEVO: Campo Clase de Mantenimiento */}
          {currentOrder.maintenance_type && (
            <div className={styles.detailItem}>
              <strong>Clase:</strong>
              <span style={{ fontWeight: "bold", color: "#0284c7" }}>
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
          <h3>Técnico</h3>
          {currentOrder.tecnico ? (
            <div className={styles.detailItem}>
              <strong>Nombre:</strong>
              <span>
                {currentOrder.tecnico.nombre} {currentOrder.tecnico.apellido}
              </span>
            </div>
          ) : (
            <span className={styles.unassigned}>Sin asignar</span>
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.equipos.map((equipo) => (
                      <tr key={equipo.equipmentId}>
                        <td>{equipo.code || `#${equipo.equipmentId}`}</td>
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
                : `Instalación con ${currentOrder.equipos.length} equipo${currentOrder.equipos.length !== 1 ? "s" : ""} asociado${currentOrder.equipos.length !== 1 ? "s" : ""}.`
              : !currentOrder.equipos || currentOrder.equipos.length === 0
                ? "Mantenimiento sin hoja de vida asociada."
                : `Mantenimiento con ${currentOrder.equipos.length} equipo${currentOrder.equipos.length !== 1 ? "s" : ""} asociado${currentOrder.equipos.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      )}

      {currentOrder.comentarios && (
        <div className={styles.commentsSection}>
          <h3>Comentarios</h3>
          <p>{currentOrder.comentarios}</p>
        </div>
      )}

      <div className={styles.actions}>
        {currentOrder.cliente_empresa && !isClient && (
          <button
            className={styles.secondaryButton}
            onClick={() =>
              navigate("/equipment", {
                state: { clientId: currentOrder.cliente_empresa?.id_cliente },
              })
            }
          >
            Ver equipos
          </button>
        )}

        {canAssignInventory && (
          <button
            className={styles.secondaryButton}
            onClick={handleOpenInventoryModal}
          >
            Asignar H/I
          </button>
        )}
        {canUploadInvoice && (
          <button
            className={styles.invoiceButton}
            onClick={() => setShowInvoiceModal(true)}
          >
            Facturar
          </button>
        )}

        {isAdminOrSecretaria &&
          !isReadOnly &&
          currentOrder.estado !== validStatuses.CANCELADA && (
            <div className={styles.adminActions}>
              <button
                className={styles.assignButton}
                onClick={() => setShowAssignForm(true)}
              >
                Asignar Técnico
              </button>
              {normalizedUserRole === "admin" && (
                <button
                  className={styles.rejectButton}
                  onClick={() => setShowRejectForm(true)}
                >
                  Rechazar
                </button>
              )}
              {currentOrder.tecnico &&
                (currentOrder.estado === validStatuses.PENDIENTE ||
                  currentOrder.estado === validStatuses.ASIGNADA) && (
                  <button
                    className={styles.cancelButton}
                    onClick={handleUnassignTechnician}
                  >
                    Quitar Técnico
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

      {/* MODALS */}
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
              <div className={styles.loading}>Cargando inventario disponible...</div>
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
                            Number(e.target.value) ? Number(e.target.value) : ""
                          );
                          setSelectedQuantity(1);
                        }}
                      >
                        <option value="">Seleccionar ítem disponible...</option>
                        {inventoryItems.map((i: Inventory) => (
                          <option key={i.inventarioId} value={i.inventarioId}>
                            {i.nombreItem} ({i.tipo}) - Stock: {
                              i.tipo === "insumo" ? i.cantidadActual : "Disponible"
                            }
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {inventoryItems.find(
                      (i: Inventory) => i.inventarioId === selectedInventoryId
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
                          Máximo disponible: {
                            inventoryItems.find((i: Inventory) => i.inventarioId === selectedInventoryId)?.cantidadActual || 0
                          }
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
            <h3>Asignar Técnico</h3>
            <select
              className={styles.technicianSelect}
              onChange={(e) => setSelectedTechnician(Number(e.target.value))}
            >
              <option value="">Seleccionar...</option>
              {technicians.map((t: Usuario) => (
                <option key={t.usuarioId} value={t.usuarioId}>
                  {t.nombre} {t.apellido}
                </option>
              ))}
            </select>
            <div className={styles.modalActions}>
              <button onClick={() => setShowAssignForm(false)}>Cancelar</button>
              <button onClick={handleAssignTechnician}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showRejectForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Rechazar</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={styles.rejectTextarea}
              placeholder="Motivo..."
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRejectForm(false)}>Cancelar</button>
              <button
                onClick={handleRejectOrder}
                className={styles.rejectButton}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
      {showInvoiceModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Factura</h3>
            {invoiceError && <div className={styles.error}>{invoiceError}</div>}
            <form onSubmit={handleUploadInvoice}>
              <div className={styles.formRow}>
                <label>PDF</label>
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
                <button type="submit" disabled={invoiceLoading}>
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}