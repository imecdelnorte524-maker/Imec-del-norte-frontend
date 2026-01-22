import type React from "react"
import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"
import type { EvaporatorData } from "../../../../interfaces/EquipmentInterfaces"

interface EvaporatorFormProps {
  data: EvaporatorData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

export default function EvaporatorForm({ data, onChange, disabled }: EvaporatorFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos del Evaporador</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input name="marca" value={data.marca || ""} onChange={onChange} disabled={disabled} placeholder="Ej: Daikin" />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input name="modelo" value={data.modelo || ""} onChange={onChange} disabled={disabled} placeholder="Ej: FTXS50K" />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input name="serial" value={data.serial || ""} onChange={onChange} disabled={disabled} placeholder="Ej: EV-987654321" />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={data.capacidad || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 18000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={data.tipoRefrigerante || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: R-410A"
          />
        </div>
      </div>
    </div>
  )
}