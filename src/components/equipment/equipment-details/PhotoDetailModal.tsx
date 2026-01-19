"use client"

import type { EquipmentPhoto } from "../../../interfaces/EquipmentInterfaces"
import styles from "../../../styles/components/equipment/equipment-details/PhotoDetailModal.module.css"

interface PhotoDetailModalProps {
  photo: EquipmentPhoto
  loading: boolean
  onDelete: (photoId: number) => void
  onClose: () => void
}

export default function PhotoDetailModal({ photo, loading, onDelete, onClose }: PhotoDetailModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.imageModal}>
        <div className={styles.modalHeaderRow}>
          <h4>Detalle de la foto</h4>
          <button type="button" className={styles.modalCloseButton} onClick={onClose} disabled={loading}>
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
        <button onClick={() => onDelete(photo.photoId)} className={styles.deletePhotoButton} disabled={loading}>
          {loading ? "Eliminando..." : "Eliminar foto"}
        </button>
      </div>
    </div>
  )
}
