import type React from "react"
import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"
import type { CompressorData } from "../../../../interfaces/EquipmentInterfaces"

interface CompressorFormProps {
  data: CompressorData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

export default function CompressorForm({ data, onChange, disabled }: CompressorFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos del Compresor</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input name="marca" value={data.marca || ""} onChange={onChange} disabled={disabled} placeholder="Ej: Copeland" />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input name="modelo" value={data.modelo || ""} onChange={onChange} disabled={disabled} placeholder="Ej: ZR48K5E" />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input name="serial" value={data.serial || ""} onChange={onChange} disabled={disabled} placeholder="Ej: CMP-1122334455" />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={data.capacidad || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 48000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input name="voltaje" value={data.voltaje || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 380V" />
        </div>
        <div className={styles.formField}>
          <label>Frecuencia</label>
          <input name="frecuencia" value={data.frecuencia || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 60 Hz" />
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
          <label>Tipo de Aceite</label>
          <input
            name="tipoAceite"
            value={data.tipoAceite || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: POE"
          />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Aceite</label>
          <input
            name="cantidadAceite"
            value={data.cantidadAceite || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 1.8 L"
          />
        </div>
        <div className={styles.formField}>
          <label>Capacitor</label>
          <input name="capacitor" value={data.capacitor || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 45/5 µF" />
        </div>
        <div className={styles.formField}>
          <label>LRA</label>
          <input name="lra" value={data.lra || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 120A" />
        </div>
        <div className={styles.formField}>
          <label>FLA</label>
          <input name="fla" value={data.fla || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 18A" />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Polos</label>
          <input
            name="cantidadPolos"
            value={data.cantidadPolos || ""}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 4"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input name="amperaje" value={data.amperaje || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 16A" />
        </div>
        <div className={styles.formField}>
          <label>Voltaje Bobina</label>
          <input name="voltajeBobina" value={data.voltajeBobina || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 24V" />
        </div>
        <div className={styles.formField}>
          <label>VAC</label>
          <input name="vac" value={data.vac || ""} onChange={onChange} disabled={disabled} placeholder="Ej: 230V" />
        </div>
      </div>
    </div>
  )
}