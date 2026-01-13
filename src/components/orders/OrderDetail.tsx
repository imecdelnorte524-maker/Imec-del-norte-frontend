// src/components/orders/OrderDetail.tsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  updateOrderRequest,
  cancelOrderRequest,
  rejectOrderRequest,
  assignTechnicianRequest,
  uploadInvoiceRequest,
  unassignTechnicianRequest,
  getOrderByIdRequest,
  addSupplyDetailRequest,
  addToolDetailRequest,
  removeToolDetailRequest,
} from "../../api/orders";
import { usersApi } from "../../api/users";
import { inventory } from "../../api/inventory";
import type {
  Order,
  UpdateOrderData,
  SupplyDetail,
  ToolDetail,
} from "../../interfaces/OrderInterfaces";
import type { Usuario } from "../../interfaces/UserInterfaces";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { Inventory } from "../../interfaces/InventoryInterfaces";
import { playErrorSound } from "../../utils/sounds";

interface Props {
  order: Order;
  onBack: () => void;
  userRole: "cliente" | "tecnico" | "admin" | "secretaria";
}

export default function OrderDetail({ order, onBack, userRole }: Props) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");

  const [technicians, setTechnicians] = useState<Usuario[]>([]);
  const [techLoading, setTechLoading] = useState(false);
  const [techError, setTechError] = useState<string | null>(null);

  // Facturación
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Detalles de insumos y herramientas asignados (desde backend)
  const [supplyDetails, setSupplyDetails] = useState<SupplyDetail[]>(
    order.supplyDetails ?? []
  );
  const [toolDetails, setToolDetails] = useState<ToolDetail[]>(
    order.toolDetails ?? []
  );

  // Modal asignar herramientas/insumos
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<Inventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | "">(
    ""
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const isClient = userRole === 'cliente';

  // Estados válidos del frontend
  const validStatuses = {
    PENDIENTE: "Pendiente" as const,
    EN_PROCESO: "En Proceso" as const,
    COMPLETADO: "Completado" as const,
    CANCELADA: "Cancelada" as const,
    RECHAZADA: "Rechazada" as const,
  };

  // Cargar técnicos desde backend (Admin y Secretaria)
  useEffect(() => {
    if (userRole !== "admin" && userRole !== "secretaria") return;

    const loadTechnicians = async () => {
      try {
        setTechLoading(true);
        setTechError(null);
        const data = await usersApi.getTechnicians();
        setTechnicians(data);
      } catch (err: any) {
        console.error("Error cargando técnicos:", err);
        setTechError(
          err.response?.data?.message || "Error al cargar la lista de técnicos"
        );
      } finally {
        setTechLoading(false);
      }
    };

    loadTechnicians();
  }, [userRole]);

  // Sincronizar detalles cuando cambie la orden recibida por props
  useEffect(() => {
    setSupplyDetails(order.supplyDetails ?? []);
    setToolDetails(order.toolDetails ?? []);
  }, [order]);

  const reloadOrderDetails = async () => {
    try {
      const updated = await getOrderByIdRequest(order.orden_id);
      setSupplyDetails(updated.supplyDetails ?? []);
      setToolDetails(updated.toolDetails ?? []);
    } catch (err) {
      console.error("Error recargando detalles de la orden:", err);
    }
  };

  const handleStatusUpdate = async (newStatus: Order["estado"]) => {
    setLoading(true);
    try {
      const updateData: UpdateOrderData = { estado: newStatus };

      if (newStatus === validStatuses.EN_PROCESO) {
        updateData.fecha_inicio = new Date().toISOString();
      } else if (newStatus === validStatuses.COMPLETADO) {
        updateData.fecha_finalizacion = new Date().toISOString();
      }

      await updateOrderRequest(order.orden_id, updateData);
      onBack();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al actualizar la orden"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) return;

    setLoading(true);
    try {
      await assignTechnicianRequest(order.orden_id, selectedTechnician);
      setShowAssignForm(false);
      onBack();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al asignar técnico"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignTechnician = async () => {
    if (!order.tecnico) return;

    setLoading(true);
    try {
      await unassignTechnicianRequest(order.orden_id);
      onBack();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al quitar el técnico de la orden"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectReason.trim()) return;

    setLoading(true);
    try {
      await rejectOrderRequest(order.orden_id, rejectReason);
      setShowRejectForm(false);
      onBack();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al rechazar la orden"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("¿Está seguro de que desea cancelar esta orden?"))
      return;

    setLoading(true);
    try {
      await cancelOrderRequest(order.orden_id);
      onBack();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cancelar la orden"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleUploadInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceFile) {
      setInvoiceError("Debe seleccionar un archivo PDF");
      return;
    }

    setInvoiceLoading(true);
    setInvoiceError(null);

    try {
      await uploadInvoiceRequest(order.orden_id, invoiceFile);
      setShowInvoiceModal(false);
      onBack(); // refrescamos vista volviendo al listado
    } catch (err: any) {
      console.error("Error subiendo factura:", err);
      setInvoiceError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al subir la factura"
      );
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
      setInventoryItems(data);
    } catch (err: any) {
      console.error("Error cargando inventario:", err);
      setInventoryError(
        err.response?.data?.message || "Error al cargar el inventario"
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleAssignInventoryItem = async () => {
    if (!selectedInventoryId) {
      setInventoryError("Debe seleccionar un ítem de inventario");
      return;
    }

    const selected = inventoryItems.find(
      (i) => i.inventarioId === selectedInventoryId
    );

    if (!selected) {
      setInventoryError("Ítem de inventario no encontrado");
      return;
    }

    setInventoryError(null);
    setLoading(true);

    try {
      if (selected.tipo === "insumo") {
        if (!selected.supply) {
          setInventoryError("Datos incompletos del insumo seleccionado");
          return;
        }

        if (!selectedQuantity || selectedQuantity <= 0) {
          setInventoryError("La cantidad debe ser mayor que cero");
          return;
        }

        if (selectedQuantity > selected.cantidadActual) {
          setInventoryError(
            `No hay stock suficiente. Stock actual: ${selected.cantidadActual}`
          );
          return;
        }

        await addSupplyDetailRequest(order.orden_id, {
          insumoId: selected.supply.insumoId,
          cantidadUsada: selectedQuantity,
        });
      } else {
        // herramienta
        if (!selected.tool) {
          setInventoryError("Datos incompletos de la herramienta seleccionada");
          return;
        }

        await addToolDetailRequest(order.orden_id, {
          herramientaId: selected.tool.herramientaId,
        });
      }

      await reloadOrderDetails();
      setShowInventoryModal(false);
      setSelectedInventoryId("");
      setSelectedQuantity(1);
    } catch (err: any) {
      console.error("Error asignando inventario a la orden:", err);
      setInventoryError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Error al asignar el ítem a la orden"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturnTool = async (detalleHerramientaId: number) => {
    if (
      !window.confirm(
        "¿Confirma que la herramienta fue devuelta a bodega para esta orden?"
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await removeToolDetailRequest(order.orden_id, detalleHerramientaId);
      await reloadOrderDetails();
    } catch (err: any) {
      console.error("Error devolviendo herramienta:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al devolver la herramienta"
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case validStatuses.PENDIENTE:
        return styles.statusPending;
      case validStatuses.EN_PROCESO:
        return styles.statusInProgress;
      case validStatuses.COMPLETADO:
        return styles.statusCompleted;
      case validStatuses.CANCELADA:
        return styles.statusCancelled;
      case validStatuses.RECHAZADA:
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  const getBillingColor = (estadoFact: Order["estado_facturacion"]) => {
    return estadoFact === "Facturado"
      ? styles.billingBilled
      : styles.billingNotBilled;
  };

  // Lógica de equipo / tipo de servicio
  const categoria = order.servicio.categoria_servicio || "";
  const tipoTrabajo = order.servicio.tipo_trabajo || "";
  const tipoMantenimiento = order.servicio.tipo_mantenimiento || "";

  const isEquipmentCategory = [
    "Aires Acondicionados",
    "Redes Eléctricas",
    "Redes Contra Incendios",
  ].includes(categoria);

  const isInstallation = tipoTrabajo === "Instalación";
  const isMaintenance = tipoTrabajo === "Mantenimiento";
  const hasEquipment = !!order.equipo;

  const isBilled = order.estado_facturacion === "Facturado";
  const isReadOnly = isBilled;

  const canUploadInvoice =
    (userRole === "admin" || userRole === "secretaria") &&
    order.estado === validStatuses.COMPLETADO &&
    order.estado_facturacion === "No facturado";

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const canAssignInventory =
    (userRole === "admin" ||
      userRole === "secretaria" ||
      userRole === "tecnico") &&
    !isReadOnly &&
    order.estado !== validStatuses.CANCELADA &&
    order.estado !== validStatuses.RECHAZADA;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1>Orden de Servicio #{order.orden_id}</h1>
        <div className={styles.statusRow}>
          <span
            className={styles.statusBadge + " " + getStatusColor(order.estado)}
          >
            {order.estado}
          </span>
          <span
            className={
              styles.billingBadge +
              " " +
              getBillingColor(order.estado_facturacion)
            }
          >
            {order.estado_facturacion}
          </span>
          {order.factura_pdf_url && (
            <a
              href={`${apiUrl}${order.factura_pdf_url}`}
              target="_blank"
              rel="noreferrer"
              className={styles.invoiceLinkButton}
            >
              Ver factura PDF
            </a>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Información principal */}
      <div className={styles.detailsGrid}>
        <div className={styles.section}>
          <h3>Información del Cliente</h3>
          {order.cliente_empresa && (
            <>
              <div className={styles.detailItem}>
                <strong>Empresa:</strong>
                <span>{order.cliente_empresa.nombre}</span>
              </div>
              <div className={styles.detailItem}>
                <strong>NIT:</strong>
                <span>{order.cliente_empresa.nit}</span>
              </div>
            </>
          )}
          <div className={styles.detailItem}>
            <strong>Cliente (persona):</strong>
            <span>
              {order.cliente.nombre} {order.cliente.apellido}
            </span>
          </div>
          <div className={styles.detailItem}>
            <strong>Email:</strong>
            <span>{order.cliente.email}</span>
          </div>
          <div className={styles.detailItem}>
            <strong>Teléfono:</strong>
            <span>
              {order.cliente_empresa?.telefono ||
                order.cliente.telefono ||
                "No proporcionado"}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Información del Servicio</h3>
          <div className={styles.detailItem}>
            <strong>Servicio:</strong>
            <span>{order.servicio.nombre_servicio}</span>
          </div>
          <div className={styles.detailItem}>
            <strong>Descripción:</strong>
            <span>{order.servicio.descripcion || "Sin descripción"}</span>
          </div>
          {order.servicio.categoria_servicio && (
            <div className={styles.detailItem}>
              <strong>Categoría:</strong>
              <span>{order.servicio.categoria_servicio}</span>
            </div>
          )}
          {order.servicio.tipo_trabajo && (
            <div className={styles.detailItem}>
              <strong>Tipo de trabajo:</strong>
              <span>{order.servicio.tipo_trabajo}</span>
            </div>
          )}
          {order.servicio.tipo_mantenimiento && (
            <div className={styles.detailItem}>
              <strong>Tipo de mantenimiento:</strong>
              <span>{order.servicio.tipo_mantenimiento}</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3>Técnico Asignado</h3>
          {order.tecnico ? (
            <div className={styles.detailItem}>
              <strong>Técnico:</strong>
              <span>
                {order.tecnico.nombre} {order.tecnico.apellido}
              </span>
            </div>
          ) : (
            <div className={styles.detailItem}>
              <strong>Técnico:</strong>
              <span className={styles.unassigned}>Sin asignar</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3>Fechas</h3>
          <div className={styles.detailItem}>
            <strong>Solicitado:</strong>
            <span>{new Date(order.fecha_solicitud).toLocaleString()}</span>
          </div>
          {order.fecha_inicio && (
            <div className={styles.detailItem}>
              <strong>Iniciado:</strong>
              <span>{new Date(order.fecha_inicio).toLocaleString()}</span>
            </div>
          )}
          {order.fecha_finalizacion && (
            <div className={styles.detailItem}>
              <strong>Finalizado:</strong>
              <span>{new Date(order.fecha_finalizacion).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Equipo asociado */}
        {order.equipo && (
          <div className={styles.section}>
            <h3>Equipo Asociado</h3>
            <div className={styles.detailItem}>
              <strong>Nombre:</strong>
              <span>{order.equipo.nombre}</span>
            </div>
            {order.equipo.codigo && (
              <div className={styles.detailItem}>
                <strong>Código:</strong>
                <span>{order.equipo.codigo}</span>
              </div>
            )}
            {order.equipo.categoria && (
              <div className={styles.detailItem}>
                <strong>Categoría:</strong>
                <span>{order.equipo.categoria}</span>
              </div>
            )}
            { !isClient && (<Link
              to={`/equipment/${order.equipo.equipo_id}`}
              className={styles.viewEquipmentButton}
            >
              Ver hoja de vida completa
            </Link>)}
          </div>
        )}

        {/* Herramientas e insumos asignados */}
        {(toolDetails.length > 0 || supplyDetails.length > 0) && (
          <div className={styles.section}>
            <h3>Herramientas e Insumos Asignados</h3>

            {toolDetails.length > 0 && (
              <div className={styles.subSection}>
                <h4>Herramientas</h4>
                <div className={styles.itemsTableWrapper}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>Herramienta</th>
                        <th>Marca</th>
                        <th>Tiempo de uso</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {toolDetails.map((detail) => (
                        <tr key={detail.detalleHerramientaId}>
                          <td>{detail.nombreHerramienta}</td>
                          <td>{detail.marca || "-"}</td>
                          <td>{detail.tiempoUso || "-"}</td>
                          <td>
                            {!isReadOnly &&
                              order.estado === validStatuses.EN_PROCESO &&
                              (userRole === "tecnico" ||
                                userRole === "admin" ||
                                userRole === "secretaria") && (
                                <button
                                  type="button"
                                  className={styles.smallSecondaryButton}
                                  onClick={() =>
                                    handleReturnTool(
                                      detail.detalleHerramientaId
                                    )
                                  }
                                  disabled={loading}
                                >
                                  Devolver herramienta
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
                        <th>Insumo</th>
                        <th>Cantidad usada</th>
                        <th>Costo unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyDetails.map((detail) => (
                        <tr key={detail.detalleInsumoId}>
                          <td>{detail.nombreInsumo}</td>
                          <td>{detail.cantidadUsada}</td>
                          <td>
                            {detail.costoUnitarioAlMomento != null
                              ? `$ ${detail.costoUnitarioAlMomento.toLocaleString()}`
                              : "-"}
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

      {/* Información sobre hoja de vida */}
      {isEquipmentCategory && (
        <div className={styles.problemSection}>
          <h3>Equipo y Hoja de Vida</h3>
          {isInstallation && !hasEquipment && (
            <p>
              Esta orden corresponde a una <strong>Instalación</strong> de un
              equipo ({categoria}) y todavía no tiene una hoja de vida asociada.
            </p>
          )}
          {isInstallation && hasEquipment && (
            <p>
              Esta orden corresponde a una <strong>Instalación</strong> y ya
              tiene un equipo asociado a su hoja de vida.
            </p>
          )}
          {isMaintenance && hasEquipment && (
            <p>
              Esta orden corresponde a un{" "}
              <strong>
                Mantenimiento{tipoMantenimiento ? ` ${tipoMantenimiento}` : ""}
              </strong>{" "}
              de un equipo ({categoria}) y tiene hoja de vida asociada.
            </p>
          )}
          {isMaintenance && !hasEquipment && (
            <p>
              Esta orden corresponde a un{" "}
              <strong>
                Mantenimiento
                {tipoMantenimiento ? ` ${tipoMantenimiento}` : ""}
              </strong>{" "}
              de un equipo ({categoria}), pero aún no hay una hoja de vida
              asociada.
            </p>
          )}
        </div>
      )}

      {order.comentarios && (
        <div className={styles.commentsSection}>
          <h3>Comentarios</h3>
          <p>{order.comentarios}</p>
        </div>
      )}

      {/* Acciones según el rol */}
      <div className={styles.actions}>
        {/* Ver equipos de la empresa (cualquiera que vea la orden, incluso facturada) */}
        {order.cliente_empresa && !isClient && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() =>
              navigate("/equipment", {
                state: {
                  clientId: order.cliente_empresa?.id_cliente ?? null,
                  clientName: order.cliente_empresa?.nombre ?? "",
                  clientNit: order.cliente_empresa?.nit ?? "",
                  workOrderId: order.orden_id,
                },
              })
            }
          >
            Ver equipos de la empresa
          </button>
        )}

        {/* Asignar herramientas/insumos */}
        {canAssignInventory && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleOpenInventoryModal}
            disabled={loading}
          >
            Asignar herramientas/insumos
          </button>
        )}

        {/* Cliente: puede cancelar su orden pendiente (frontend; backend valida 3 días hábiles) */}
        {userRole === "cliente" &&
          order.estado === validStatuses.PENDIENTE &&
          !isReadOnly && (
            <button
              onClick={handleCancelOrder}
              disabled={loading}
              className={styles.cancelButton}
            >
              Cancelar Orden
            </button>
          )}

        {/* Técnico: puede iniciar, completar y crear equipo (solo si no está facturada) */}
        {userRole === "tecnico" && order.tecnico_id && !isReadOnly && (
          <>
            {order.estado === validStatuses.EN_PROCESO && (
              <>
                <button
                  onClick={() => handleStatusUpdate(validStatuses.COMPLETADO)}
                  disabled={loading}
                  className={styles.completeButton}
                >
                  Marcar como Completado
                </button>
                <button
                  onClick={() =>
                    navigate("/equipment", {
                      state: {
                        clientId: order.cliente_empresa?.id_cliente ?? null,
                        clientName: order.cliente_empresa?.nombre ?? "",
                        clientNit: order.cliente_empresa?.nit ?? "",
                      },
                    })
                  }
                  disabled={loading}
                  className={styles.completeButton}
                >
                  Crear Equipo
                </button>
              </>
            )}

            {order.estado === validStatuses.PENDIENTE && (
              <button
                onClick={() => handleStatusUpdate(validStatuses.EN_PROCESO)}
                disabled={loading}
                className={styles.startButton}
              >
                Iniciar Trabajo
              </button>
            )}
          </>
        )}

        {/* Admin / Secretaria: pueden asignar técnico.
            Solo Admin puede rechazar la orden.
            Ninguna acción si la orden está facturada (solo lectura). */}
        {(userRole === "admin" || userRole === "secretaria") &&
          !isReadOnly && (
            <div className={styles.adminActions}>
              {order.estado !== validStatuses.CANCELADA &&
                order.estado !== validStatuses.RECHAZADA && (
                  <>
                    <button
                      onClick={() => setShowAssignForm(true)}
                      className={styles.assignButton}
                    >
                      {order.tecnico ? "Cambiar Técnico" : "Asignar Técnico"}
                    </button>

                    {/* Solo admin puede rechazar */}
                    {userRole === "admin" && (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className={styles.rejectButton}
                      >
                        Rechazar Orden
                      </button>
                    )}

                    {/* Quitar técnico: solo cuando hay técnico y la orden está Pendiente */}
                    {order.tecnico &&
                      order.estado === validStatuses.PENDIENTE && (
                        <button
                          onClick={handleUnassignTechnician}
                          disabled={loading}
                          className={styles.cancelButton}
                        >
                          Quitar Técnico
                        </button>
                      )}
                  </>
                )}
            </div>
          )}

        {/* Admin / Secretaria: subir factura (solo si no está facturada aún) */}
        {canUploadInvoice && !isReadOnly && (
          <button
            type="button"
            onClick={() => {
              setInvoiceError(null);
              setInvoiceFile(null);
              setShowInvoiceModal(true);
            }}
            className={styles.invoiceButton}
            disabled={loading}
          >
            Subir factura
          </button>
        )}
      </div>

      {/* Modal para asignar técnico */}
      {showAssignForm && (userRole === "admin" || userRole === "secretaria") && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Asignar Técnico</h3>

            {techLoading && <p>Cargando técnicos...</p>}
            {techError && <p className={styles.error}>{techError}</p>}

            {!techLoading && !techError && (
              <>
                <select
                  value={selectedTechnician || ""}
                  onChange={(e) =>
                    setSelectedTechnician(parseInt(e.target.value, 10))
                  }
                  className={styles.technicianSelect}
                >
                  <option value="">Seleccionar técnico...</option>
                  {technicians.map((tech) => (
                    <option key={tech.usuarioId} value={tech.usuarioId}>
                      {tech.nombre} {tech.apellido || ""}
                    </option>
                  ))}
                </select>
                <div className={styles.modalActions}>
                  <button onClick={() => setShowAssignForm(false)}>
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssignTechnician}
                    disabled={!selectedTechnician || loading}
                  >
                    {loading ? "Asignando..." : "Asignar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal para rechazar orden (solo admin) */}
      {showRejectForm && userRole === "admin" && !isReadOnly && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Rechazar Orden</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={4}
              className={styles.rejectTextarea}
            />
            <div className={styles.modalActions}>
              <button onClick={() => setShowRejectForm(false)}>Cancelar</button>
              <button
                onClick={handleRejectOrder}
                disabled={!rejectReason.trim() || loading}
                className={styles.rejectButton}
              >
                {loading ? "Rechazando..." : "Rechazar Orden"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para subir factura */}
      {showInvoiceModal && !isReadOnly && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Subir factura (PDF)</h3>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowInvoiceModal(false)}
              >
                ×
              </button>
            </div>

            {invoiceError && <div className={styles.error}>{invoiceError}</div>}

            <form onSubmit={handleUploadInvoice}>
              <div className={styles.formRow}>
                <label>Archivo PDF *</label>
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
                  {invoiceLoading ? "Subiendo..." : "Subir factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para asignar herramientas / insumos */}
      {showInventoryModal && !isReadOnly && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeaderRow}>
              <h3>Asignar herramienta / insumo</h3>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setShowInventoryModal(false)}
              >
                ×
              </button>
            </div>

            {inventoryError && (
              <div className={styles.error}>{inventoryError}</div>
            )}

            {inventoryLoading ? (
              <p>Cargando inventario...</p>
            ) : (
              <>
                <div className={styles.formRow}>
                  <label>Ítem de inventario *</label>
                  <select
                    className={styles.technicianSelect}
                    value={selectedInventoryId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedInventoryId(
                        value ? parseInt(value, 10) : ""
                      );
                      setSelectedQuantity(1);
                    }}
                  >
                    <option value="">Seleccionar ítem...</option>
                    {inventoryItems.map((item) => (
                      <option
                        key={item.inventarioId}
                        value={item.inventarioId}
                      >
                        {item.tipo === "herramienta" ? "Herramienta" : "Insumo"}{" "}
                        - {item.nombreItem}
                        {item.tipo === "insumo" && item.supply
                          ? ` (Stock: ${item.cantidadActual} ${item.supply.unidadMedida})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selected =
                    typeof selectedInventoryId === "number"
                      ? inventoryItems.find(
                          (i) => i.inventarioId === selectedInventoryId
                        )
                      : undefined;
                  if (!selected || selected.tipo !== "insumo" || !selected.supply)
                    return null;

                  return (
                    <div className={styles.formRow}>
                      <label>
                        Cantidad a usar ({selected.supply.unidadMedida})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selected.cantidadActual}
                        value={selectedQuantity}
                        onChange={(e) =>
                          setSelectedQuantity(
                            Number(e.target.value) > 0
                              ? Number(e.target.value)
                              : 1
                          )
                        }
                      />
                      <small>
                        Stock actual: {selected.cantidadActual}{" "}
                        {selected.supply.unidadMedida}
                      </small>
                    </div>
                  );
                })()}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignInventoryItem}
                    disabled={
                      loading ||
                      !selectedInventoryId ||
                      inventoryItems.length === 0
                    }
                  >
                    {loading ? "Asignando..." : "Asignar a la orden"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}