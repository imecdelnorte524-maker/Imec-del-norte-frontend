// src/components/equipment/equipment-details/DatesNotesSection.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/DatesNotesSection.module.css";

interface DatesNotesSectionProps {
  equipment: Equipment;
}

export default function DatesNotesSection({
  equipment,
}: DatesNotesSectionProps) {
  // Función para formatear fecha de forma segura
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No especificada";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles.section}>
      <h3>Fechas y Observaciones</h3>
      
      {equipment.installationDate && (
        <div className={styles.detailItem}>
          <strong>Fecha de instalación:</strong>
          <span>{formatDate(equipment.installationDate)}</span>
        </div>
      )}
      
      <div className={styles.detailItem}>
        <strong>Creado en el sistema:</strong>
        <span>{formatDateTime(equipment.createdAt)}</span>
      </div>
      
      <div className={styles.detailItem}>
        <strong>Última actualización:</strong>
        <span>{formatDateTime(equipment.updatedAt)}</span>
      </div>
      
      {equipment.notes && (
        <div className={styles.notes}>
          <strong>Observaciones:</strong>
          <p>{equipment.notes}</p>
        </div>
      )}

      {/* Plan de mantenimiento si existe */}
      {equipment.planMantenimiento && (
        <div className={styles.maintenancePlan}>
          <h4>Plan de Mantenimiento</h4>
          <div className={styles.detailItem}>
            <strong>Frecuencia:</strong>
            <span>{equipment.planMantenimiento.frecuencia || "No especificada"}</span>
          </div>
          {equipment.planMantenimiento.fechaProgramada && (
            <div className={styles.detailItem}>
              <strong>Próximo mantenimiento:</strong>
              <span>{formatDate(equipment.planMantenimiento.fechaProgramada)}</span>
            </div>
          )}
          {equipment.planMantenimiento.notas && (
            <div className={styles.notes}>
              <strong>Notas del plan:</strong>
              <p>{equipment.planMantenimiento.notas}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}