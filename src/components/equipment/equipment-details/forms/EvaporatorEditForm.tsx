// src/components/equipment-details/forms/EvaporatorEditForm.tsx
import type { EvaporatorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface EvaporatorEditFormProps {
  evaporatorForm: EvaporatorData;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EvaporatorEditForm({
  evaporatorForm,
  saving,
  onChange,
}: EvaporatorEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <h5>Evaporador</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input
            name="marca"
            value={evaporatorForm.marca || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Samsung"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={evaporatorForm.modelo || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: AEV12"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={evaporatorForm.serial || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: EV123456"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={evaporatorForm.capacidad || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 12000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={evaporatorForm.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 8A"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={evaporatorForm.tipoRefrigerante || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: R410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={evaporatorForm.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 220V"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={evaporatorForm.numeroFases || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1"
          />
        </div>
      </div>
    </div>
  );
}
