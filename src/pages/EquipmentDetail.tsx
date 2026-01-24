// src/pages/EquipmentDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  addEquipmentPhotoRequest,
  deleteEquipmentPhotoRequest,
  getEquipmentWorkOrdersRequest,
} from "../api/equipment";
import { 
  getOrdersByClientAndCategoryRequest,
  addEquipmentToOrderRequest,
  removeEquipmentFromOrderRequest 
} from "../api/orders";
import type {
  Equipment,
  EquipmentPhoto,
  EvaporatorData,
  CondenserData,
  AirConditionerTypeOption,
  WorkOrderInfo,
} from "../interfaces/EquipmentInterfaces";
import type { Order } from "../interfaces/OrderInterfaces";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import { playErrorSound } from "../utils/sounds";
import {
  DetailHeader,
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

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const idNum = equipmentId ? Number.parseInt(equipmentId, 10) : null;

  // Usamos el hook para manejar estado del equipo
  const { equipment, loading, saving, error, updateEquipment } =
    useEquipmentDetail(idNum);

  const [editing, setEditing] = useState(false);

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
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(null);

  // Tipos de aire
  const [, setAirConditionerTypes] = useState<
    AirConditionerTypeOption[]
  >([]);
  const [selectedAcTypeId, setSelectedAcTypeId] = useState<number | null>(null);

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
    null
  );

  // Estados para órdenes asociadas
  const [workOrders, setWorkOrders] = useState<WorkOrderInfo[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loadingAvailableOrders, setLoadingAvailableOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const roleName = user?.role?.nombreRol;
  const canEdit = roleName === "Administrador" || roleName === "Técnico";

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
        })
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
        equipment.category
      );
      
      // Filtrar órdenes que no están ya asociadas
      const currentOrderIds = workOrders.map(order => order.workOrderId);
      const filtered = orders.filter(
        order => !currentOrderIds.includes(order.orden_id)
      );
      
      setAvailableOrders(filtered);
    } catch (error) {
      console.error("Error cargando órdenes disponibles:", error);
      setOrdersError("Error cargando órdenes disponibles");
    } finally {
      setLoadingAvailableOrders(false);
    }
  };

  // Sincronizar formulario cuando carga/cambia el equipo
  useEffect(() => {
    if (equipment) {
      setEditForm({
        code: equipment.code || "",
        installationDate: equipment.installationDate || "",
        notes: equipment.notes || "",
        status: equipment.status || "Activo",
      });

      // Inicializar arrays de componentes
      setEvaporators(equipment.evaporators || []);
      setCondensers(equipment.condensers || []);

      setSelectedAcTypeId(equipment.airConditionerTypeId || null);
      setSelectedAreaId(equipment.area?.idArea || null);
      setSelectedSubAreaId(equipment.subArea?.idSubArea || null);

      loadHierarchicalAreas(equipment);
      loadAirConditionerTypes();
      loadWorkOrders();
    }
  }, [equipment]);

  // Cargar órdenes disponibles cuando se abre el modal
  useEffect(() => {
    if (showOrderModal && equipment) {
      loadAvailableOrders();
    }
  }, [showOrderModal, equipment]);

  // Handlers de formulario
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

  // Handlers de selectores
  const handleEditAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setSelectedAreaId(value);
    setSelectedSubAreaId(null); // Resetear subárea cuando cambia área
  };

  const handleEditSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setSelectedSubAreaId(value);
  };

  // GUARDAR
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

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
          addEquipmentPhotoRequest(equipment.equipmentId, f)
        )
      );
      updateEquipment({}); // Recargar equipo para ver fotos nuevas
      setShowAddPhotoModal(false);
      setPhotoFiles([]);
    } catch (err) {
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
      updateEquipment({}); // Recargar equipo
      setShowPhotoModal(false);
    } catch {
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

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <DetailHeader
          canEdit={canEdit && !!equipment}
          editing={editing}
          onBack={() => navigate(-1)}
          onHistory={() =>
            navigate(`/equipment/${equipment?.equipmentId}/history`)
          }
          onAddPhotos={() => setShowAddPhotoModal(true)}
          onToggleEdit={() => setEditing((prev) => !prev)}
        />

        {loading && <p className={styles.loading}>Cargando equipo...</p>}
        {error && !loading && <div className={styles.error}>{error}</div>}

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
              <EquipmentInfoSection equipment={equipment} />
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
                onEditChange={handleEditChange}
                onAreaChange={handleEditAreaChange}
                onSubAreaChange={handleEditSubAreaChange}
                onEvaporatorsChange={handleEvaporatorsChange}
                onCondensersChange={handleCondensersChange}
                onSubmit={handleSave}
                onCancel={() => setEditing(false)}
              />
            )}

            {!editing && <ComponentsReadOnly equipment={equipment} />}
            <LocationSection
              equipment={equipment}
              editing={editing}
              areasWithTree={areas}
            />
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
                            to={`/orders/${order.workOrderId}`}
                            className={styles.viewOrderButton}
                          >
                            Ver Orden
                          </Link>
                          {canEdit && (
                            <button
                              onClick={() => handleRemoveOrder(order.workOrderId)}
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
                  <p className={styles.noOrders}>No hay órdenes asociadas a este equipo.</p>
                )}
                
                {canEdit && (
                  <button
                    onClick={() => setShowOrderModal(true)}
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
                existingOrderIds={workOrders.map(order => order.workOrderId)}
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
    </DashboardLayout>
  );
}