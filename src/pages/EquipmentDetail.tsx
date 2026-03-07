import { useState, useEffect } from "react";
import type React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  addEquipmentPhotoRequest,
  deleteEquipmentPhotoRequest,
  getEquipmentWorkOrdersRequest,
  downloadEquipmentHistoryPdfRequest,
} from "../api/equipment";
import {
  getOrdersByClientAndCategoryRequest,
  addEquipmentToOrderRequest,
  removeEquipmentFromOrderRequest,
} from "../api/orders";
import type {
  Equipment,
  EquipmentPhoto,
  EvaporatorData,
  CondenserData,
  AirConditionerTypeOption,
  WorkOrderInfo,
  PlanMantenimientoData,
} from "../interfaces/EquipmentInterfaces";
import type { Order } from "../interfaces/OrderInterfaces";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import { playErrorSound } from "../utils/sounds";
import {
  PhotoCarousel,
  EquipmentInfoSection,
  EquipmentEditForm,
  ComponentsReadOnly,
  LocationSection,
  DatesNotesSection,
  AddPhotoModal,
  PhotoViewModal,
} from "../components/equipment/equipment-details";
import AssociateOrderModal from "../components/equipment/equipment-details/AssociateOrderModal";
import styles from "../styles/pages/EquipmentDetailPage.module.css";
import type { AreaSimple } from "../interfaces/AreaInterfaces";
import { useEquipmentDetail } from "../hooks/useEquipmentDetail";
import pdfIcon from "../../public/Assets/icons/document-pdf.svg";
import EquipmentDocumentsModal from "../components/equipment/equipment-details/EquipmentDocumentsModal";

// Tipos de aire acondicionado que permiten múltiples componentes
const MULTIPLE_COMPONENT_TYPES = [
  "MultiSplit",
  "Refrigerante Variable",
  "VRF",
  "VRV",
  "Variable Refrigerant Flow",
  "Sistema Multi Split",
];

