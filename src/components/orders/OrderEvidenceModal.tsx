// src/components/orders/OrderEvidenceModal.tsx
import { useEffect, useState } from "react";
import {
  getWorkOrderImagesRequest,
  uploadWorkOrderImagesRequest,
} from "../../api/orders";
import styles from "../../styles/components/orders/OrderDetail.module.css";
import type { WorkOrderImage } from "../../interfaces/OrderInterfaces";

interface Props {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

export default function OrderEvidenceModal({
  orderId,
  isOpen,
  onClose,
  canEdit,
}: Props) {
  const [images, setImages] = useState<WorkOrderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
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
    load();
  }, [orderId, isOpen]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      const arr = Array.from(files);
      await uploadWorkOrderImagesRequest(orderId, arr);
      // recargar lista
      const imgs = await getWorkOrderImagesRequest(orderId);
      setImages(imgs);
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

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderRow}>
          <h3>Evidencias de la Orden</h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            ×
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Cargando evidencias...</div>
        ) : images.length === 0 ? (
          <div className={styles.warning}>
            No hay evidencias registradas para esta orden.
          </div>
        ) : (
          <div className={styles.scrollBoxLarge}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: "8px",
              }}
            >
              {images.map((img) => (
                <a
                  key={img.id}
                  href={
                    img.url.startsWith("http") ? img.url : `${apiUrl}${img.url}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <img
                    src={
                      img.url.startsWith("http")
                        ? img.url
                        : `${apiUrl}${img.url}`
                    }
                    alt={`Evidencia ${img.id}`}
                    style={{
                      width: "100%",
                      height: 100,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {canEdit && (
          <>
            <div className={styles.formRow}>
              <label>Agregar nuevas evidencias</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
              <small className={styles.helperText}>
                Puede seleccionar varias imágenes. Máx. recomendado: 10 por
                subida.
              </small>
            </div>

            <div className={styles.formActions}>
              <button onClick={onClose}>Cerrar</button>
              <button
                onClick={handleUpload}
                disabled={uploading || !files || files.length === 0}
              >
                {uploading ? "Subiendo..." : "Subir evidencias"}
              </button>
            </div>
          </>
        )}

        {!canEdit && (
          <div className={styles.modalActions}>
            <button onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}
