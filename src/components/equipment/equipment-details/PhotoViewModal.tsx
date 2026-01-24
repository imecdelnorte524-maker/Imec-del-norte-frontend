"use client"

// src/components/equipment-detail/PhotoViewModal.tsx
import type { EquipmentPhoto } from "../../../interfaces/EquipmentInterfaces"
import styles from "../../../styles/components/equipment/equipment-details/PhotoViewModal.module.css"

interface PhotoViewModalProps {
  photo: EquipmentPhoto
  photoLoading: boolean
  onClose: () => void
  onDelete: (photoId: number) => void
}

export default function PhotoViewModal({ photo, photoLoading, onClose, onDelete }: PhotoViewModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.imageModal}>
        <div className={styles.modalHeaderRow}>
          <h4>Detalle de la foto</h4>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} disabled={photoLoading}>
            ×
          </button>
        </div>

        <div className={styles.imageModalBody}>
          <img
            src={photo.url || "/placeholder.svg"}
            alt={photo.description || "Foto del equipo"}
            className={styles.imageModalImage}
          />
          {photo.description && <p className={styles.imageModalDescription}>{photo.description}</p>}
          <span className={styles.imageModalDate}>{new Date(photo.createdAt).toLocaleString()}</span>
        </div>

        <button onClick={() => onDelete(photo.photoId)} className={styles.deletePhotoButton} disabled={photoLoading}>
          {photoLoading ? "Eliminando..." : "Eliminar foto"}
        </button>
      </div>
    </div>
  )
}
