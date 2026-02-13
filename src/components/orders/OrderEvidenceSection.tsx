// src/components/orders/OrderEvidenceSection.tsx
import { useEffect, useState } from "react";
import {
  getWorkOrderImagesRequest,
  uploadWorkOrderImagesRequest,
  deleteWorkOrderImageRequest,
} from "../../api/orders";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { WorkOrderImage } from "../../interfaces/OrderInterfaces";

interface Props {
  orderId: number;
  canEdit: boolean;
}

export default function OrderEvidenceSection({ orderId, canEdit }: Props) {
  const [images, setImages] = useState<WorkOrderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const imgs = await getWorkOrderImagesRequest(orderId);
      setImages(imgs);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error cargando evidencias",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [orderId]);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      const arr = Array.from(files);

      await uploadWorkOrderImagesRequest(orderId, arr);

      await loadImages();
      setFiles(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error subiendo evidencias",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("¿Eliminar esta evidencia?")) return;

    try {
      setDeletingId(imageId);
      setError(null);
      await deleteWorkOrderImageRequest(imageId);
      // recargar lista
      await loadImages();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error eliminando evidencia",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.section}>
      <h3>Evidencias</h3>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Cargando evidencias...</div>
      ) : images.length === 0 ? (
        <p className={styles.helperText}>
          No hay evidencias registradas para esta orden.
        </p>
      ) : (
        <div className={styles.itemsTableWrapper}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "8px",
            }}
          >
            {images.map((img) => {
              const url = img.url.startsWith("http")
                ? img.url
                : `${apiUrl}${img.url}`;
              const isDeleting = deletingId === img.id;

              return (
                <div
                  key={img.id}
                  className={styles.evidenceCard}
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.evidenceLink}
                  >
                    <img
                      src={url}
                      alt={`Evidencia ${img.id}`}
                      className={styles.evidenceThumb}
                    />
                  </a>

                  {canEdit && (
                    <button
                      type="button"
                      className={styles.evidenceDeleteButton}
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={isDeleting}
                      title="Eliminar evidencia"
                    >
                      {isDeleting ? "..." : "🗑️"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canEdit && (
        <div className={styles.subSection}>
          <div className={styles.formRow}>
            <label>Agregar nuevas evidencias</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
            <small className={styles.helperText}>
              Puede seleccionar varias imágenes. Máx recomendado: 10 por subida.
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