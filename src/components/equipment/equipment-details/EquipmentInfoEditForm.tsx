// src/components/equipment/equipment-details/EquipmentInfoEditForm.tsx
import type {
  Equipment,
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
  AirConditionerTypeOption,
} from "../../../interfaces/EquipmentInterfaces";
import HierarchicalAreaSelector from "./HierarchicalAreaSelector";
import ComponentsEditForms from "./ComponentsEditForms";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentInfoEditForm.module.css";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type {
  SimpleSubArea,
  SubAreaWithChildren,
} from "../../../interfaces/SubAreaInterfaces";

interface EquipmentInfoEditFormProps {
  equipment: Equipment;
  editForm: {
    name: string;
    physicalLocation: string;
    installationDate: string;
    notes: string;
  };
  saving: boolean;
  loadingLocations: boolean;
  locationsError: string | null;
  areas: AreaSimple[];
  subAreas: SimpleSubArea[];
  selectedAreaId: number | "";
  selectedSubAreaId: number | "";
  selectedSubSubAreaId: number | "";
  selectedSubAreaWithChildren: SubAreaWithChildren | null;
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcTypeId: number | "";
  selectedAcType: AirConditionerTypeOption | undefined;
  motorForm: MotorData;
  evaporatorForm: EvaporatorData;
  condenserForm: CondenserData;
  compressorForm: CompressorData;

  // Handlers
  onEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAcTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onMotorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEvaporatorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCondenserFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompressorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function EquipmentInfoEditForm({
  equipment,
  editForm,
  saving,
  loadingLocations,
  locationsError,
  areas,
  selectedAreaId,
  selectedSubAreaId,
  airConditionerTypes,
  selectedAcTypeId,
  selectedAcType,
  motorForm,
  evaporatorForm,
  condenserForm,
  compressorForm,
  onEditChange,
  onAreaChange,
  onSubAreaChange,
  onAcTypeChange,
  onMotorFormChange,
  onEvaporatorFormChange,
  onCondenserFormChange,
  onCompressorFormChange,
  onSave,
  onCancel,
}: EquipmentInfoEditFormProps) {
  return (
    <form onSubmit={onSave} className={styles.editForm}>
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

      <HierarchicalAreaSelector
        areas={areas}
        selectedAreaId={selectedAreaId}
        selectedSubAreaId={selectedSubAreaId}
        disabled={saving || loadingLocations}
        error={locationsError}
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

      <ComponentsEditForms
        saving={saving}
        selectedAcType={selectedAcType}
        motorForm={motorForm}
        evaporatorForm={evaporatorForm}
        condenserForm={condenserForm}
        compressorForm={compressorForm}
        onMotorFormChange={onMotorFormChange}
        onEvaporatorFormChange={onEvaporatorFormChange}
        onCondenserFormChange={onCondenserFormChange}
        onCompressorFormChange={onCompressorFormChange}
      />

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}