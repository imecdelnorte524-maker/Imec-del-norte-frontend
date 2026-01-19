"use client"

import type { Equipment } from "../../../interfaces/EquipmentInterfaces"
import styles from "../../../styles/components/equipment/equipment-list/EquipmentCard.module.css"

interface EquipmentCardProps {
  equipment: Equipment
  onClick: (equipmentId: number) => void
}

export default function EquipmentCard({ equipment, onClick }: EquipmentCardProps) {
  return (
    <div className={styles.card} onClick={() => onClick(equipment.equipmentId)}>
      <div className={styles.cardHeader}>
        <h3>{equipment.name}</h3>
        <span className={styles.status}>{equipment.status}</span>
      </div>

      <div className={styles.cardBody}>
        {equipment.code && (
          <div className={styles.row}>
            <span className={styles.label}>Código:</span>
            <span className={styles.value}>{equipment.code}</span>
          </div>
        )}
        {equipment.workOrderId && (
          <div className={styles.row}>
            <span className={styles.label}>Orden ID:</span>
            <span className={styles.value}>{`#${equipment.workOrderId}`}</span>
          </div>
        )}
        <div className={styles.row}>
          <span className={styles.label}>Categoría:</span>
          <span className={styles.value}>{equipment.category}</span>
        </div>
        {equipment.physicalLocation && (
          <div className={styles.row}>
            <span className={styles.label}>Ubicación:</span>
            <span className={styles.value}>{equipment.physicalLocation}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerText}>ID #{equipment.equipmentId}</span>
      </div>
    </div>
  )
}
