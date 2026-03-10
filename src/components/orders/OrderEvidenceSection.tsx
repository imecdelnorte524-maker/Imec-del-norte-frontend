import { useEffect, useMemo, useRef, useState } from "react";
import {
  getWorkOrderImagesRequest,
  uploadWorkOrderImagesRequest,
  deleteWorkOrderImageRequest,
} from "../../api/orders";
import styles from "../../styles/components/orders/OrderEvidenceSection.module.css";
import type {
  WorkOrderImage,
  WorkOrderEvidencePhase,
  AssociatedEquipment,
} from "../../interfaces/OrderInterfaces";
import { useModal } from "../../context/ModalContext";

interface Props {
  orderId: number;
  canEdit: boolean;
  orderStatus: string;
  activeEquipmentId: number | null;
  equipments?: AssociatedEquipment[];
}

export default function OrderEvidenceSection({
  orderId,
  canEdit,
  orderStatus,
  activeEquipmentId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showModal } = useModal();
  const [images, setImages] = useState<WorkOrderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phasePickerOpen, setPhasePickerOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] =
    useState<WorkOrderEvidencePhase>("DURING");
  const [, setViewingImage] = useState<WorkOrderImage | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocked = orderStatus === "Completado" || orderStatus === "Cancelada";

  const loadImages = async () => {
    try {
      setLoading(true);
      const imgs = await getWorkOrderImagesRequest(orderId);
      setImages(imgs);
    } catch {
      setError("Error cargando fotos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [orderId]);

  const filteredImages = useMemo(() => {
    if (activeEquipmentId == null) return [];
    return images.filter(
      (img) => (img.equipmentId ?? null) === activeEquipmentId,
    );
  }, [images, activeEquipmentId]);

  const grouped = {
    BEFORE: filteredImages.filter((i) => i.evidencePhase === "BEFORE"),
    DURING: filteredImages.filter(
      (i) => i.evidencePhase === "DURING" || !i.evidencePhase,
    ),
    AFTER: filteredImages.filter((i) => i.evidencePhase === "AFTER"),
  };

  const confirmPhaseAndUpload = (p: WorkOrderEvidencePhase) => {
    setSelectedPhase(p);
    setPhasePickerOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeEquipmentId) return;
    try {
      setUploading(true);
      await uploadWorkOrderImagesRequest(orderId, Array.from(e.target.files), {
        phase: selectedPhase,
        equipmentId: activeEquipmentId,
      });
      await loadImages();
      showModal({
        type: "success",
        title: "Fotos subidas",
        message: "Las imágenes se han subido correctamente.",
        buttons: [{ text: "Aceptar", variant: "primary" }],
      });
    } catch (err: any) {
      setError("Error al subir");
      showModal({
        type: "error",
        title: "Error",
        message: err.response?.data?.message || "Error al subir las imágenes",
        buttons: [{ text: "Cerrar", variant: "primary" }],
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    showModal({
      type: "warning",
      title: "Confirmar eliminación",
      message: "¿Está seguro de eliminar esta imagen?",
      buttons: [
        {
          text: "Cancelar",
          variant: "secondary",
        },
        {
          text: "Sí, eliminar",
          variant: "danger",
          onClick: async () => {
            try {
              await deleteWorkOrderImageRequest(imageId);
              await loadImages();
              showModal({
                type: "success",
                title: "Imagen eliminada",
                message: "La imagen se ha eliminado correctamente.",
                buttons: [{ text: "Aceptar", variant: "primary" }],
              });
            } catch (err: any) {
              showModal({
                type: "error",
                title: "Error",
                message:
                  err.response?.data?.message || "Error al eliminar la imagen",
                buttons: [{ text: "Cerrar", variant: "primary" }],
              });
            }
          },
        },
      ],
    });
  };

  const renderGrid = (imgs: WorkOrderImage[], label: string) => {
    if (imgs.length === 0) return null;
    return (
      <div className={styles.evidenceGroup}>
        <h4 className={styles.evidenceGroupTitle}>📸 {label}</h4>
        <div className={styles.evidenceGrid}>
          {imgs.map((img) => (
            <div
              key={img.id}
              className={styles.evidenceCard}
              onClick={() => setViewingImage(img)}
            >
              <img
                src={
                  img.url.startsWith("http") ? img.url : `${apiUrl}${img.url}`
                }
                className={styles.evidenceThumb}
                alt="Evidencia"
              />
              {canEdit && !isLocked && (
                <button
                  className={styles.evidenceDeleteButton}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    handleDeleteImage(img.id);
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleUploadClick = () => {
    if (!activeEquipmentId) {
      showModal({
        type: "info",
        title: "Seleccionar equipo",
        message:
          "Por favor, seleccione un equipo de la lista para asociar las fotos.",
        buttons: [{ text: "Aceptar", variant: "primary" }],
      });
      return;
    }
    setPhasePickerOpen(true);
  };

  return (
    <div className={styles.section}>
      <h3>Evidencias Fotográficas</h3>
      {error && <div className={styles.error}>{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className={styles.evidenceContainer}>
          {renderGrid(grouped.BEFORE, "Antes")}
          {renderGrid(grouped.DURING, "Durante")}
          {renderGrid(grouped.AFTER, "Después")}
          {!filteredImages.length && (
            <p className={styles.helperText}>Sin fotos para este equipo.</p>
          )}
        </div>
      )}

      {canEdit && !isLocked && (
        <div className={styles.subSection}>
          <div
            className={styles.fileUploadLabel}
            onClick={handleUploadClick}
            role="button"
          >
            <span className={styles.uploadIcon}>📷</span>
            <span className={styles.uploadText}>
              {uploading ? "Subiendo..." : "Toca aquí para subir fotos"}
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenFileInput}
        accept="image/*"
        multiple
        onChange={handleFiles}
      />

      {phasePickerOpen && (
        <div
          className={styles.phasePickerOverlay}
          onClick={() => setPhasePickerOpen(false)}
        >
          <div
            className={styles.phasePickerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h4>Seleccione Fase:</h4>
            <div className={styles.phasePickerButtons}>
              <button onClick={() => confirmPhaseAndUpload("BEFORE")}>
                Antes
              </button>
              <button onClick={() => confirmPhaseAndUpload("DURING")}>
                Durante
              </button>
              <button onClick={() => confirmPhaseAndUpload("AFTER")}>
                Después
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
