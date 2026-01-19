"use client"

import type { Equipment } from "../../../interfaces/EquipmentInterfaces"
import EquipmentCard from "./EquipmentCard"
import styles from "../../../styles/components/equipment/equipment-list/EquipmentGrid.module.css"

interface EquipmentGridProps {
  equipmentList: Equipment[]
  onOpenEquipment: (equipmentId: number) => void
}

export default function EquipmentGrid({ equipmentList, onOpenEquipment }: EquipmentGridProps) {
  return (
    <div className={styles.grid}>
      {equipmentList.map((eq) => (
        <EquipmentCard key={eq.equipmentId} equipment={eq} onClick={onOpenEquipment} />
      ))}
    </div>
  )
}
