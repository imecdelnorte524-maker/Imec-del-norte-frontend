// src/components/equipment-detail/EquipmentInfoSection.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentInfoSection.module.css";

interface EquipmentInfoSectionProps {
  equipment: Equipment;
}

export default function EquipmentInfoSection({
  equipment,
}: EquipmentInfoSectionProps) {
  return (
    <div className={styles.section}>
      <h3>Información General</h3>

      <div className={styles.detailItem}>
        <strong>Nombre del equipo:</strong>
        <span>{equipment.name}</span>
      </div>

      {equipment.code && (
        <div className={styles.detailItem}>
          <strong>Código interno:</strong>
          <span>{equipment.code}</span>
        </div>
      )}

      {equipment.workOrderId && (
        <div className={styles.detailItem}>
          <strong>Orden ID:</strong>
          <span>{`#${equipment.workOrderId}`}</span>
        </div>
      )}

      <div className={styles.detailItem}>
        <strong>Categoría:</strong>
        <span>{equipment.category}</span>
      </div>

      {equipment.category === "Aires Acondicionados" &&
        equipment.airConditionerType && (
          <div className={styles.detailItem}>
            <strong>Tipo de Aire Acondicionado:</strong>
            <span>{equipment.airConditionerType.name}</span>
          </div>
        )}

      <div className={styles.detailItem}>
        <strong>Estado:</strong>
        <span>{equipment.status}</span>
      </div>
    </div>
  );
}
