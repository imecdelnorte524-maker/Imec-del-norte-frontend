// src/components/equipment/equipment-details/DatesNotesSection.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/DatesNotesSection.module.css";

interface DatesNotesSectionProps {
  equipment: Equipment;
}

export default function DatesNotesSection({
  equipment,
}: DatesNotesSectionProps) {
  return (
    <div className={styles.section}>
      <h3>Fechas y Observaciones</h3>
      {equipment.installationDate && (
        <div className={styles.detailItem}>
          <strong>Fecha de instalación:</strong>
          <span>
            {new Date(equipment.installationDate).toLocaleDateString()}
          </span>
        </div>
      )}
      <div className={styles.detailItem}>
        <strong>Creado en el sistema:</strong>
        <span>{new Date(equipment.createdAt).toLocaleString()}</span>
      </div>
      <div className={styles.detailItem}>
        <strong>Última actualización:</strong>
        <span>{new Date(equipment.updatedAt).toLocaleString()}</span>
      </div>
      {equipment.notes && (
        <div className={styles.notes}>
          <strong>Observaciones:</strong>
          <p>{equipment.notes}</p>
        </div>
      )}
    </div>
  );
}
