// src/components/equipment-details/forms/CondenserEditForm.tsx
import type { CondenserData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface CondenserEditFormProps {
  condenserForm: CondenserData;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CondenserEditForm({
  condenserForm,
  saving,
  onChange,
}: CondenserEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <h5>Condensador</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input
            name="marca"
            value={condenserForm.marca || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Samsung"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={condenserForm.modelo || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: CNV12"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={condenserForm.serial || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: CN123456"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={condenserForm.capacidad || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 12000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={condenserForm.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 8A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={condenserForm.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 220V"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={condenserForm.tipoRefrigerante || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: R410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={condenserForm.numeroFases || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Alta</label>
          <input
            name="presionAlta"
            value={condenserForm.presionAlta || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 150 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Baja</label>
          <input
            name="presionBaja"
            value={condenserForm.presionBaja || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 50 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>HP</label>
          <input
            name="hp"
            value={condenserForm.hp || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 2.5"
          />
        </div>
      </div>
    </div>
  );
}
