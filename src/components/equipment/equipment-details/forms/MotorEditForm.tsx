// src/components/equipment/equipment-details/forms/MotorEditForm.tsx
import type { MotorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface MotorEditFormProps {
  motor: MotorData;
  index: number;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Cambiado: sin índice
  onRemove?: () => void;
}

export default function MotorEditForm({
  motor,
  index,
  saving,
  onChange,
  onRemove,
}: MotorEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Motor {index + 1}</h5>
        {onRemove && (
          <button 
            type="button" 
            className={styles.removeButton}
            onClick={onRemove}
            disabled={saving}
          >
            ✕ Eliminar
          </button>
        )}
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={motor.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 8.5A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={motor.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 220-240V"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={motor.numeroFases || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro del Eje</label>
          <input
            name="diametroEje"
            value={motor.diametroEje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 19mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo de Eje</label>
          <input
            name="tipoEje"
            value={motor.tipoEje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Cónico"
          />
        </div>
        <div className={styles.formField}>
          <label>RPM</label>
          <input
            name="rpm"
            value={motor.rpm || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1450"
          />
        </div>
        <div className={styles.formField}>
          <label>Correa</label>
          <input
            name="correa"
            value={motor.correa || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: A-52"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro de Polea</label>
          <input
            name="diametroPolea"
            value={motor.diametroPolea || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 150mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad HP</label>
          <input
            name="capacidadHp"
            value={motor.capacidadHp || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1.5 HP"
          />
        </div>
        <div className={styles.formField}>
          <label>Frecuencia</label>
          <input
            name="frecuencia"
            value={motor.frecuencia || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 60 Hz"
          />
        </div>
      </div>
    </div>
  );
}