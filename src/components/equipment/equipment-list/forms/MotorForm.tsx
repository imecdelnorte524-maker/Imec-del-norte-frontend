import type React from "react";
import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css";
import type { MotorData } from "../../../../interfaces/EquipmentInterfaces";

interface MotorFormProps {
  data: MotorData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export default function MotorForm({
  data,
  onChange,
  disabled,
}: MotorFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos del Motor</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={data.amperaje || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 8.5A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={data.voltaje || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 220-240V"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={data.numeroFases || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro Eje</label>
          <input
            name="diametroEje"
            value={data.diametroEje || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 19mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Eje</label>
          <input
            name="tipoEje"
            value={data.tipoEje || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: Cónico"
          />
        </div>
        <div className={styles.formField}>
          <label>RPM</label>
          <input
            name="rpm"
            value={data.rpm || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 1450"
          />
        </div>
        <div className={styles.formField}>
          <label>Correa</label>
          <input
            name="correa"
            value={data.correa || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: A-52"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro Polea</label>
          <input
            name="diametroPolea"
            value={data.diametroPolea || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 150mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad HP</label>
          <input
            name="capacidadHp"
            value={data.capacidadHp || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 1.5 HP"
          />
        </div>
        <div className={styles.formField}>
          <label>Frecuencia</label>
          <input
            name="frecuencia"
            value={data.frecuencia || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 60 Hz"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Parte</label>
          <input
            name=">Número de Parte"
            value={data.numero_parte || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: #3"
          />
        </div>
      </div>
    </div>
  );
}
