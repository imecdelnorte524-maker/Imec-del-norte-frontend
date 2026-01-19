// src/components/equipment-details/forms/CompressorEditForm.tsx
import type { CompressorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface CompressorEditFormProps {
  compressorForm: CompressorData;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CompressorEditForm({
  compressorForm,
  saving,
  onChange,
}: CompressorEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <h5>Compresor</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input
            name="marca"
            value={compressorForm.marca || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Samsung"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={compressorForm.modelo || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: AEV12"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={compressorForm.serial || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: EV123456"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={compressorForm.capacidad || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 12000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={compressorForm.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 8A"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={compressorForm.tipoRefrigerante || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: R410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={compressorForm.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 220V"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={compressorForm.numeroFases || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo de Aceite</label>
          <input
            name="tipoAceite"
            value={compressorForm.tipoAceite || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 15W"
          />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Aceite</label>
          <input
            name="cantidadAceite"
            value={compressorForm.cantidadAceite || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 2L"
          />
        </div>
      </div>
    </div>
  );
}
