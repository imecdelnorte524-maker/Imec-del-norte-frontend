import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  updateOrderRequest,
  cancelOrderRequest,
  rejectOrderRequest,
  assignTechnicianRequest,
} from "../../api/orders";
import { users } from "../../api/users";
import type { Order, UpdateOrderData } from "../../interfaces/OrderInterfaces";
import type { Usuario } from "../../interfaces/UserInterfaces";
import styles from "../../styles/components/orders/OrderDetail.module.css";

interface Props {
  order: Order;
  onBack: () => void;
  userRole: "cliente" | "tecnico" | "admin" | "secretaria";
}

export default function OrderDetail({ order, onBack, userRole }: Props) {
  const navigate = useNavigate(); // ✅ hook correcto

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

  // Estados válidos del frontend
  const validStatuses = {
    PENDIENTE: "Pendiente" as const,
    EN_PROCESO: "En Proceso" as const,
    COMPLETADO: "Completado" as const,
    CANCELADA: "Cancelada" as const,
    RECHAZADA: "Rechazada" as const,
  };

  // Cargar técnicos desde backend (solo Admin)
  useEffect(() => {
    if (userRole !== "admin") return;

    const loadTechnicians = async () => {
      try {
        setTechLoading(true);
        setTechError(null);
        const data = await users.getTechnicians();
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Volver
        </button>
        <h1>Orden de Servicio #{order.orden_id}</h1>
        <div
          className={styles.statusBadge + " " + getStatusColor(order.estado)}
        >
          {order.estado}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Información principal */}
      <div className={styles.detailsGrid}>
        <div className={styles.section}>
          <h3>Información del Cliente</h3>
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
            <span>{order.cliente.telefono || "No proporcionado"}</span>
          </div>
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
            <Link
              to={`/equipment/${order.equipo.equipo_id}`}
              className={styles.viewEquipmentButton}
            >
              Ver hoja de vida completa
            </Link>
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
                Mantenimiento{tipoMantenimiento ? ` ${tipoMantenimiento}` : ""}
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
        {/* Cliente: puede cancelar su orden pendiente (frontend; backend valida 3 días hábiles) */}
        {userRole === "cliente" && order.estado === validStatuses.PENDIENTE && (
          <button
            onClick={handleCancelOrder}
            disabled={loading}
            className={styles.cancelButton}
          >
            Cancelar Orden
          </button>
        )}

        {/* Técnico: puede iniciar, completar y crear equipo */}
        {userRole === "tecnico" && order.tecnico_id && (
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

        {/* Admin: puede asignar y rechazar */}
        {userRole === "admin" && (
          <div className={styles.adminActions}>
            {order.estado === validStatuses.PENDIENTE && !order.tecnico_id && (
              <>
                <button
                  onClick={() => setShowAssignForm(true)}
                  className={styles.assignButton}
                >
                  Asignar Técnico
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className={styles.rejectButton}
                >
                  Rechazar Orden
                </button>
              </>
            )}
          </div>
        )}

        {/* Secretaria: solo lectura */}
      </div>

      {/* Modal para asignar técnico */}
      {showAssignForm && userRole === "admin" && (
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

      {/* Modal para rechazar orden */}
      {showRejectForm && userRole === "admin" && (
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
    </div>
  );
}
