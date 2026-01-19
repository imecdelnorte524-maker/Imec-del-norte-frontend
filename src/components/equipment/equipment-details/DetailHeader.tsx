
// src/components/equipment/equipment-details/DetailHeader.tsx
import styles from "../../../styles/components/equipment/equipment-details/DetailHeader.module.css"

interface DetailHeaderProps {
  canEdit: boolean
  editing: boolean
  onBack: () => void
  onHistory: () => void
  onAddPhotos: () => void
  onToggleEdit: () => void
}

export default function DetailHeader({
  canEdit,
  editing,
  onBack,
  onHistory,
  onAddPhotos,
  onToggleEdit,
}: DetailHeaderProps) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        ← Volver
      </button>
      <h1>Hoja de Vida del Equipo</h1>

      {canEdit && (
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={onHistory}>
            Historial
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onAddPhotos}>
            Agregar imágenes
          </button>
          <button className={styles.editButton} type="button" onClick={onToggleEdit}>
            {editing ? "Cancelar edición" : "Editar"}
          </button>
        </div>
      )}
    </div>
  )
}
