import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentInfoReadView.module.css";

interface EquipmentInfoReadViewProps {
  equipment: Equipment;
}

export default function EquipmentInfoReadView({
  equipment,
}: EquipmentInfoReadViewProps) {
  return (
    <>
      <div className={styles.detailItem}>
        <strong>Cliente:</strong>
        <span>{equipment.client.nombre}</span>
      </div>
      {equipment.code && (
        <div className={styles.detailItem}>
          <strong>Código interno:</strong>
          <span>{equipment.code}</span>
        </div>
      )}
      {equipment.workOrders && equipment.workOrders.length > 0 && (
        <div className={styles.detailItem}>
          <strong>Órdenes asociadas:</strong>
          <span>{equipment.workOrders.length} {equipment.workOrders.length > 1 ? "órdenes" : "Órden"}</span>
        </div>
      )}
      <div className={styles.detailItem}>
        <strong>Categoría:</strong>
        <span>{equipment.category}</span>
      </div>
      {equipment.airConditionerType && (
        <div className={styles.detailItem}>
          <strong>Tipo de Aire Acondicionado:</strong>
          <span>{equipment.airConditionerType.name}</span>
        </div>
      )}
      <div className={styles.detailItem}>
        <strong>Estado:</strong>
        <span>{equipment.status}</span>
      </div>
      {equipment.area && (
        <div className={styles.detailItem}>
          <strong>Área:</strong>
          <span>{equipment.area.nombreArea}</span>
        </div>
      )}
      {equipment.subArea && (
        <div className={styles.detailItem}>
          <strong>Subárea:</strong>
          <span>{equipment.subArea.nombreSubArea}</span>
        </div>
      )}
    </>
  );
}