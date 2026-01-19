// src/components/equipment/equipment-details/EquipmentEditForm.tsx
import type {
  Equipment,
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
  AirConditionerTypeOption,
} from "../../../interfaces/EquipmentInterfaces";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import HierarchicalAreaSelectorDetail from "./HierarchicalAreaSelectorDetail";
import {
  MotorEditForm,
  EvaporatorEditForm,
  CondenserEditForm,
  CompressorEditForm,
} from "./forms";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentEditForm.module.css";

interface EditFormData {
  name: string;
  physicalLocation: string;
  installationDate: string;
  notes: string;
}

interface EquipmentEditFormProps {
  equipment: Equipment;
  editForm: EditFormData;
  motorForm: MotorData;
  evaporatorForm: EvaporatorData;
  condenserForm: CondenserData;
  compressorForm: CompressorData;

  // Áreas jerárquicas
  areas: AreaSimple[];
  selectedAreaId: number | "";
  selectedSubAreaId: number | "";

  // Tipos de AC
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcTypeId: number | "";
  selectedAcType: AirConditionerTypeOption | undefined;

  // Estado
  saving: boolean;
  loadingLocations: boolean;
  locationsError: string | null;

  // Handlers
  onEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onMotorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEvaporatorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCondenserFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompressorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAcTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function EquipmentEditForm({
  equipment,
  editForm,
  motorForm,
  evaporatorForm,
  condenserForm,
  compressorForm,
  areas,
  selectedAreaId,
  selectedSubAreaId,
  airConditionerTypes,
  selectedAcTypeId,
  selectedAcType,
  saving,
  loadingLocations,
  locationsError,
  onEditChange,
  onMotorFormChange,
  onEvaporatorFormChange,
  onCondenserFormChange,
  onCompressorFormChange,
  onAreaChange,
  onSubAreaChange,
  onAcTypeChange,
  onSubmit,
  onCancel,
}: EquipmentEditFormProps) {
  return (
    <div className={styles.section}>
      <h3>Información General</h3>

      <form onSubmit={onSubmit} className={styles.editForm}>
        <div className={styles.formRow}>
          <label>Nombre del equipo *</label>
          <input
            name="name"
            value={editForm.name}
            onChange={onEditChange}
            required
            disabled={saving}
          />
        </div>

        {equipment.code && (
          <div className={styles.formRow}>
            <label>Código interno (generado automáticamente)</label>
            <input disabled value={equipment.code} readOnly />
            <span className={styles.helperText}>
              Este código es generado por el sistema y no se puede editar.
            </span>
          </div>
        )}

        {equipment.category === "Aires Acondicionados" && (
          <div className={styles.formRow}>
            <label>Tipo de Aire Acondicionado</label>
            <select
              value={selectedAcTypeId || ""}
              onChange={onAcTypeChange}
              disabled={saving || loadingLocations}
            >
              <option value="">Seleccionar tipo...</option>
              {airConditionerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.formRow}>
          <label>Ubicación física</label>
          <input
            name="physicalLocation"
            value={editForm.physicalLocation}
            onChange={onEditChange}
            disabled={saving}
            placeholder="Ej: Techo bodega 1"
          />
        </div>

        {/* Selector jerárquico Área/Subárea */}
        <HierarchicalAreaSelectorDetail
          areas={areas}
          selectedAreaId={selectedAreaId}
          selectedSubAreaId={selectedSubAreaId}
          saving={saving}
          loadingLocations={loadingLocations}
          locationsError={locationsError}
          onAreaChange={onAreaChange}
          onSubAreaChange={onSubAreaChange}
        />

        <div className={styles.formRow}>
          <label>Fecha de instalación</label>
          <input
            type="date"
            name="installationDate"
            value={editForm.installationDate}
            onChange={onEditChange}
            disabled={saving}
          />
        </div>

        <div className={styles.formRow}>
          <label>Observaciones</label>
          <textarea
            name="notes"
            value={editForm.notes}
            onChange={onEditChange}
            rows={3}
            disabled={saving}
          />
        </div>

        {/* Sección de Componentes en Edición */}
        <div className={styles.componentsSection}>
          <h4>Componentes del Equipo</h4>

          <MotorEditForm
            motorForm={motorForm}
            saving={saving}
            onChange={onMotorFormChange}
          />

          {(!selectedAcType || selectedAcType.hasEvaporator) && (
            <EvaporatorEditForm
              evaporatorForm={evaporatorForm}
              saving={saving}
              onChange={onEvaporatorFormChange}
            />
          )}

          {(!selectedAcType || selectedAcType.hasCondenser) && (
            <CondenserEditForm
              condenserForm={condenserForm}
              saving={saving}
              onChange={onCondenserFormChange}
            />
          )}

          <CompressorEditForm
            compressorForm={compressorForm}
            saving={saving}
            onChange={onCompressorFormChange}
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}