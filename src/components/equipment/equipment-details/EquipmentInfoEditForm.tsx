// src/components/equipment/equipment-details/EquipmentInfoEditForm.tsx
import type {
  Equipment,
  EvaporatorData,
  CondenserData,
  AirConditionerTypeOption,
} from "../../../interfaces/EquipmentInterfaces";
import HierarchicalAreaSelector from "./HierarchicalAreaSelector";
import ComponentsEditForms from "./ComponentsEditForms";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentInfoEditForm.module.css";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";

// Tipos de aire acondicionado que permiten múltiples componentes
const MULTIPLE_COMPONENT_TYPES = [
  "MultiSplit",
  "Refrigerante Variable",
  "VRF",
  "VRV",
  "Variable Refrigerant Flow",
  "Sistema Multi Split",
];

interface EquipmentInfoEditFormProps {
  equipment: Equipment;
  editForm: {
    code?: string | null;
    installationDate: string;
    notes: string;
    status?: string;
  };
  saving: boolean;
  loadingLocations: boolean;
  locationsError: string | null;
  areas: AreaSimple[];
  selectedAreaId: number | null;
  selectedSubAreaId: number | null;
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcTypeId: number | null;
  selectedAcType: AirConditionerTypeOption | undefined;

  // Arrays de componentes (nueva estructura)
  evaporators: EvaporatorData[];
  condensers: CondenserData[];

  // Handlers
  onEditChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onEvaporatorsChange: (evaporators: EvaporatorData[]) => void;
  onCondensersChange: (condensers: CondenserData[]) => void;
  onEvaporatorTypeChange?: (index: number, typeId: number) => void; // 🔴 NUEVO
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
  evaporators,
  condensers,
  onEditChange,
  onAreaChange,
  onSubAreaChange,
  onEvaporatorsChange,
  onCondensersChange,
  onEvaporatorTypeChange, // 🔴 NUEVO
  onSave,
  onCancel,
}: EquipmentInfoEditFormProps) {
  // Función para verificar si el tipo seleccionado permite múltiples componentes
  const allowsMultipleComponents = (): boolean => {
    const typeToCheck = selectedAcType || equipment.airConditionerType;
    if (!typeToCheck || !typeToCheck.name) return false;
    const typeName = typeToCheck.name.toLowerCase();
    return MULTIPLE_COMPONENT_TYPES.some((multiType) =>
      typeName.includes(multiType.toLowerCase()),
    );
  };

  const canHaveMultipleComponents = allowsMultipleComponents();

  // Determinar si se pueden agregar más componentes
  const canAddMoreEvaporators =
    canHaveMultipleComponents || evaporators.length === 0;
  const canAddMoreCondensers =
    canHaveMultipleComponents || condensers.length === 0;

  // Si el equipo es de aires acondicionados, mostrar componentes
  const isAirConditioner = equipment.category === "Aires Acondicionados";

  return (
    <form onSubmit={onSave} className={styles.editForm}>
      {/* Código del equipo */}
      <div className={styles.formRow}>
        <label>Código del equipo</label>
        <input
          name="code"
          value={editForm.code || equipment.code || ""}
          onChange={onEditChange}
          disabled={saving}
          placeholder="Código del equipo"
        />
        <span className={styles.helperText}>
          {equipment.code ? "Código actual" : "Se generará automáticamente"}
        </span>
      </div>

      {/* Estado del equipo */}
      <div className={styles.formRow}>
        <label>Estado</label>
        <select
          name="status"
          value={editForm.status || equipment.status}
          onChange={onEditChange}
          disabled={saving}
        >
          <option value="Activo">Activo</option>
          <option value="Fuera de Servicio">Fuera de Servicio</option>
          <option value="Dado de Baja">Dado de Baja</option>
        </select>
      </div>

      {/* Tipo de aire acondicionado (solo para aires) */}
      {isAirConditioner && (
        <div className={styles.formRow}>
          <label>Tipo de Aire Acondicionado</label>
          <select
            name="airConditionerTypeId"
            value={selectedAcTypeId || equipment.airConditionerTypeId || ""}
            onChange={onEditChange}
            disabled={saving || loadingLocations}
          >
            <option value="">Seleccionar tipo...</option>
            {airConditionerTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {(selectedAcType || equipment.airConditionerType) && (
            <div className={styles.typeInfo}>
              <small>
                {canHaveMultipleComponents
                  ? "✓ Este tipo permite múltiples evaporadoras y condensadoras"
                  : "✓ Este tipo permite una sola evaporadora y una sola condensadora"}
              </small>
            </div>
          )}
        </div>
      )}

      {/* Ubicación jerárquica */}
      <HierarchicalAreaSelector
        areas={areas}
        selectedAreaId={selectedAreaId || ""}
        selectedSubAreaId={selectedSubAreaId || ""}
        disabled={saving || loadingLocations}
        error={locationsError}
        onAreaChange={onAreaChange}
        onSubAreaChange={onSubAreaChange}
      />

      {/* Fecha de instalación */}
      <div className={styles.formRow}>
        <label>Fecha de instalación</label>
        <input
          type="date"
          name="installationDate"
          value={editForm.installationDate || equipment.installationDate || ""}
          onChange={onEditChange}
          disabled={saving}
        />
      </div>

      {/* Observaciones */}
      <div className={styles.formRow}>
        <label>Observaciones</label>
        <textarea
          name="notes"
          value={editForm.notes || equipment.notes || ""}
          onChange={onEditChange}
          rows={3}
          disabled={saving}
          placeholder="Notas adicionales sobre el equipo..."
        />
      </div>

      {/* Componentes (solo para aires acondicionados) */}
      {isAirConditioner && (
        <ComponentsEditForms
          saving={saving}
          evaporators={evaporators}
          condensers={condensers}
          onEvaporatorsChange={onEvaporatorsChange}
          onCondensersChange={onCondensersChange}
          canAddMoreEvaporators={canAddMoreEvaporators}
          canAddMoreCondensers={canAddMoreCondensers}
          canHaveMultipleComponents={canHaveMultipleComponents}
          airConditionerTypeName={
            equipment?.airConditionerType?.name || selectedAcType?.name
          }
          airConditionerTypes={airConditionerTypes} // 🔴 PASAR LOS TIPOS
          onEvaporatorTypeChange={onEvaporatorTypeChange} // 🔴 PASAR EL HANDLER
        />
      )}

      {/* Botones de acción */}
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
