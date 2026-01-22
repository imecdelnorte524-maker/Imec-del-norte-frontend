import type {
  Equipment,
  EvaporatorData,
  CondenserData,
} from "../../../interfaces/EquipmentInterfaces";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import HierarchicalAreaSelectorDetail from "./HierarchicalAreaSelectorDetail";
import ComponentsEditForms from "./ComponentsEditForms";
import styles from "../../../styles/components/equipment/equipment-details/EquipmentEditForm.module.css";

interface EquipmentEditFormProps {
  equipment: Equipment;
  editForm: {
    code?: string | null;
    installationDate: string;
    notes: string;
  };
  evaporators: EvaporatorData[];
  condensers: CondenserData[];

  // Áreas jerárquicas
  areas: AreaSimple[];
  selectedAreaId: number | null;
  selectedSubAreaId: number | null;

  // Estado
  saving: boolean;
  loadingLocations: boolean;
  locationsError: string | null;

  // Handlers
  onEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onEvaporatorsChange: (evaporators: EvaporatorData[]) => void;
  onCondensersChange: (condensers: CondenserData[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function EquipmentEditForm({
  equipment,
  editForm,
  evaporators,
  condensers,
  areas,
  selectedAreaId,
  selectedSubAreaId,
  saving,
  loadingLocations,
  locationsError,
  onEditChange,
  onAreaChange,
  onSubAreaChange,
  onEvaporatorsChange,
  onCondensersChange,
  onSubmit,
  onCancel,
}: EquipmentEditFormProps) {
  return (
    <div className={styles.section}>
      <h3>Información General</h3>

      <form onSubmit={onSubmit} className={styles.editForm}>
        <div className={styles.formRow}>
          <label>Código interno</label>
          <input
            name="code"
            value={editForm.code || equipment.code || ""}
            onChange={onEditChange}
            disabled
            placeholder="Código generado automáticamente"
          />
          <span className={styles.helperText}>
            {equipment.code ? "Se generará automáticamente" : ""}
          </span>
        </div>

        {/* Selector jerárquico Área/Subárea */}
        <HierarchicalAreaSelectorDetail
          areas={areas}
          selectedAreaId={selectedAreaId || ""}
          selectedSubAreaId={selectedSubAreaId || ""}
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
        {equipment.category === "Aires Acondicionados" && (
          <ComponentsEditForms
            saving={saving}
            evaporators={evaporators}
            condensers={condensers}
            onEvaporatorsChange={onEvaporatorsChange}
            onCondensersChange={onCondensersChange}
          />
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={saving ? styles.savingButton : styles.saveButton}
            onClick={onCancel}
            disabled={saving}
          >
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
