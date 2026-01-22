import type { CondenserData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface CondenserEditFormProps {
  condenser: CondenserData;
  index: number;
  saving: boolean;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMotor?: () => void;
  onAddCompressor?: () => void;
  onRemove?: () => void;
}

export default function CondenserEditForm({
  condenser,
  index,
  saving,
  onChange,
  onAddMotor,
  onAddCompressor,
  onRemove,
}: CondenserEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Condensadora {index + 1}</h5>
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

      {/* Botones para agregar motores y compresores dentro de la condensadora */}
      <div className={styles.componentActions}>
        {onAddMotor && (
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAddMotor}
            disabled={saving}
          >
            + Agregar Motor
          </button>
        )}
        {onAddCompressor && (
          <button 
            type="button" 
            className={styles.addButton}
            onClick={onAddCompressor}
            disabled={saving}
          >
            + Agregar Compresor
          </button>
        )}
      </div>
    </div>
  );
}