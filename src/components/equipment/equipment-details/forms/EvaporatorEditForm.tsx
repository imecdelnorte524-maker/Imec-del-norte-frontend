// src/components/equipment/equipment-details/forms/EvaporatorEditForm.tsx
import type { EvaporatorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";
import MotorEditForm from "./MotorEditForm";

interface EvaporatorEditFormProps {
  evaporator: EvaporatorData;
  index: number;
  saving: boolean;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMotor?: () => void;
  onRemove?: () => void;
  onMotorChange?: (evaporatorIndex: number, motorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMotorToEvaporator?: (evaporatorIndex: number) => void;
  onRemoveMotor?: (evaporatorIndex: number, motorIndex: number) => void;
}

export default function EvaporatorEditForm({
  evaporator,
  index,
  saving,
  onChange,
  onAddMotor,
  onRemove,
  onMotorChange,
  onAddMotorToEvaporator,
  onRemoveMotor,
}: EvaporatorEditFormProps) {
  const hasMotors = evaporator.motors && evaporator.motors.length > 0;

  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Evaporador {index + 1}</h5>
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
          <label>Marca</label>
          <input
            name="marca"
            value={evaporator.marca || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: Daikin"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={evaporator.modelo || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: FTXS50K"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={evaporator.serial || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: EV-987654321"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={evaporator.capacidad || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 18000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={evaporator.tipoRefrigerante || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: R-410A"
          />
        </div>
      </div>

      {/* SECCIÓN DE MOTORES */}
      {hasMotors && (
        <div className={styles.motorsSection}>
          <h6>Motores del Evaporador</h6>
          {evaporator.motors?.map((motor, motorIndex) => (
            <div key={motorIndex} className={styles.motorItem}>
              <MotorEditForm
                motor={motor}
                index={motorIndex}
                saving={saving}
                onChange={(e) => onMotorChange?.(index, motorIndex, e)}
                onRemove={onRemoveMotor 
                  ? () => onRemoveMotor(index, motorIndex) 
                  : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar motor */}
      {(onAddMotor || onAddMotorToEvaporator) && (
        <div className={styles.componentActions}>
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAddMotorToEvaporator 
              ? () => onAddMotorToEvaporator(index) 
              : onAddMotor}
            disabled={saving}
          >
            + Agregar Motor
          </button>
        </div>
      )}
    </div>
  );
}