// src/components/equipment/equipment-details/DatesNotesSection.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/DatesNotesSection.module.css";

interface DatesNotesSectionProps {
  equipment: Equipment;
}

export default function DatesNotesSection({
  equipment,
}: DatesNotesSectionProps) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No especificada";

    try {
      // Tomamos solo la parte de fecha (YYYY-MM-DD) ignorando la hora/Z
      const [datePart] = dateString.split("T"); // "2026-04-30"
      const [year, month, day] = datePart.split("-").map(Number);

      if (!year || !month || !day) {
        // Si no cumple el formato esperado, usamos el fallback normal
        return new Date(dateString).toLocaleDateString();
      }

      // Creamos la fecha en zona local sin convertir desde UTC
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Nueva: formatear unidad de frecuencia
  const formatUnidadFrecuencia = () => {
    const plan = equipment.planMantenimiento;
    if (!plan || !plan.unidadFrecuencia) return "No especificada";

    switch (plan.unidadFrecuencia) {
      case "DIA":
        return `Diaria (Cada ${plan.diaDelMes} dias)`;
      case "SEMANA":
        return `Semanal (cada ${plan.diaDelMes} semanas)`;
      case "MES":
        // Si hay día del mes, lo mostramos
        if (plan.diaDelMes != null) {
          return `Mensual (cada ${plan.diaDelMes} meses)`;
        }
        return "Mensual";
      default:
        return plan.unidadFrecuencia;
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
            <span>{formatUnidadFrecuencia()}</span>
          </div>

          {equipment.planMantenimiento.fechaProgramada && (
            <div className={styles.detailItem}>
              <strong>Próximo mantenimiento:</strong>
              <span>
                {formatDate(equipment.planMantenimiento.fechaProgramada)}
              </span>
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