interface NewAcTypeFormState {
  name: string;
  hasEvaporator: boolean;
  hasCondenser: boolean;
}

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const idNum = equipmentId ? Number.parseInt(equipmentId, 10) : null;

  // Usamos el hook para manejar estado del equipo
  const { equipment, loading, saving, error, updateEquipment, reload } =
    useEquipmentDetail(idNum);

  const [editing, setEditing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Estados locales para el formulario de edición
  const [editForm, setEditForm] = useState({
    code: "",
    installationDate: "",
    notes: "",
    status: "",
  });

  // Arrays de componentes (nueva estructura)
  const [evaporators, setEvaporators] = useState<EvaporatorData[]>([]);
  const [condensers, setCondensers] = useState<CondenserData[]>([]);

  // Áreas jerárquicas
  const [areas, setAreas] = useState<AreaSimple[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(
    null,
  );
  const [showDocsModal, setShowDocsModal] = useState(false);

  // Tipos de aire
  const [airConditionerTypes, setAirConditionerTypes] = useState<
    AirConditionerTypeOption[]
  >([]);
  const [selectedAcTypeId, setSelectedAcTypeId] = useState<number | null>(null);

  // Plan de mantenimiento (completo)
  const [planMantenimiento, setPlanMantenimiento] =
    useState<PlanMantenimientoData | null>(null);

  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fotos
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<EquipmentPhoto | null>(
    null,
  );

  // Estados para órdenes asociadas
  const [workOrders, setWorkOrders] = useState<WorkOrderInfo[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loadingAvailableOrders, setLoadingAvailableOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Error local para validaciones de edición
  const [localError, setLocalError] = useState<string | null>(null);

  // Modal para crear nuevo tipo de aire
  const [showAcTypeModal, setShowAcTypeModal] = useState(false);
  const [creatingAcType, setCreatingAcType] = useState(false);
  const [acTypeError, setAcTypeError] = useState<string | null>(null);
  const [newAcTypeForm, setNewAcTypeForm] = useState<NewAcTypeFormState>({
    name: "",
    hasEvaporator: true,
    hasCondenser: true,
  });

  const roleName = user?.role?.nombreRol;
  const canEdit = roleName === "Administrador" || roleName === "Técnico";
  const isClient = roleName === "Cliente";

  // Manejador para descargar PDF del historial
  const handleDownloadHistoryPdf = async () => {
    if (!equipment) return;

    try {
      setDownloadingPdf(true);
      await downloadEquipmentHistoryPdfRequest(equipment.equipmentId);
    } catch (err: any) {
      console.error("Error descargando PDF del historial:", err);
      alert("Error al descargar el PDF del historial");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Cargar áreas jerárquicas (árbol completo)
  const loadHierarchicalAreas = async (eq: Equipment) => {
    try {
      if (!eq.client?.idCliente) return;
      setLoadingLocations(true);
      setLocationsError(null);

      const areasRes = await api.get("/areas", {
        params: { clienteId: eq.client.idCliente },
      });
      const areasData = areasRes.data?.data || [];

      const areasWithTrees: AreaSimple[] = await Promise.all(
        areasData.map(async (a: any) => {
          try {
            const treeRes = await api.get(`/sub-areas/tree/${a.idArea}`);
            return {
              idArea: a.idArea,
              nombreArea: a.nombreArea,
              treeData: treeRes.data?.data,
              subAreas: [],
            } as AreaSimple;
          } catch {
            return {
              idArea: a.idArea,
              nombreArea: a.nombreArea,
              treeData: null,
              subAreas: [],
            } as AreaSimple;
          }
        }),
      );

      setAreas(areasWithTrees);
    } catch (err: any) {
      console.error("Error cargando áreas:", err);
      setLocationsError("Error al cargar áreas.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadAirConditionerTypes = async () => {
    try {
      const res = await api.get("/air-conditioner-types");
      setAirConditionerTypes(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar órdenes asociadas al equipo
  const loadWorkOrders = async () => {
    if (!equipment) return;
    try {
      setLoadingWorkOrders(true);
      const orders = await getEquipmentWorkOrdersRequest(equipment.equipmentId);
      setWorkOrders(orders);
    } catch (error) {
      console.error("Error cargando órdenes del equipo:", error);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  // Cargar órdenes disponibles para asociar
  const loadAvailableOrders = async () => {
    if (!equipment) return;
    try {
      setLoadingAvailableOrders(true);
      setOrdersError(null);

      const orders = await getOrdersByClientAndCategoryRequest(
        equipment.client.idCliente,
        equipment.category,
      );

      setAvailableOrders(orders);
    } catch (error) {
      console.error("❌ Error cargando órdenes disponibles:", error);
      setOrdersError("Error cargando órdenes disponibles");
    } finally {
      setLoadingAvailableOrders(false);
    }
  };

  // Sincronizar formulario cuando carga/cambia el equipo
  useEffect(() => {
    if (equipment) {
      setLocalError(null);

      setEditForm({
        code: equipment.code || "",
        installationDate: equipment.installationDate || "",
        notes: equipment.notes || "",
        status: equipment.status || "Activo",
      });

      // Componentes
      setEvaporators(equipment.evaporators || []);
      setCondensers(equipment.condensers || []);

      // Tipo de aire: usar id plano o, si no viene, el id del objeto anidado
      const acTypeIdFromEquipment =
        equipment.airConditionerTypeId ??
        equipment.airConditionerType?.id ??
        null;
      setSelectedAcTypeId(acTypeIdFromEquipment);

      // Ubicación
      setSelectedAreaId(equipment.area?.idArea || null);
      setSelectedSubAreaId(equipment.subArea?.idSubArea || null);

      // Plan de mantenimiento: copiar lo que venga del backend
      setPlanMantenimiento(
        equipment.planMantenimiento ? { ...equipment.planMantenimiento } : null,
      );

      loadHierarchicalAreas(equipment);
      loadAirConditionerTypes();
      loadWorkOrders();
    }
  }, [equipment]);

  // Handlers de formulario básicos
  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers para arrays de componentes
  const handleEvaporatorsChange = (newEvaporators: EvaporatorData[]) => {
    setEvaporators(newEvaporators);
  };

  const handleCondensersChange = (newCondensers: CondenserData[]) => {
    setCondensers(newCondensers);
  };

  // Handlers de selectores de ubicación
  const handleEditAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setSelectedAreaId(value);
    setSelectedSubAreaId(null); // Resetear subárea cuando cambia área
  };

  const handleEditSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setSelectedSubAreaId(value);
  };

  // Handler de tipo de aire acondicionado
  const handleEditAcTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setSelectedAcTypeId(value);
  };

  // Handler genérico de Plan de Mantenimiento
  const handlePlanMantenimientoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setPlanMantenimiento((prev) => {
      // Limpiar todo el plan si se borra la unidad de frecuencia
      if (name === "unidadFrecuencia") {
        if (!value) {
          return null;
        }
        return {
          ...(prev || {}),
          unidadFrecuencia: value as PlanMantenimientoData["unidadFrecuencia"],
        };
      }

      // Si no había plan antes y se empieza a editar otro campo
      if (!prev) {
        const base: PlanMantenimientoData = {};
        if (name === "diaDelMes") {
          return {
            ...base,
            diaDelMes: value ? Number(value) : null,
          };
        }
        if (name === "fechaProgramada") {
          return {
            ...base,
            fechaProgramada: value || null,
          };
        }
        if (name === "notas") {
          return {
            ...base,
            notas: value || null,
          };
        }
        return base;
      }

      if (name === "diaDelMes") {
        return {
          ...prev,
          diaDelMes: value ? Number(value) : null,
        };
      }

      if (name === "fechaProgramada") {
        return {
          ...prev,
          fechaProgramada: value || null,
        };
      }

      if (name === "notas") {
        return {
          ...prev,
          notas: value || null,
        };
      }

      return prev;
    });
  };

  // GUARDAR
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    setLocalError(null);

    // Determinar el tipo de aire seleccionado (para validaciones)
    const selectedTypeId =
      selectedAcTypeId ?? equipment.airConditionerTypeId ?? null;

    let typeName = "";

    if (selectedTypeId && airConditionerTypes.length > 0) {
      const type = airConditionerTypes.find((t) => t.id === selectedTypeId);
      if (type?.name) typeName = type.name.toLowerCase();
    } else if (equipment.airConditionerType?.name) {
      typeName = equipment.airConditionerType.name.toLowerCase();
    }

    const canHaveMultipleComponents = MULTIPLE_COMPONENT_TYPES.some((multi) =>
      typeName.includes(multi.toLowerCase()),
    );

    if (!canHaveMultipleComponents) {
      if (evaporators.length > 1) {
        setLocalError(
          "Este tipo de aire solo permite una evaporadora. Elimine las adicionales antes de guardar.",
        );
        playErrorSound();
        return;
      }

      if (condensers.length > 1) {
        setLocalError(
          "Este tipo de aire solo permite una condensadora. Elimine las adicionales antes de guardar.",
        );
        playErrorSound();
        return;
      }

      // Validar compresores: máximo 1 por condensadora
      for (const cond of condensers) {
        if (cond.compressors && cond.compressors.length > 1) {
          setLocalError(
            "Este tipo de aire solo permite un compresor por condensadora. Ajuste los compresores antes de guardar.",
          );
          playErrorSound();
          return;
        }
      }
    }

    const payload = {
      code: editForm.code || null,
      status: editForm.status,
      installationDate: editForm.installationDate || null,
      notes: editForm.notes || null,
      areaId: selectedAreaId,
      subAreaId: selectedSubAreaId,
      airConditionerTypeId: selectedAcTypeId,
      evaporators: evaporators,
      condensers: condensers,
      planMantenimiento: planMantenimiento ?? null,
    };

    const success = await updateEquipment(payload);
    if (success) {
      setEditing(false);
    } else {
      playErrorSound();
    }
  };

  // --- Fotos ---
  const photos = equipment?.photos || [];
  const handlePrevPhoto = () =>
    setCurrentPhotoIndex((p) => (p === 0 ? photos.length - 1 : p - 1));
  const handleNextPhoto = () =>
    setCurrentPhotoIndex((p) => (p === photos.length - 1 ? 0 : p + 1));

  const handleAddPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment || photoFiles.length === 0) return;
    setPhotoLoading(true);
    try {
      await Promise.all(
        photoFiles.map((f) =>
          addEquipmentPhotoRequest(equipment.equipmentId, f),
        ),
      );
      // Recargar equipo desde el backend para ver fotos nuevas
      await reload();
      setShowAddPhotoModal(false);
      setPhotoFiles([]);
    } catch (err) {
      console.error("Error subiendo fotos:", err);
      setPhotoError("Error al subir fotos");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!window.confirm("¿Eliminar foto?")) return;
    setPhotoLoading(true);
    try {
      await deleteEquipmentPhotoRequest(photoId);
      // Recargar equipo desde el backend
      await reload();
      setShowPhotoModal(false);
    } catch (err) {
      console.error("Error eliminando foto:", err);
      setPhotoError("Error al eliminar foto");
    } finally {
      setPhotoLoading(false);
    }
  };

  // --- Handlers para órdenes ---
  const handleAssociateOrder = async (orderId: number) => {
    if (!equipment) return;

    try {
      await addEquipmentToOrderRequest(orderId, equipment.equipmentId);
      // Recargar órdenes asociadas
      await loadWorkOrders();
      // Cerrar modal
      setShowOrderModal(false);
    } catch (error) {
      console.error("Error asociando orden:", error);
      alert("Error al asociar la orden");
    }
  };

  const handleRemoveOrder = async (orderId: number) => {
    if (!equipment) return;
    if (!window.confirm("¿Desasociar esta orden del equipo?")) return;

    try {
      await removeEquipmentFromOrderRequest(orderId, equipment.equipmentId);
      // Recargar órdenes asociadas
      await loadWorkOrders();
    } catch (error) {
      console.error("Error desasociando orden:", error);
      alert("Error al desasociar la orden");
    }
  };

  // --- Creación de nuevo tipo de aire acondicionado ---
  const handleOpenNewAcTypeForm = () => {
    setAcTypeError(null);
    setNewAcTypeForm({
      name: "",
      hasEvaporator: true,
      hasCondenser: true,
    });
    setShowAcTypeModal(true);
  };

  const handleNewAcTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewAcTypeForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateNewAcType = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcTypeError(null);

    if (!newAcTypeForm.name.trim()) {
      setAcTypeError("El nombre del tipo de aire es obligatorio.");
      return;
    }

    try {
      setCreatingAcType(true);
      const res = await api.post("/air-conditioner-types", {
        name: newAcTypeForm.name.trim(),
        hasEvaporator: newAcTypeForm.hasEvaporator,
        hasCondenser: newAcTypeForm.hasCondenser,
      });

      const created: AirConditionerTypeOption = res.data?.data;
      if (!created || !created.id) {
        throw new Error("Respuesta inesperada al crear tipo de aire.");
      }

      // Actualizar lista local y seleccionar el nuevo tipo
      setAirConditionerTypes((prev) => [...prev, created]);
      setSelectedAcTypeId(created.id);

      setShowAcTypeModal(false);
    } catch (err) {
      console.error("Error creando tipo de aire:", err);
      setAcTypeError("Error al crear el tipo de aire acondicionado.");
    } finally {
      setCreatingAcType(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1>Detalle del Equipo</h1>

          {/* 👇 BOTÓN DE PDF EN EL HEADER */}
          {equipment && !loading && (
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.pdfHeaderButton}
                onClick={handleDownloadHistoryPdf}
                disabled={downloadingPdf}
                title="Descargar historial en PDF"
              >
                {downloadingPdf ? (
                  <span className={styles.spinner}></span>
                ) : (
                  <>
                    <img src={pdfIcon} alt="PDF" className={styles.pdfIcon} />
                    <span>PDF Historial</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  navigate(`/equipment/${equipment?.equipmentId}/history`)
                }
              >
                Historial
              </button>

              {!isClient && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setShowAddPhotoModal(true)}
                >
                  + Agregar imagen
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
              )}
            </div>
          )}
        </div>

        {loading && <p className={styles.loading}>Cargando equipo...</p>}
        {error && !loading && <div className={styles.error}>{error}</div>}
        {localError && !loading && (
          <div className={styles.error}>{localError}</div>
        )}

        {!loading && !error && equipment && (
          <>
            <PhotoCarousel
              photos={photos}
              currentIndex={currentPhotoIndex}
              photoLoading={photoLoading}
              photoError={photoError}
              onPrev={handlePrevPhoto}
              onNext={handleNextPhoto}
              onPhotoClick={(p) => {
                setSelectedPhoto(p);
                setShowPhotoModal(true);
              }}
            />

            {!editing ? (
              <>
                <EquipmentInfoSection equipment={equipment} />
                <LocationSection
                  equipment={equipment}
                  editing={editing}
                  areasWithTree={areas}
                />
              </>
            ) : (
              <EquipmentEditForm
                equipment={equipment}
                editForm={editForm}
                evaporators={evaporators}
                condensers={condensers}
                areas={areas}
                selectedAreaId={selectedAreaId}
                selectedSubAreaId={selectedSubAreaId}
                saving={saving}
                loadingLocations={loadingLocations}
                locationsError={locationsError}
                airConditionerTypes={airConditionerTypes}
                selectedAcTypeId={selectedAcTypeId}
                planMantenimiento={planMantenimiento}
                onEditChange={handleEditChange}
                onAreaChange={handleEditAreaChange}
                onSubAreaChange={handleEditSubAreaChange}
                onAcTypeChange={handleEditAcTypeChange}
                onOpenNewAcTypeForm={handleOpenNewAcTypeForm}
                onPlanMantenimientoChange={handlePlanMantenimientoChange}
                onEvaporatorsChange={handleEvaporatorsChange}
                onCondensersChange={handleCondensersChange}
                onSubmit={handleSave}
                onCancel={() => setEditing(false)}
              />
            )}
            {!editing && <ComponentsReadOnly equipment={equipment} />}

            {!editing && <DatesNotesSection equipment={equipment} />}

            {/* Sección de Órdenes Asociadas */}
            {!editing && (
              <div className={styles.section}>
                <h3>Órdenes de Servicio Asociadas</h3>
                {loadingWorkOrders ? (
                  <p className={styles.loading}>Cargando órdenes...</p>
                ) : workOrders.length > 0 ? (
                  <div className={styles.workOrdersList}>
                    {workOrders.map((order) => (
                      <div key={order.workOrderId} className={styles.orderItem}>
                        <div className={styles.orderInfo}>
                          <strong>Orden #{order.workOrderId}</strong>
                          <span className={styles.orderDescription}>
                            {order.description || "Sin descripción"}
                          </span>
                          <small className={styles.orderDate}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </small>
                          {order.workOrderDetails && (
                            <div className={styles.orderDetails}>
                              <span className={styles.orderStatus}>
                                {order.workOrderDetails.estado}
                              </span>
                              <span className={styles.orderType}>
                                {order.workOrderDetails.tipoServicio}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={styles.orderActions}>
                          <Link
                            to={`/orders/?ordenId=${order.workOrderId}`}
                            className={styles.viewOrderButton}
                          >
                            Ver Orden
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() =>
                                handleRemoveOrder(order.workOrderId)
                              }
                              className={styles.removeOrderButton}
                              disabled={saving}
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noOrders}>
                    No hay órdenes asociadas a este equipo.
                  </p>
                )}
                {canEdit && (
                  <button
                    onClick={async () => {
                      setLoadingAvailableOrders(true);

                      try {
                        await loadAvailableOrders();
                        setShowOrderModal(true);
                      } catch (error) {
                        console.error("Error cargando órdenes:", error);
                      } finally {
                        setLoadingAvailableOrders(false);
                      }
                    }}
                    className={styles.associateOrderButton}
                  >
                    + Asociar Nueva Orden
                  </button>
                )}
              </div>
            )}

            {/* Modales de fotos... */}
            {showAddPhotoModal && (
              <AddPhotoModal
                photoFiles={photoFiles}
                photoLoading={photoLoading}
                photoError={photoError}
                onFileSelection={(e) =>
                  e.target.files && setPhotoFiles(Array.from(e.target.files))
                }
                onSubmit={handleAddPhotos}
                onClose={() => setShowAddPhotoModal(false)}
              />
            )}
            {showPhotoModal && selectedPhoto && (
              <PhotoViewModal
                photo={selectedPhoto}
                photoLoading={photoLoading}
                onClose={() => setShowPhotoModal(false)}
                onDelete={handleDeletePhoto}
              />
            )}

            {/* Modal para asociar órdenes */}
            {showOrderModal && equipment && (
              <AssociateOrderModal
                isOpen={showOrderModal}
                equipmentId={equipment.equipmentId}
                clientId={equipment.client.idCliente}
                category={equipment.category}
                existingOrderIds={workOrders.map((order) => order.workOrderId)}
                availableOrders={availableOrders}
                loading={loadingAvailableOrders}
                error={ordersError}
                onClose={() => setShowOrderModal(false)}
                onAssociate={handleAssociateOrder}
              />
            )}
          </>
        )}
      </div>

      {/* Botón flotante solo para documentos PDF */}
      {equipment && !loading && (
        <>
          <button
            type="button"
            className={styles.floatingDocsButton}
            onClick={() => setShowDocsModal(true)}
            aria-label="Abrir documentos PDF"
            title="Documentos PDF"
          >
            <img src={pdfIcon} alt="" className={styles.pdfIcon} />
          </button>
        </>
      )}

      {/* Modal simple para crear nuevo tipo de aire acondicionado */}
      {showAcTypeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "8px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              Nuevo Tipo de Aire Acondicionado
            </h3>

            {acTypeError && (
              <p style={{ color: "red", marginBottom: "0.75rem" }}>
                {acTypeError}
              </p>
            )}

            <form onSubmit={handleCreateNewAcType}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newAcTypeForm.name}
                  onChange={handleNewAcTypeChange}
                  disabled={creatingAcType}
                  style={{ width: "100%", padding: "0.4rem" }}
                />
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>
                  Componentes
                </label>
                <label style={{ display: "block", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    name="hasEvaporator"
                    checked={newAcTypeForm.hasEvaporator}
                    onChange={handleNewAcTypeChange}
                    disabled={creatingAcType}
                    style={{ marginRight: "0.35rem" }}
                  />
                  Tiene evaporadora
                </label>
                <label style={{ display: "block", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    name="hasCondenser"
                    checked={newAcTypeForm.hasCondenser}
                    onChange={handleNewAcTypeChange}
                    disabled={creatingAcType}
                    style={{ marginRight: "0.35rem" }}
                  />
                  Tiene condensadora
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAcTypeModal(false)}
                  disabled={creatingAcType}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={creatingAcType}>
                  {creatingAcType ? "Creando..." : "Crear tipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {equipment && (
        <>
          {showDocsModal && (
            <EquipmentDocumentsModal
              isOpen={showDocsModal}
              equipmentId={equipment.equipmentId}
              onClose={() => setShowDocsModal(false)}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
