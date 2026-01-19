import type React from "react"

import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"

interface CompressorFormData {
  marca: string
  modelo: string
  serial: string
  capacidad: string
  amperaje: string
  tipoRefrigerante: string
  voltaje: string
  numeroFases: string
  tipoAceite: string
  cantidadAceite: string
}

interface CompressorFormProps {
  data: CompressorFormData
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
          <input name="marca" value={data.marca} onChange={onChange} disabled={disabled} placeholder="Ej: Samsung" />
        </div>
        <div className={styles.formField}>
          <label>Modelo</label>
          <input name="modelo" value={data.modelo} onChange={onChange} disabled={disabled} placeholder="Ej: AEV12" />
        </div>
        <div className={styles.formField}>
          <label>Serial</label>
          <input name="serial" value={data.serial} onChange={onChange} disabled={disabled} placeholder="Ej: EV123456" />
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
          <label>Voltaje</label>
          <input name="voltaje" value={data.voltaje} onChange={onChange} disabled={disabled} placeholder="Ej: 220V" />
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
          <label>Tipo de Aceite</label>
          <input
            name="tipoAceite"
            value={data.tipoAceite}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 15W"
          />
        </div>
        <div className={styles.formField}>
          <label>Cantidad de Aceite</label>
          <input
            name="cantidadAceite"
            value={data.cantidadAceite}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 500ml"
          />
        </div>
      </div>
    </div>
  )
}
