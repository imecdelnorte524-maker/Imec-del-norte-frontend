// src/components/equipment/equipment-details/forms/CondenserEditForm.tsx
import type { CondenserData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";
import MotorEditForm from "./MotorEditForm";
import CompressorEditForm from "./CompressorEditForm";

interface CondenserEditFormProps {
  condenser: CondenserData;
  index: number;
  saving: boolean;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMotor?: () => void;
  onAddCompressor?: () => void;
  canRemove?: boolean;
  onRemove?: () => void;
  onMotorChange?: (condenserIndex: number, motorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompressorChange?: (condenserIndex: number, compressorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMotorToCondenser?: (condenserIndex: number) => void;
  onAddCompressorToCondenser?: (condenserIndex: number) => void;
  onRemoveMotor?: (condenserIndex: number, motorIndex: number) => void;
  onRemoveCompressor?: (condenserIndex: number, compressorIndex: number) => void;
}

export default function CondenserEditForm({
  condenser,
  index,
  saving,
  onChange,
  onAddMotor,
  onAddCompressor,
  canRemove,
  onRemove,
  onMotorChange,
  onCompressorChange,
  onAddMotorToCondenser,
  onAddCompressorToCondenser,
  onRemoveMotor,
  onRemoveCompressor,
}: CondenserEditFormProps) {
  const hasMotors = condenser.motors && condenser.motors.length > 0;
  const hasCompressors = condenser.compressors && condenser.compressors.length > 0;

  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Condensadora {index + 1}</h5>
        {canRemove && (
          <button 
            type="button" 
            className={styles.removeButton}
            onClick={onRemove}
            disabled={saving}
          >
            ✕ Eliminar condensadora
          </button>
        )}
      </div>
      
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input
            name="marca"
            value={condenser.marca || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: Daikin"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={condenser.modelo || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: RXS50K"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={condenser.serial || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: CN-456789123"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={condenser.capacidad || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 18000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={condenser.amperaje || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 9A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={condenser.voltaje || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 220V"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={condenser.tipoRefrigerante || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: R-410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={condenser.numeroFases || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Alta</label>
          <input
            name="presionAlta"
            value={condenser.presionAlta || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 320 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Baja</label>
          <input
            name="presionBaja"
            value={condenser.presionBaja || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 120 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>HP</label>
          <input
            name="hp"
            value={condenser.hp || ""}
            onChange={(e) => onChange(index, e)}
            disabled={saving}
            placeholder="Ej: 3.5 HP"
          />
        </div>
      </div>

      {/* SECCIÓN DE MOTORES */}
      {hasMotors && (
        <div className={styles.motorsSection}>
          <h6>Motores de la Condensadora</h6>
          {condenser.motors?.map((motor, motorIndex) => (
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

      {/* SECCIÓN DE COMPRESORES */}
      {hasCompressors && (
        <div className={styles.compressorsSection}>
          <h6>Compresores de la Condensadora</h6>
          {condenser.compressors?.map((compressor, compressorIndex) => (
            <div key={compressorIndex} className={styles.compressorItem}>
              <CompressorEditForm
                compressor={compressor}
                index={compressorIndex}
                saving={saving}
                onChange={(e) => onCompressorChange?.(index, compressorIndex, e)}
                onRemove={onRemoveCompressor 
                  ? () => onRemoveCompressor(index, compressorIndex) 
                  : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Botones para agregar motores y compresores */}
      <div className={styles.componentActions}>
        {(onAddMotor || onAddMotorToCondenser) && (
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAddMotorToCondenser 
              ? () => onAddMotorToCondenser(index) 
              : onAddMotor}
            disabled={saving}
          >
            + Agregar Motor
          </button>
        )}
        {(onAddCompressor || onAddCompressorToCondenser) && (
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAddCompressorToCondenser 
              ? () => onAddCompressorToCondenser(index) 
              : onAddCompressor}
            disabled={saving}
          >
            + Agregar Compresor
          </button>
        )}
      </div>
    </div>
  );
}