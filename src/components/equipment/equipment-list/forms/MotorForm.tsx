"use client"

import type React from "react"

import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css"

interface MotorFormData {
  amperaje: string
  voltaje: string
  rpm: string
  serialMotor: string
  modeloMotor: string
  diametroEje: string
  tipoEje: string
}

interface MotorFormProps {
  data: MotorFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
}

export default function MotorForm({ data, onChange, disabled }: MotorFormProps) {
  return (
    <div className={styles.componentForm}>
      <h5>Datos del Motor</h5>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label>Amperaje</label>
          <input name="amperaje" value={data.amperaje} onChange={onChange} disabled={disabled} placeholder="Ej: 10A" />
        </div>
        <div className={styles.formField}>
          <label>Voltaje</label>
          <input name="voltaje" value={data.voltaje} onChange={onChange} disabled={disabled} placeholder="Ej: 220V" />
        </div>
        <div className={styles.formField}>
          <label>RPM</label>
          <input name="rpm" value={data.rpm} onChange={onChange} disabled={disabled} placeholder="Ej: 1500" />
        </div>
        <div className={styles.formField}>
          <label>Serial Motor</label>
          <input
            name="serialMotor"
            value={data.serialMotor}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: SN123456"
          />
        </div>
        <div className={styles.formField}>
          <label>Modelo Motor</label>
          <input
            name="modeloMotor"
            value={data.modeloMotor}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: MTR-001"
          />
        </div>
        <div className={styles.formField}>
          <label>Diámetro Eje</label>
          <input
            name="diametroEje"
            value={data.diametroEje}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: 12mm"
          />
        </div>
        <div className={styles.formField}>
          <label>Tipo Eje</label>
          <input
            name="tipoEje"
            value={data.tipoEje}
            onChange={onChange}
            disabled={disabled}
            placeholder="Ej: Redondo"
          />
        </div>
      </div>
    </div>
  )
}
