// src/components/equipment/equipment-details/EquipmentDetailHeader.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces"
import styles from "../../../styles/components/equipment/equipment-details/EquipmentDetailHeader.module.css"

interface EquipmentDetailHeaderProps {
  equipment: Equipment | null
  editing: boolean
  canEdit: boolean
  onBack: () => void
  onToggleEdit: () => void
  onOpenHistory: () => void
  onAddPhotos: () => void
}

export default function EquipmentDetailHeader({
  equipment,
  editing,
  canEdit,
  onBack,
  onToggleEdit,
  onOpenHistory,
  onAddPhotos,
}: EquipmentDetailHeaderProps) {
  return (
    <div className={styles.header}>
      <button className={styles.backButton} onClick={onBack}>
        ← Volver
      </button>
      <h1>Hoja de Vida del Equipo</h1>

      {canEdit && equipment && (
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={onOpenHistory}>
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
