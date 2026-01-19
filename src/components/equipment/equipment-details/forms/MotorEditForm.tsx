// src/components/equipment-details/forms/MotorEditForm.tsx
import type { MotorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface MotorEditFormProps {
  motorForm: MotorData;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MotorEditForm({
  motorForm,
  saving,
  onChange,
}: MotorEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <h5>Motor</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={motorForm.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 10A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={motorForm.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 220V"
          />
        </div>
        <div className={styles.formField}>
          <label>RPM</label>
          <input
            name="rpm"
            value={motorForm.rpm || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1500"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial Motor</label>
          <input
            name="serialMotor"
            value={motorForm.serialMotor || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: SN123456"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo Motor</label>
          <input
            name="modeloMotor"
            value={motorForm.modeloMotor || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: MTR-001"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro Eje</label>
          <input
            name="diametroEje"
            value={motorForm.diametroEje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 12mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Eje</label>
          <input
            name="tipoEje"
            value={motorForm.tipoEje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Redondo"
          />
        </div>
      </div>
    </div>
  );
}
