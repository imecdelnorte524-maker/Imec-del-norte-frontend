import { useEffect, useState } from "react";
import styles from "../../../styles/components/equipment/equipment-details/AddPhotoModal.module.css";

interface AddPhotoModalProps {
  photoFiles: File[];
  photoLoading: boolean;
  photoError: string | null;
  onFileSelection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  multiple?: boolean; // nuevo: permitir múltiple o solo una
  title?: string; // nuevo: personalizar título
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

  // Generar URLs de preview para los archivos seleccionados
  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
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

        <form onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <label>Seleccionar imágenes *</label>
            <input
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={onFileSelection}
              required={photoFiles.length === 0}
              disabled={photoLoading}
              className={styles.fileInput}
            />
          </div>

          {photoFiles.length > 0 && (
            <div className={styles.selectedFilesList}>
              <p>
                <strong>{photoFiles.length} archivo(s) seleccionado(s):</strong>
              </p>
              <ul>
                {photoFiles.map((file, index) => (
                  <li key={index}>
                    {previews[index] && (
                      <img
                        src={previews[index]}
                        alt={file.name}
                        className={styles.previewImage}
                      />
                    )}
                    <span>📷 {file.name}</span>
                  </li>
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
