"use client"

import type React from "react"

import styles from "../../../styles/components/equipment/equipment-list/CreateAcTypeModal.module.css"
import detailStyles from "../../../styles/components/equipment/equipment-list/CreateAcTypeModal.module.css"

interface NewAcTypeForm {
  name: string
  hasEvaporator: boolean
  hasCondenser: boolean
}

interface CreateAcTypeModalProps {
  isOpen: boolean
  form: NewAcTypeForm
  loading: boolean
  error: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export default function CreateAcTypeModal({
  isOpen,
  form,
  loading,
  error,
  onChange,
  onSubmit,
  onClose,
}: CreateAcTypeModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Crear Nuevo Tipo de Aire Acondicionado</h3>
            <button type="button" className={styles.modalCloseButton} onClick={onClose} disabled={loading}>
              ×
            </button>
          </div>

          {error && <div className={detailStyles.error}>{error}</div>}

          <form onSubmit={onSubmit}>
            <div className={styles.formRow}>
              <label>Nombre del Tipo *</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                disabled={loading}
                placeholder="Ej: Split, Ventana, etc."
              />
            </div>

            {/* <div className={styles.formRow}>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="hasEvaporator"
                    checked={form.hasEvaporator}
                    onChange={onChange}
                    disabled={loading}
                  />
                  Tiene Evaporador
                </label>
              </div>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="hasCondenser"
                    checked={form.hasCondenser}
                    onChange={onChange}
                    disabled={loading}
                  />
                  Tiene Condensador
                </label>
              </div>
            </div> */}

            <div className={styles.formActions}>
              <button type="button" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Tipo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
