"use client";
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-list/EquipmentCard.module.css";

interface EquipmentCardProps {
  equipment: Equipment;
  onClick: (equipmentId: number) => void;
}

export default function EquipmentCard({
  equipment,
  onClick,
}: EquipmentCardProps) {
  // Mostrar información de órdenes si existen
  const hasWorkOrders = equipment.workOrders && equipment.workOrders.length > 0;

  return (
    <div className={styles.card} onClick={() => onClick(equipment.equipmentId)}>
      <div className={styles.cardHeader}>
        <h3>{equipment.code || `Equipo #${equipment.equipmentId}`}</h3>
        <span className={styles.status}>{equipment.status}</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.row}>
          <span className={styles.label}>Cliente:</span>
          <span className={styles.value}>{equipment.client.nombre}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Categoría:</span>
          <span className={styles.value}>{equipment.category}</span>
        </div>

        {hasWorkOrders && (
          <div className={styles.row}>
            <span className={styles.label}>Órdenes:</span>
            <span className={styles.value}>
              {equipment.workOrders!.length} asociadas
            </span>
          </div>
        )}

        {equipment.area && (
          <div className={styles.row}>
            <span className={styles.label}>Área:</span>
            <span className={styles.value}>{equipment.area.nombreArea}</span>
          </div>
        )}
        {equipment.subArea && (
          <div className={styles.row}>
            <span className={styles.label}>Subárea:</span>
            <span className={styles.value}>
              {equipment.subArea?.nombreSubArea || "Sin subárea"}
            </span>
          </div>
        )}
        {equipment.planMantenimiento && (
          <div className={styles.row}>
            <span className={styles.label}>Plan de Mantenimiento:</span>
            <span className={styles.value}>
              {equipment.planMantenimiento?.fechaProgramada || "Sin plan de mantenimiento"}
            </span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerText}>
          {equipment.installationDate
            ? `Instalado: ${new Date(equipment.installationDate).toLocaleDateString()}`
            : `ID: ${equipment.equipmentId}`}
        </span>
      </div>
    </div>
  );
}
