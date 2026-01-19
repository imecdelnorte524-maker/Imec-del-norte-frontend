import type React from "react"

import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"

interface CondenserFormData {
  marca: string
  modelo: string
  serial: string
  capacidad: string
  amperaje: string
  voltaje: string
  tipoRefrigerante: string
  numeroFases: string
  presionAlta: string
  presionBaja: string
  hp: string
}

interface CondenserFormProps {
  data: CondenserFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

export default function CondenserForm({ data, onChange, disabled }: CondenserFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos del Condensador</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Marca</label>
          <input name="marca" value={data.marca} onChange={onChange} disabled={disabled} placeholder="Ej: Samsung" />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input name="modelo" value={data.modelo} onChange={onChange} disabled={disabled} placeholder="Ej: CNV12" />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input name="serial" value={data.serial} onChange={onChange} disabled={disabled} placeholder="Ej: CN123456" />
        </div>
        <div className={styles.formField}>
          <label>Capacidad</label>
          <input
            name="capacidad"
            value={data.capacidad}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 12000 BTU"
          />
        </div>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input name="amperaje" value={data.amperaje} onChange={onChange} disabled={disabled} placeholder="Ej: 8A" />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input name="voltaje" value={data.voltaje} onChange={onChange} disabled={disabled} placeholder="Ej: 220V" />
        </div>
        <div className={styles.formField}>
          <label>Tipo Refrigerante</label>
          <input
            name="tipoRefrigerante"
            value={data.tipoRefrigerante}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: R410A"
          />
        </div>
        <div className={styles.formField}>
          <label>Número de Fases</label>
          <input
            name="numeroFases"
            value={data.numeroFases}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 1"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Alta</label>
          <input
            name="presionAlta"
            value={data.presionAlta}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 150 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>Presión Baja</label>
          <input
            name="presionBaja"
            value={data.presionBaja}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 50 PSI"
          />
        </div>
        <div className={styles.formField}>
          <label>HP</label>
          <input name="hp" value={data.hp} onChange={onChange} disabled={disabled} placeholder="Ej: 2.5" />
        </div>
      </div>
    </div>
  )
}
