// src/pages/EquipmentDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  getEquipmentByIdRequest,
  updateEquipmentRequest,
  addEquipmentPhotoRequest,
  deleteEquipmentPhotoRequest,
} from "../api/equipment";
import type {
  Equipment,
  EquipmentPhoto,
} from "../interfaces/EquipmentInterfaces";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/pages/EquipmentDetailPage.module.css";

export default function EquipmentDetailPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    brand: "",
    model: "",
    serialNumber: "",
    capacity: "",
    refrigerantType: "",
    voltage: "",
    physicalLocation: "",
    manufacturer: "",
    installationDate: "",
    notes: "",
  });

  // Estado para fotos / carrusel
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoDescription, setPhotoDescription] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Modales
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<EquipmentPhoto | null>(
    null
  );

  const roleName = user?.role?.nombreRol;
  const canEdit = roleName === "Administrador" || roleName === "Técnico";

  // Cargar equipo
  useEffect(() => {
    const loadEquipment = async () => {
      if (!equipmentId) {
        setError("ID de equipo inválido");
        setLoading(false);
        return;
      }

      const idNum = parseInt(equipmentId, 10);
      if (isNaN(idNum)) {
        setError("ID de equipo inválido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getEquipmentByIdRequest(idNum);
        setEquipment(data);
        setEditForm({
          name: data.name || "",
          code: data.code || "",
          brand: data.brand || "",
          model: data.model || "",
          serialNumber: data.serialNumber || "",
          capacity: data.capacity || "",
          refrigerantType: data.refrigerantType || "",
          voltage: data.voltage || "",
          physicalLocation: data.physicalLocation || "",
          manufacturer: data.manufacturer || "",
          installationDate: data.installationDate || "",
          notes: data.notes || "",
        });
        setCurrentPhotoIndex(0);
      } catch (err: any) {
        console.error("Error obteniendo equipo:", err);
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Error al obtener la hoja de vida del equipo"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [equipmentId]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        name: editForm.name,
        code: editForm.code || undefined,
        brand: editForm.brand || undefined,
        model: editForm.model || undefined,
        serialNumber: editForm.serialNumber || undefined,
        capacity: editForm.capacity || undefined,
        refrigerantType: editForm.refrigerantType || undefined,
        voltage: editForm.voltage || undefined,
        physicalLocation: editForm.physicalLocation || undefined,
        manufacturer: editForm.manufacturer || undefined,
        installationDate: editForm.installationDate || undefined,
        notes: editForm.notes || undefined,
      };

      const updated = await updateEquipmentRequest(
        equipment.equipmentId,
        payload
      );
      setEquipment(updated);
      setEditing(false);
    } catch (err: any) {
      console.error("Error actualizando equipo:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al actualizar la hoja de vida del equipo"
      );
    } finally {
      setSaving(false);
    }
  };

  // ---- Carrusel de fotos ----
  const photos = equipment?.photos || [];
  const photosCount = photos.length;
  const safeIndex =
    photosCount > 0 ? Math.min(currentPhotoIndex, photosCount - 1) : 0;
  const currentPhoto = photosCount > 0 ? photos[safeIndex] : null;

  const handlePrevPhoto = () => {
    if (!photosCount) return;
    setCurrentPhotoIndex((prev) => (prev === 0 ? photosCount - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    if (!photosCount) return;
    setCurrentPhotoIndex((prev) => (prev === photosCount - 1 ? 0 : prev + 1));
  };

  const openPhotoModal = (photo: EquipmentPhoto) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;
    if (!photoFile) {
      setPhotoError("Debe seleccionar un archivo de imagen");
      return;
    }

    setPhotoLoading(true);
    setPhotoError(null);

    try {
      const newPhoto = await addEquipmentPhotoRequest(
        equipment.equipmentId,
        photoFile // CORREGIDO: Solo pasar el archivo
      );

      // Actualizar estado localmente sin recargar todo el equipo
      setEquipment((prev) =>
        prev
          ? {
              ...prev,
              photos: [...prev.photos, newPhoto],
            }
          : prev
      );

      setPhotoFile(null);
      setPhotoDescription("");
      setShowAddPhotoModal(false);
      setCurrentPhotoIndex(photosCount); // ir a la última añadida
    } catch (err: any) {
      console.error("Error agregando foto:", err);
      setPhotoError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al agregar la foto del equipo"
      );
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!equipment) return;
    if (!window.confirm("¿Está seguro de que desea eliminar esta foto?"))
      return;

    setPhotoLoading(true);
    setPhotoError(null);

    try {
      // CORREGIDO: Solo pasar photoId, no equipmentId
      await deleteEquipmentPhotoRequest(photoId);

      // Actualizar estado localmente sin recargar todo el equipo
      setEquipment((prev) => {
        if (!prev) return prev;
        const newPhotos = prev.photos.filter((p) => p.photoId !== photoId);
        let newIndex = currentPhotoIndex;
        if (newIndex >= newPhotos.length) {
          newIndex = newPhotos.length - 1;
        }
        setCurrentPhotoIndex(Math.max(newIndex, 0));
        return {
          ...prev,
          photos: newPhotos,
        };
      });

      closePhotoModal();
    } catch (err: any) {
      console.error("Error eliminando foto:", err);
      setPhotoError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al eliminar la foto del equipo"
      );
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleOpenHistory = () => {
    console.log("Historial de equipo - pendiente de implementación");
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1>Hoja de Vida del Equipo</h1>

          {canEdit && equipment && (
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleOpenHistory}
              >
                Historial
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setPhotoError(null);
                  setPhotoFile(null);
                  setPhotoDescription("");
                  setShowAddPhotoModal(true);
                }}
              >
                Agregar imagen
              </button>
              <button
                className={styles.editButton}
                type="button"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancelar edición" : "Editar"}
              </button>
            </div>
          )}
        </div>

        {loading && <p className={styles.loading}>Cargando equipo...</p>}
        {error && !loading && <div className={styles.error}>{error}</div>}

        {!loading && !error && equipment && (
          <>
            {/* Carrusel */}
            <div className={styles.section}>
              <h3>Fotos del Equipo</h3>

              {photoError && <div className={styles.error}>{photoError}</div>}

              <div className={styles.carouselWrapper}>
                <div className={styles.carouselMain}>
                  {currentPhoto ? (
                    <>
                      {photosCount > 1 && (
                        <button
                          type="button"
                          className={`${styles.carouselNavButton} ${styles.carouselNavLeft}`}
                          onClick={handlePrevPhoto}
                          disabled={photoLoading}
                        >
                          ‹
                        </button>
                      )}

                      <img
                        src={currentPhoto.url}
                        alt={currentPhoto.description || "Foto del equipo"}
                        className={styles.carouselImage}
                        onClick={() => openPhotoModal(currentPhoto)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />

                      {photosCount > 1 && (
                        <button
                          type="button"
                          className={`${styles.carouselNavButton} ${styles.carouselNavRight}`}
                          onClick={handleNextPhoto}
                          disabled={photoLoading}
                        >
                          ›
                        </button>
                      )}

                      <div className={styles.carouselInfo}>
                        Foto {safeIndex + 1} de {photosCount}
                      </div>
                    </>
                  ) : (
                    <p className={styles.emptyPhotos}>
                      No hay fotos registradas para este equipo.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Información general */}
            <div className={styles.section}>
              <h3>Información General</h3>

              {!editing ? (
                <>
                  <div className={styles.detailItem}>
                    <strong>Nombre del equipo:</strong>
                    <span>{equipment.name}</span>
                  </div>
                  {equipment.code && (
                    <div className={styles.detailItem}>
                      <strong>Código interno:</strong>
                      <span>{equipment.code}</span>
                    </div>
                  )}
                  {equipment.orderId && (
                    <div className={styles.detailItem}>
                      <strong>Orden Id:</strong>
                      <span>{`#${equipment.orderId}`}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <strong>Categoría:</strong>
                    <span>{equipment.category}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Estado:</strong>
                    <span>{equipment.status}</span>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} className={styles.editForm}>
                  <div className={styles.formRow}>
                    <label>Nombre del equipo *</label>
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Código interno (generado automáticamente)</label>
                    <input
                      disabled
                      name="code"
                      value={editForm.code}
                      readOnly
                    />
                    <span className={styles.helperText}>
                      Este código es generado por el sistema (ej: AACI001,
                      RCICI001) y no se puede editar manualmente.
                    </span>
                  </div>
                  <div className={styles.formRow}>
                    <label>Marca</label>
                    <input
                      name="brand"
                      value={editForm.brand}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Modelo</label>
                    <input
                      name="model"
                      value={editForm.model}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Número de serie</label>
                    <input
                      name="serialNumber"
                      value={editForm.serialNumber}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Capacidad</label>
                    <input
                      name="capacity"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Tipo de refrigerante</label>
                    <input
                      name="refrigerantType"
                      value={editForm.refrigerantType}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Voltaje</label>
                    <input
                      name="voltage"
                      value={editForm.voltage}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Ubicación física</label>
                    <input
                      name="physicalLocation"
                      value={editForm.physicalLocation}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Fecha de instalación</label>
                    <input
                      type="date"
                      name="installationDate"
                      value={editForm.installationDate}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Observaciones</label>
                    <textarea
                      name="notes"
                      value={editForm.notes}
                      onChange={handleEditChange}
                      rows={3}
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" onClick={() => setEditing(false)}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Ubicación */}
            <div className={styles.section}>
              <h3>Ubicación</h3>
              <div className={styles.detailItem}>
                <strong>Cliente (empresa):</strong>
                <span>
                  {equipment.client
                    ? `${equipment.client.nombre} (NIT: ${equipment.client.nit})`
                    : equipment.clientId}
                </span>
              </div>
              {equipment.area && (
                <div className={styles.detailItem}>
                  <strong>Área:</strong>
                  <span>{equipment.area.nombreArea}</span>
                </div>
              )}
              {equipment.subArea && (
                <div className={styles.detailItem}>
                  <strong>Subárea:</strong>
                  <span>{equipment.subArea.nombreSubArea}</span>
                </div>
              )}
              {equipment.physicalLocation && !editing && (
                <div className={styles.detailItem}>
                  <strong>Ubicación física:</strong>
                  <span>{equipment.physicalLocation}</span>
                </div>
              )}
            </div>

            {/* Fechas y observaciones (modo solo lectura cuando no edita) */}
            {!editing && (
              <div className={styles.section}>
                <h3>Fechas y Observaciones</h3>
                {equipment.installationDate && (
                  <div className={styles.detailItem}>
                    <strong>Fecha de instalación:</strong>
                    <span>
                      {new Date(
                        equipment.installationDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <strong>Creado en el sistema:</strong>
                  <span>{new Date(equipment.createdAt).toLocaleString()}</span>
                </div>
                {equipment.notes && (
                  <div className={styles.notes}>
                    <strong>Observaciones:</strong>
                    <p>{equipment.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* MODAL: Agregar imagen */}
            {showAddPhotoModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.addPhotoModal}>
                  <div className={styles.modalHeaderRow}>
                    <h4>Agregar nueva foto</h4>
                    <button
                      type="button"
                      className={styles.modalCloseButton}
                      onClick={() => setShowAddPhotoModal(false)}
                    >
                      ×
                    </button>
                  </div>

                  {photoError && (
                    <div className={styles.error}>{photoError}</div>
                  )}

                  <form onSubmit={handleAddPhoto}>
                    <div className={styles.formRow}>
                      <label>Archivo de imagen *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setPhotoFile(e.target.files?.[0] || null)
                        }
                        required
                      />
                    </div>
                    <div className={styles.formRow}>
                      <label>Descripción (opcional)</label>
                      <textarea
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className={styles.formActions}>
                      <button
                        type="button"
                        onClick={() => setShowAddPhotoModal(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" disabled={photoLoading}>
                        {photoLoading ? "Guardando..." : "Agregar foto"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Ver imagen grande */}
            {showPhotoModal && selectedPhoto && (
              <div className={styles.modalOverlay}>
                <div className={styles.imageModal}>
                  <div className={styles.modalHeaderRow}>
                    <h4>Detalle de la foto</h4>
                    <button
                      type="button"
                      className={styles.modalCloseButton}
                      onClick={closePhotoModal}
                    >
                      ×
                    </button>
                  </div>
                  <div className={styles.imageModalBody}>
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.description || "Foto del equipo"}
                      className={styles.imageModalImage}
                    />
                    {selectedPhoto.description && (
                      <p className={styles.imageModalDescription}>
                        {selectedPhoto.description}
                      </p>
                    )}
                    <span className={styles.imageModalDate}>
                      {new Date(selectedPhoto.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(selectedPhoto.photoId)}
                    className={styles.deletePhotoButton}
                    disabled={photoLoading}
                  >
                    {photoLoading ? "Eliminando..." : "Eliminar foto"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}