// src/components/equipment/equipment-list/CreateEquipmentModal.tsx
import HierarchicalAreaSelector from "./HierarchicalAreaSelector";
import {
  MotorForm,
  EvaporatorForm,
  CondenserForm,
  CompressorForm,
} from "./forms";
import styles from "../../../styles/components/equipment/equipment-list/CreateEquipmentModal.module.css";
import detailStyles from "../../../styles/pages/EquipmentDetailPage.module.css";
import type {
  AirConditionerTypeOption,
  CompressorFormData,
  CondenserFormData,
  CreateEquipmentFormValues,
  EvaporatorFormData,
  MotorFormData,
} from "../../../interfaces/EquipmentInterfaces";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type { SubAreaWithChildren } from "../../../interfaces/SubAreaInterfaces";

interface CreateEquipmentModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  // Formulario principal
  createForm: CreateEquipmentFormValues;
  onCreateFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  // Tipos de aire acondicionado
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcType: AirConditionerTypeOption | undefined;
  onOpenNewAcTypeForm: () => void;
  // Áreas
  areas: AreaSimple[];
  selectedAreaId: number | "";
  selectedSubAreaId: number | "";
  // Estos siguen existiendo en las props para compatibilidad,
  // pero ya no los usamos en el selector jerárquico
  selectedSubSubAreaId: number | "";
  selectedSubAreaWithChildren: SubAreaWithChildren | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  // Componentes toggle
  showMotorForm: boolean;
  showEvaporatorForm: boolean;
  showCondenserForm: boolean;
  showCompressorForm: boolean;
  onToggleMotorForm: () => void;
  onToggleEvaporatorForm: () => void;
  onToggleCondenserForm: () => void;
  onToggleCompressorForm: () => void;
  // Formularios de componentes
  motorForm: MotorFormData;
  evaporatorForm: EvaporatorFormData;
  condenserForm: CondenserFormData;
  compressorForm: CompressorFormData;
  onMotorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEvaporatorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCondenserFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompressorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Acciones
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CreateEquipmentModal({
  isOpen,
  loading,
  error,
  createForm,
  onCreateFormChange,
  airConditionerTypes,
  selectedAcType,
  onOpenNewAcTypeForm,
  areas,
  selectedAreaId,
  selectedSubAreaId,
  onAreaChange,
  onSubAreaChange,
  showMotorForm,
  showEvaporatorForm,
  showCondenserForm,
  showCompressorForm,
  onToggleMotorForm,
  onToggleEvaporatorForm,
  onToggleCondenserForm,
  onToggleCompressorForm,
  motorForm,
  evaporatorForm,
  condenserForm,
  compressorForm,
  onMotorFormChange,
  onEvaporatorFormChange,
  onCondenserFormChange,
  onCompressorFormChange,
  onSubmit,
  onClose,
}: CreateEquipmentModalProps) {
  if (!isOpen) return null;

  const handleAcTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      onOpenNewAcTypeForm();
      // Reset the select
      const syntheticEvent = {
        target: { name: "airConditionerTypeId", value: "" },
      } as React.ChangeEvent<HTMLSelectElement>;
      onCreateFormChange(syntheticEvent);
    } else {
      onCreateFormChange(e);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Crear Hoja de Vida del Equipo</h3>
          <button
            type="button"
            className={styles.modalCloseButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className={detailStyles.error}>{error}</div>}

        <form onSubmit={onSubmit}>
          <div className={styles.formRow}>
            <label>Categoría del equipo *</label>
            <select
              name="category"
              value={createForm.category}
              onChange={onCreateFormChange}
              required
              disabled={loading}
            >
              <option value="Aires Acondicionados">Aires Acondicionados</option>
              <option value="Instalaciones Contra Incendio">
                Instalaciones Contra Incendio
              </option>
              <option value="Instalaciones Eléctricas">
                Instalaciones Eléctricas
              </option>
              <option value="Obra Civil">Obra Civil</option>
            </select>
          </div>

          {createForm.category === "Aires Acondicionados" && (
            <div className={styles.formRow}>
              <label>Tipo de Aire Acondicionado *</label>
              <div className={styles.creatableSelect}>
                <select
                  name="airConditionerTypeId"
                  value={createForm.airConditionerTypeId}
                  onChange={handleAcTypeSelect}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar tipo...</option>
                  {airConditionerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                  <option
                    value="__create_new__"
                    className={styles.createOption}
                  >
                    + Crear nuevo tipo...
                  </option>
                </select>
                {createForm.airConditionerTypeId && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => {
                      const syntheticEvent = {
                        target: { name: "airConditionerTypeId", value: "" },
                      } as React.ChangeEvent<HTMLSelectElement>;
                      onCreateFormChange(syntheticEvent);
                    }}
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
              {airConditionerTypes.length === 0 && (
                <span className={styles.helperText}>
                  No hay tipos registrados. Crea uno nuevo seleccionando "Crear
                  nuevo tipo..."
                </span>
              )}
            </div>
          )}

          <div className={styles.formRow}>
            <label>Nombre del equipo *</label>
            <input
              name="name"
              value={createForm.name}
              onChange={onCreateFormChange}
              required
              disabled={loading}
              placeholder="Ej: Aire sala de juntas"
            />
          </div>

          <div className={styles.formRow}>
            <label>Ubicación física</label>
            <input
              name="physicalLocation"
              value={createForm.physicalLocation}
              onChange={onCreateFormChange}
              disabled={loading}
              placeholder="Ej: Techo bodega 1"
            />
          </div>

          {/* Selector jerárquico de área / subárea (cualquier profundidad) */}
          <HierarchicalAreaSelector
            areas={areas}
            selectedAreaId={selectedAreaId}
            selectedSubAreaId={selectedSubAreaId}
            disabled={loading}
            onAreaChange={onAreaChange}
            onSubAreaChange={onSubAreaChange}
          />

          <div className={styles.formRow}>
            <label>Fecha de instalación</label>
            <input
              type="date"
              name="installationDate"
              value={createForm.installationDate}
              onChange={onCreateFormChange}
              disabled={loading}
            />
          </div>

          <div className={styles.formRow}>
            <label>Observaciones</label>
            <textarea
              name="notes"
              value={createForm.notes}
              onChange={onCreateFormChange}
              rows={3}
              disabled={loading}
              placeholder="Notas adicionales sobre el equipo..."
            />
          </div>

          {/* Sección de Componentes */}
          <div className={styles.componentsSection}>
            <h4>Componentes del Equipo (Opcionales)</h4>

            <div className={styles.componentToggle}>
              <button
                type="button"
                className={`${styles.componentToggleButton} ${
                  showMotorForm ? styles.active : ""
                }`}
                onClick={onToggleMotorForm}
                disabled={loading}
              >
                Motor {showMotorForm ? "✓" : "+"}
              </button>

              <button
                type="button"
                className={`${styles.componentToggleButton} ${
                  showEvaporatorForm ? styles.active : ""
                }`}
                onClick={onToggleEvaporatorForm}
                disabled={
                  loading ||
                  (createForm.category === "Aires Acondicionados" &&
                    selectedAcType &&
                    !selectedAcType.hasEvaporator)
                }
              >
                Evaporador {showEvaporatorForm ? "✓" : "+"}
              </button>

              <button
                type="button"
                className={`${styles.componentToggleButton} ${
                  showCondenserForm ? styles.active : ""
                }`}
                onClick={onToggleCondenserForm}
                disabled={
                  loading ||
                  (createForm.category === "Aires Acondicionados" &&
                    selectedAcType &&
                    !selectedAcType.hasCondenser)
                }
              >
                Condensador {showCondenserForm ? "✓" : "+"}
              </button>

              <button
                type="button"
                className={`${styles.componentToggleButton} ${
                  showCompressorForm ? styles.active : ""
                }`}
                onClick={onToggleCompressorForm}
                disabled={loading}
              >
                Compresor {showCompressorForm ? "✓" : "+"}
              </button>
            </div>

            {showMotorForm && (
              <MotorForm
                data={motorForm}
                onChange={onMotorFormChange}
                disabled={loading}
              />
            )}

            {showEvaporatorForm && (
              <EvaporatorForm
                data={evaporatorForm}
                onChange={onEvaporatorFormChange}
                disabled={loading}
              />
            )}

            {showCondenserForm && (
              <CondenserForm
                data={condenserForm}
                onChange={onCondenserFormChange}
                disabled={loading}
              />
            )}

            {showCompressorForm && (
              <CompressorForm
                data={compressorForm}
                onChange={onCompressorFormChange}
                disabled={loading}
              />
            )}
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Crear equipo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}