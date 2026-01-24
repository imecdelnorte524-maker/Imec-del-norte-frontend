import type React from "react"
import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"
import type { CondenserData } from "../../../../interfaces/EquipmentInterfaces"

interface CondenserFormProps {
  data: CondenserData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

export default function CondenserForm({ data, onChange, disabled }: CondenserFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos de la Condensadora</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input name="marca" value={data.marca || ""} onChange={onChange} disabled={disabled} placeholder="Ej: Daikin" />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input name="modelo" value={data.modelo || ""} onChange={onChange} disabled={disabled} placeholder="Ej: RXS50K" />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input name="serial" value={data.serial || ""} onChange={onChange} disabled={disabled} placeholder="Ej: CN-456789123" />
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
          <label>Amperaje</label>
          <input name="amperaje" value={data.amperaje || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 9A" />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input name="voltaje" value={data.voltaje || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 220V" />
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
          <label>Presión Alta</label>
          <input
            name="presionAlta"
            value={data.presionAlta || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 320 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Baja</label>
          <input
            name="presionBaja"
            value={data.presionBaja || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 120 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>HP</label>
          <input name="hp" value={data.hp || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 3.5 HP" />
        </div>
      </div>
    </div>
  )
}