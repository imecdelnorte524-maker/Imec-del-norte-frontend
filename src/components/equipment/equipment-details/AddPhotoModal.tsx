// src/components/equipment/equipment-details/AddPhotoModal.tsx
import styles from "../../../styles/components/equipment/equipment-details/AddPhotoModal.module.css";

interface AddPhotoModalProps {
  photoFiles: File[];
  photoLoading: boolean;
  photoError: string | null;
  onFileSelection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function AddPhotoModal({
  photoFiles,
  photoLoading,
  photoError,
  onFileSelection,
  onSubmit,
  onClose,
}: AddPhotoModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.addPhotoModal}>
        <div className={styles.modalHeaderRow}>
          <h4>Agregar nuevas fotos</h4>
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

        <form onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <label>Seleccionar imágenes *</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileSelection}
              required
              disabled={photoLoading}
            />
          </div>

          {photoFiles.length > 0 && (
            <div className={styles.selectedFilesList}>
              <p>
                <strong>{photoFiles.length} archivo(s) seleccionado(s):</strong>
              </p>
              <ul>
                {photoFiles.map((file, index) => (
                  <li key={index}>📷 {file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} disabled={photoLoading}>
              Cancelar
            </button>
            <button type="submit" disabled={photoLoading}>
              {photoLoading
                ? `Subiendo ${photoFiles.length} foto(s)...`
                : `Subir ${
                    photoFiles.length > 0 ? photoFiles.length : ""
                  } foto(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
