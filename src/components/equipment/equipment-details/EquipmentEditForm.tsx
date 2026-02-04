import type React from "react";
import type {
  Equipment,
  EvaporatorData,
  CondenserData,
  AirConditionerTypeOption,
  PlanMantenimientoData,
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
    status?: string;
  };
  evaporators: EvaporatorData[];
  condensers: CondenserData[];

  // Áreas jerárquicas
  areas: AreaSimple[];
  selectedAreaId: number | null;
  selectedSubAreaId: number | null;

  // Tipos de aire
  airConditionerTypes: AirConditionerTypeOption[];
  selectedAcTypeId: number | null;

  // Plan de mantenimiento
  planMantenimiento: PlanMantenimientoData | null;

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
  onAcTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onOpenNewAcTypeForm: () => void;
  onPlanMantenimientoChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
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
  airConditionerTypes,
  selectedAcTypeId,
  planMantenimiento,
  saving,
  loadingLocations,
  locationsError,
  onEditChange,
  onAreaChange,
  onSubAreaChange,
  onAcTypeChange,
  onOpenNewAcTypeForm,
  onPlanMantenimientoChange,
  onEvaporatorsChange,
  onCondensersChange,
  onSubmit,
  onCancel,
}: EquipmentEditFormProps) {
  // Valores normalizados del plan
  const unidadFrecuencia = planMantenimiento?.unidadFrecuencia || "";
  const diaDelMesValue =
    planMantenimiento?.diaDelMes != null
      ? String(planMantenimiento.diaDelMes)
      : "";
  const programmingDateValue = planMantenimiento?.fechaProgramada
    ? planMantenimiento.fechaProgramada.split("T")[0]
    : "";
  const notasPlan = planMantenimiento?.notas || "";

  const isAirConditioner = equipment.category === "Aires Acondicionados";

  // Manejar selección de tipo de aire (incluye opción "crear nuevo tipo")
  const handleAcTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      // Abrir modal para crear nuevo tipo y no cambiar el valor actual
      onOpenNewAcTypeForm();
      return;
    }
    onAcTypeChange(e);
  };

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

        {/* Selector de Tipo de Aire Acondicionado */}
        {isAirConditioner && (
          <div className={styles.formRow}>
            <label>Tipo de Aire Acondicionado</label>
            <select
              name="airConditionerTypeId"
              value={selectedAcTypeId || ""}
              onChange={handleAcTypeSelect}
              disabled={saving || airConditionerTypes.length === 0}
            >
              <option value="">Sin tipo</option>
              {airConditionerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
              <option value="__create_new__">+ Crear nuevo tipo...</option>
            </select>
            {airConditionerTypes.length === 0 && (
              <span className={styles.helperText}>
                No hay tipos registrados. Crea uno nuevo con la opción
                &quot;Crear nuevo tipo...&quot;.
              </span>
            )}
          </div>
        )}

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
        {isAirConditioner && (
          <ComponentsEditForms
            saving={saving}
            evaporators={evaporators}
            condensers={condensers}
            onEvaporatorsChange={onEvaporatorsChange}
            onCondensersChange={onCondensersChange}
          />
        )}
        
        {/* PLAN DE MANTENIMIENTO */}
        <div className={styles.planSection}>
          <h4>Plan de Mantenimiento (Opcional)</h4>

          <div className={styles.formRow}>
            <label>Unidad de Frecuencia</label>
            <select
              name="unidadFrecuencia"
              value={unidadFrecuencia}
              onChange={onPlanMantenimientoChange}
              disabled={saving}
            >
              <option value="">Sin plan</option>
              <option value="DIA">Día</option>
              <option value="SEMANA">Semana</option>
              <option value="MES">Mes</option>
            </select>
            <span className={styles.helperText}>
              Unidad básica de repetición del mantenimiento.
            </span>
          </div>

          <div className={styles.formRow}>
            <label>
              Cada{" "}
              {unidadFrecuencia === "DIA"
                ? "cuántos Días"
                : unidadFrecuencia === "SEMANA"
                  ? "cuántas Semanas"
                  : "cuántos Meses"}
            </label>
            <input
              type="number"
              name="diaDelMes"
              min={1}
              max={31}
              value={diaDelMesValue}
              onChange={onPlanMantenimientoChange}
              disabled={saving}
              placeholder="1-31"
            />
          </div>

          <div className={styles.formRow}>
            <label>Fecha Programada</label>
            <input
              type="date"
              name="fechaProgramada"
              value={programmingDateValue}
              onChange={onPlanMantenimientoChange}
              disabled={saving}
            />
            <span className={styles.helperText}>
              Fecha de la próxima intervención programada.
            </span>
          </div>

          <div className={styles.formRow}>
            <label>Razón del Cambio de Plan de Mantenimiento</label>
            <textarea
              name="notas"
              value={notasPlan}
              onChange={onPlanMantenimientoChange}
              rows={2}
              disabled={saving}
              placeholder="Notas sobre el cambio de plan de mantenimiento..."
            />
          </div>
        </div>

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
