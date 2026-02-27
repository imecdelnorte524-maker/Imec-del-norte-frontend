import type { AssociatedEquipment, Order } from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/EquipmentSelectionModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipments: AssociatedEquipment[];
  order: Order;
  phase: "BEFORE" | "AFTER";
  onSelect: (equipment: AssociatedEquipment) => void;
}

export default function EquipmentSelectionModal({ isOpen, onClose, equipments, order, phase, onSelect }: Props) {
  if (!isOpen) return null;

  // Verifica si un equipo ya tiene inspección para la fase actual
  const isDone = (eqId: number) => 
    order.acInspections?.some(insp => insp.equipmentId === eqId && insp.phase === phase);

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderRow}>
          <h3>Seleccionar Equipo para Inspección</h3>
          <button onClick={onClose} className={styles.modalCloseButton}>×</button>
        </div>
        <p className={styles.modalDescription}>
          Elija el equipo para registrar los parámetros <strong>{phase === "BEFORE" ? "Iniciales" : "Finales"}</strong>:
        </p>

        <div className={styles.scrollBoxLarge}>
          {equipments.map((eq) => {
            const completed = isDone(eq.equipmentId);
            return (
              <div 
                key={eq.equipmentId} 
                className={`${styles.selectableRow} ${completed ? styles.selectableRowSelected : ""}`}
                style={completed ? { opacity: 0.7, backgroundColor: '#f0fdf4' } : {}}
                onClick={() => onSelect(eq)}
              >
                <div className={styles.flexGrow}>
                  <strong>{eq.code || `ID: ${eq.equipmentId}`}</strong>
                  <div className={styles.rowMeta}>{eq.category} - {eq.area?.nombre || "Sin ubicación"}</div>
                </div>
                {completed && <span style={{color: '#16a34a', fontWeight: 'bold', fontSize: '0.8rem'}}>✅ LISTO</span>}
              </div>
            );
          })}
        </div>
        
        <div className={styles.modalActions}>
            <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}