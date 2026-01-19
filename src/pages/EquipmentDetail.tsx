// src/pages/EquipmentDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  addEquipmentPhotoRequest,
  deleteEquipmentPhotoRequest,
} from "../api/equipment";
import type {
  Equipment,
  EquipmentPhoto,
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
  AirConditionerTypeOption,
} from "../interfaces/EquipmentInterfaces";
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
import styles from "../styles/pages/EquipmentDetailPage.module.css";
import type { AreaSimple } from "../interfaces/AreaInterfaces";

// Importamos el nuevo hook
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
    name: "",
    physicalLocation: "",
    installationDate: "",
    notes: "",
  });
  const [motorForm, setMotorForm] = useState<MotorData>({});
  const [evaporatorForm, setEvaporatorForm] = useState<EvaporatorData>({});
  const [condenserForm, setCondenserForm] = useState<CondenserData>({});
  const [compressorForm, setCompressorForm] = useState<CompressorData>({});

  // Áreas jerárquicas
  const [areas, setAreas] = useState<AreaSimple[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | "">("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | "">("");

  // Tipos de aire
  const [airConditionerTypes, setAirConditionerTypes] = useState<
    AirConditionerTypeOption[]
  >([]);
  const [selectedAcTypeId, setSelectedAcTypeId] = useState<number | "">("");

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

  // Sincronizar formulario cuando carga/cambia el equipo
  useEffect(() => {
    if (equipment) {
      setEditForm({
        name: equipment.name || "",
        physicalLocation: equipment.physicalLocation || "",
        installationDate: equipment.installationDate || "",
        notes: equipment.notes || "",
      });
      setMotorForm(equipment.motor || {});
      setEvaporatorForm(equipment.evaporator || {});
      setCondenserForm(equipment.condenser || {});
      setCompressorForm(equipment.compressor || {});

      setSelectedAcTypeId(equipment.airConditionerTypeId || "");
      setSelectedAreaId(equipment.area?.idArea ?? "");
      setSelectedSubAreaId(equipment.subArea?.idSubArea ?? "");

      loadHierarchicalAreas(equipment);
      loadAirConditionerTypes();
    }
  }, [equipment]);

  // Handlers de formulario
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleMotorFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMotorForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEvaporatorFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEvaporatorForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCondenserFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCondenserForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCompressorFormChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCompressorForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Handlers de selectores
  const handleEditAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAreaId(e.target.value ? Number(e.target.value) : "");
    setSelectedSubAreaId("");
  };
  const handleEditSubAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubAreaId(e.target.value ? Number(e.target.value) : "");
  };
  const handleAcTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAcTypeId(e.target.value ? Number(e.target.value) : "");
  };

  // GUARDAR (Usando el hook para actualizar y recargar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    const payload: any = {
      name: editForm.name,
      physicalLocation: editForm.physicalLocation || null,
      installationDate: editForm.installationDate || null,
      notes: editForm.notes || null,
    };

    if (typeof selectedAreaId === "number") {
      payload.areaId = selectedAreaId;
    } else {
      payload.areaId = null; // Borrar área si se deseleccionó
    }

    if (typeof selectedSubAreaId === "number") {
      payload.subAreaId = selectedSubAreaId;
    } else {
      payload.subAreaId = null; // Borrar subárea si se deseleccionó
    }

    if (equipment.category === "Aires Acondicionados") {
      payload.airConditionerTypeId =
        typeof selectedAcTypeId === "number" ? selectedAcTypeId : null;
    }

    // Componentes: enviar objeto si tiene datos, null si no
    const hasData = (obj: any) =>
      Object.keys(obj).some((k) => obj[k] !== "" && obj[k] !== undefined);

    payload.motor = hasData(motorForm) ? motorForm : null;
    payload.evaporator = hasData(evaporatorForm) ? evaporatorForm : null;
    payload.condenser = hasData(condenserForm) ? condenserForm : null;
    payload.compressor = hasData(compressorForm) ? compressorForm : null;

    const success = await updateEquipment(payload); // <--- AQUÍ LA MAGIA
    if (success) {
      setEditing(false);
    } else {
      playErrorSound();
    }
  };

  // --- Fotos (igual que antes) ---
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

  const selectedAcType = airConditionerTypes.find(
    (t) => t.id === Number(selectedAcTypeId)
  );

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
                motorForm={motorForm}
                evaporatorForm={evaporatorForm}
                condenserForm={condenserForm}
                compressorForm={compressorForm}
                areas={areas}
                selectedAreaId={selectedAreaId}
                selectedSubAreaId={selectedSubAreaId}
                airConditionerTypes={airConditionerTypes}
                selectedAcTypeId={selectedAcTypeId}
                selectedAcType={selectedAcType}
                saving={saving}
                loadingLocations={loadingLocations}
                locationsError={locationsError}
                onEditChange={handleEditChange}
                onMotorFormChange={handleMotorFormChange}
                onEvaporatorFormChange={handleEvaporatorFormChange}
                onCondenserFormChange={handleCondenserFormChange}
                onCompressorFormChange={handleCompressorFormChange}
                onAreaChange={handleEditAreaChange}
                onSubAreaChange={handleEditSubAreaChange}
                onAcTypeChange={handleAcTypeChange}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
