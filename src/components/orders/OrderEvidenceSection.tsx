// src/components/orders/OrderEvidenceSection.tsx
import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../hooks/useAuth";

interface Props {
  orderId: number;
  canEdit: boolean;
  orderStatus: string;
  equipments?: AssociatedEquipment[];
  activeEquipmentId?: number | null;
}

export default function OrderEvidenceSection({
  orderId,
  canEdit,
  orderStatus,
  equipments,
  activeEquipmentId,
}: Props) {
  const { user } = useAuth();
  const [images, setImages] = useState<WorkOrderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [viewingImage, setViewingImage] = useState<WorkOrderImage | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const userRole = (user as any)?.role?.nombreRol || (user as any)?.role || "";
  const isAdmin = userRole === "Administrador" || userRole === "admin";
  const showUploadSection =
    canEdit && (isAdmin || orderStatus !== "Completado");

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const imgs = await getWorkOrderImagesRequest(orderId);
      setImages(imgs);
    } catch (err: any) {
      setError("Error cargando evidencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [orderId]);

  // Extrae el equipmentId a partir del patrón en observation: "[CODE] resto"
  const getImageEquipmentId = (img: WorkOrderImage): number | null => {
    if (!img.observation || !equipments || equipments.length === 0) return null;
    const match = img.observation.match(/^\[(.+?)\]/);
    if (!match) return null;
    const code = match[1];
    const eq = equipments.find((e) => e.code === code);
    return eq ? eq.equipmentId : null;
  };

  const filteredImages = useMemo(() => {
    if (!equipments || equipments.length === 0 || activeEquipmentId == null) {
      return [];
    }

    return images.filter((img) => {
      const eqId = getImageEquipmentId(img);
      return eqId === activeEquipmentId;
    });
  }, [images, equipments, activeEquipmentId]);

  const groupedImages = {
    BEFORE: filteredImages.filter((img) => img.evidencePhase === "BEFORE"),
    DURING: filteredImages.filter(
      (img) => !img.evidencePhase || img.evidencePhase === "DURING",
    ),
    AFTER: filteredImages.filter((img) => img.evidencePhase === "AFTER"),
  };

  const phaseLabels: Record<WorkOrderEvidencePhase, string> = {
    BEFORE: "📸 Antes del Mantenimiento",
    DURING: "🛠️ Durante el Mantenimiento",
    AFTER: "✅ Después del Mantenimiento",
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);

      let observation: string | undefined;

      if (equipments && equipments.length > 0 && activeEquipmentId != null) {
        const eq = equipments.find((e) => e.equipmentId === activeEquipmentId);
        if (eq?.code) {
          observation = `[${eq.code}] Evidencia durante mantenimiento`;
        }
      }

      await uploadWorkOrderImagesRequest(orderId, Array.from(files), {
        phase: "DURING",
        observation,
      });
      await loadImages();
      setFiles(null);
    } catch (err: any) {
      setError("Error subiendo evidencias");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (e: React.MouseEvent, imageId: number) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar esta evidencia?")) return;
    setDeletingId(imageId);
    deleteWorkOrderImageRequest(imageId)
      .then(() => loadImages())
      .finally(() => setDeletingId(null));
  };

  const renderImageGrid = (
    imgs: WorkOrderImage[],
    phaseKey: WorkOrderEvidencePhase,
  ) => {
    if (imgs.length === 0) return null;

    return (
      <div key={phaseKey} className={styles.evidenceGroup}>
        <div className={styles.groupHeader}>
          <h4 className={styles.evidenceGroupTitle}>{phaseLabels[phaseKey]}</h4>
        </div>

        <div className={styles.evidenceGrid}>
          {imgs.map((img) => {
            const url = img.url.startsWith("http")
              ? img.url
              : `${apiUrl}${img.url}`;
            return (
              <div
                key={img.id}
                className={styles.evidenceCard}
                onClick={() => setViewingImage(img)}
              >
                <img
                  src={url}
                  alt="Evidencia"
                  className={styles.evidenceThumb}
                />

                {showUploadSection && img.evidencePhase === "DURING" && (
                  <button
                    type="button"
                    className={styles.evidenceDeleteButton}
                    onClick={(e) => handleDeleteImage(e, img.id)}
                    disabled={deletingId === img.id}
                  >
                    {deletingId === img.id ? "..." : "🗑️"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasAnyFiltered = filteredImages.length > 0;

  return (
    <div className={styles.section}>
      <h3>Evidencias Fotográficas</h3>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Cargando evidencias...</div>
      ) : !hasAnyFiltered ? (
        <p className={styles.helperText}>
          No hay evidencias registradas para este equipo todavía.
        </p>
      ) : (
        <div className={styles.evidenceContainer}>
          {renderImageGrid(groupedImages.BEFORE, "BEFORE")}
          {renderImageGrid(groupedImages.DURING, "DURING")}
          {renderImageGrid(groupedImages.AFTER, "AFTER")}
        </div>
      )}

      {/* VISOR DE IMAGEN */}
      {viewingImage && (
        <div
          className={styles.imageViewerOverlay}
          onClick={() => setViewingImage(null)}
        >
          <div
            className={styles.imageViewerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeViewer}
              onClick={() => setViewingImage(null)}
            >
              ×
            </button>
            <img
              src={
                viewingImage.url.startsWith("http")
                  ? viewingImage.url
                  : `${apiUrl}${viewingImage.url}`
              }
              alt="Evidence"
              className={styles.fullImage}
            />
            <div className={styles.imageViewerMeta}>
              <span className={styles.viewerPhaseBadge}>
                {phaseLabels[viewingImage.evidencePhase || "DURING"]}
              </span>
              <p className={styles.viewerObservation}>
                {viewingImage.observation || "Sin observación adicional."}
              </p>
              <small className={styles.viewerDate}>
                Subida el: {new Date(viewingImage.created_at).toLocaleString()}
              </small>
            </div>
          </div>
        </div>
      )}

      {showUploadSection && (
        <div className={styles.subSection}>
          <div className={styles.formRow}>
            <label className={styles.customLabel}>
              Agregar nuevas evidencias (Durante el trabajo)
            </label>
            <div className={styles.fileUploadContainer}>
              <input
                type="file"
                id="file-upload"
                className={styles.hiddenFileInput}
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <label htmlFor="file-upload" className={styles.fileUploadLabel}>
                <span className={styles.uploadIcon}>📷</span>
                <span className={styles.uploadText}>
                  {files && files.length > 0
                    ? `${files.length} imágenes seleccionadas`
                    : "Seleccionar imágenes o arrastrar aquí"}
                </span>
              </label>
            </div>
            <small className={styles.helperText}>
              Máx. recomendado: 10 por subida.
            </small>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !files || files.length === 0}
            >
              {uploading ? "Subiendo..." : "Subir evidencias"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
