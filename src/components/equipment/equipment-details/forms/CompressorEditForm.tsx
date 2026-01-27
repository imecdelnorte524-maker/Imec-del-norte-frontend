// src/components/equipment/equipment-details/forms/CompressorEditForm.tsx
import type { CompressorData } from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface CompressorEditFormProps {
  compressor: CompressorData;
  index: number;
  saving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Cambiado: sin índice
  onRemove?: () => void;
}

export default function CompressorEditForm({
  compressor,
  index,
  saving,
  onChange,
  onRemove,
}: CompressorEditFormProps) {
  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Compresor {index + 1}</h5>
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
            value={compressor.marca || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: Copeland"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input
            name="modelo"
            value={compressor.modelo || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: ZR48K5E"
          />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input
            name="serial"
            value={compressor.serial || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: CMP-1122334455"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={compressor.capacidad || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 48000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input
            name="voltaje"
            value={compressor.voltaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 380V"
          />
        </div>
        <div className={styles.formField}>
          <label>Frecuencia</label>
          <input
            name="frecuencia"
            value={compressor.frecuencia || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 60 Hz"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={compressor.tipoRefrigerante || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: R-410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo de Aceite</label>
          <input
            name="tipoAceite"
            value={compressor.tipoAceite || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: POE"
          />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Aceite</label>
          <input
            name="cantidadAceite"
            value={compressor.cantidadAceite || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 1.8 L"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacitor</label>
          <input
            name="capacitor"
            value={compressor.capacitor || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 45/5 µF"
          />
        </div>
        <div className={styles.formField}>
          <label>LRA</label>
          <input
            name="lra"
            value={compressor.lra || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 120A"
          />
        </div>
        <div className={styles.formField}>
          <label>FLA</label>
          <input
            name="fla"
            value={compressor.fla || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 18A"
          />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Polos</label>
          <input
            name="cantidadPolos"
            value={compressor.cantidadPolos || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 4"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input
            name="amperaje"
            value={compressor.amperaje || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 16A"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje de Bobina</label>
          <input
            name="voltajeBobina"
            value={compressor.voltajeBobina || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 24V"
          />
        </div>
        <div className={styles.formField}>
          <label>VAC</label>
          <input
            name="vac"
            value={compressor.vac || ""}
            onChange={onChange}
            disabled={saving}
            placeholder="Ej: 230V"
          />
        </div>
      </div>
    </div>
  );
}