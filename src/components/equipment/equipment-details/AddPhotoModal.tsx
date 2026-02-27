import { useEffect, useState } from "react";
import styles from "../../../styles/components/equipment/equipment-details/AddPhotoModal.module.css";

interface AddPhotoModalProps {
  photoFiles: File[];
  photoLoading: boolean;
  photoError: string | null;
  onFileSelection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  multiple?: boolean;
  title?: string;
}

export default function AddPhotoModal({
  photoFiles,
  photoLoading,
  photoError,
  onFileSelection,
  onSubmit,
  onClose,
  multiple = true,
  title = "Agregar nuevas fotos",
}: AddPhotoModalProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoFiles]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.addPhotoModal}>
        <div className={styles.modalHeaderRow}>
          <h4>{title}</h4>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={photoLoading}
          >
            ×
          </button>
        </div>

        {photoError && <div className={styles.error}>{photoError}</div>}

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.fileUploadWrapper}>
            <input
              type="file"
              id="equipment-photo-upload"
              accept="image/*"
              multiple={multiple}
              onChange={onFileSelection}
              required={photoFiles.length === 0}
              disabled={photoLoading}
              className={styles.hiddenInput}
            />
            <label
              htmlFor="equipment-photo-upload"
              className={`${styles.dropzone} ${photoFiles.length > 0 ? styles.dropzoneCompact : ""}`}
            >
              <div className={styles.uploadIcon}>📸</div>
              <div className={styles.uploadText}>
                {photoFiles.length > 0
                  ? "Añadir más imágenes"
                  : "Haga clic para seleccionar imágenes"}
              </div>
              <small>Formatos aceptados: JPG, PNG, WEBP</small>
            </label>
          </div>

          {photoFiles.length > 0 && (
            <div className={styles.previewContainer}>
              <p className={styles.previewTitle}>
                <strong>{photoFiles.length}</strong> archivo(s) para subir:
              </p>
              <div className={styles.previewGrid}>
                {photoFiles.map((file, index) => (
                  <div key={index} className={styles.previewItem}>
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className={styles.previewImage}
                    />
                    <span className={styles.fileName}>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={photoLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={photoLoading || photoFiles.length === 0}
            >
              {photoLoading
                ? `Subiendo...`
                : `Subir ${photoFiles.length > 0 ? photoFiles.length : ""} foto(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
