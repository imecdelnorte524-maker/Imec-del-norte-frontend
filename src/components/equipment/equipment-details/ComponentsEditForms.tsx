// src/components/equipment/equipment-details/ComponentsEditForms.tsx
import type {
  EvaporatorData,
  CondenserData,
  AirConditionerTypeOption,
} from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsEditForms.module.css";

import EvaporatorEditForm from "./forms/EvaporatorEditForm";
import CondenserEditForm from "./forms/CondenserEditForm";

const MULTIPLE_COMPONENT_TYPES = [
  "MultiSplit",
  "Refrigerante Variable",
  "VRF",
  "VRV",
  "Variable Refrigerant Flow",
  "Sistema Multi Split",
];

interface ComponentsEditFormsProps {
  saving: boolean;
  evaporators: EvaporatorData[];
  condensers: CondenserData[];
  onEvaporatorsChange: (evaporators: EvaporatorData[]) => void;
  onCondensersChange: (condensers: CondenserData[]) => void;
  canAddMoreEvaporators?: boolean;
  canAddMoreCondensers?: boolean;
  airConditionerTypeName?: string;
  canHaveMultipleComponents?: boolean;
  airConditionerTypes?: AirConditionerTypeOption[];
  onEvaporatorTypeChange?: (index: number, typeId: number) => void;
}

export default function ComponentsEditForms({
  saving,
  evaporators = [],
  condensers = [],
  onEvaporatorsChange,
  onCondensersChange,
  airConditionerTypeName = "",
  canHaveMultipleComponents = false,
  airConditionerTypes = [],
  onEvaporatorTypeChange,
}: ComponentsEditFormsProps) {
  const allowsMultipleComponents = (): boolean => {
    if (!airConditionerTypeName) return false;
    const typeName = airConditionerTypeName.toLowerCase();
    return MULTIPLE_COMPONENT_TYPES.some((multiType) =>
      typeName.includes(multiType.toLowerCase()),
    );
  };

  const canHaveMultiple =
    allowsMultipleComponents() || canHaveMultipleComponents;

  // ───────────────────────────────────────────────────────────────
  // EVAPORADORES
  // ───────────────────────────────────────────────────────────────

  const handleEvaporatorChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const updated = [...evaporators];

    // Si es el campo de tipo, convertirlo a número si es necesario
    if (name === "airConditionerTypeEvapId") {
      updated[index] = {
        ...updated[index],
        [name]: value ? parseInt(value) : undefined,
      };

      // Notificar al padre si hay un manejador específico
      if (onEvaporatorTypeChange && value) {
        onEvaporatorTypeChange(index, parseInt(value));
      }
    } else {
      updated[index] = { ...updated[index], [name]: value };
    }

    onEvaporatorsChange(updated);
  };

  const handleAddEvaporator = () => {
    onEvaporatorsChange([...evaporators, {}]);
  };

  const handleRemoveEvaporator = (index: number) => {
    const updated = evaporators.filter((_, i) => i !== index);
    onEvaporatorsChange(updated);
  };

  // Manejador específico para cambio de tipo
  const handleEvaporatorTypeChange = (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    const updated = [...evaporators];
    updated[index] = {
      ...updated[index],
      airConditionerTypeEvapId: value ? parseInt(value) : undefined,
    };
    onEvaporatorsChange(updated);

    if (onEvaporatorTypeChange && value) {
      onEvaporatorTypeChange(index, parseInt(value));
    }
  };

  // Motores de evaporador
  const handleEvaporatorMotorChange = (
    evaporatorIndex: number,
    motorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = [...evaporators];
    if (updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors![motorIndex] = {
        ...updated[evaporatorIndex].motors![motorIndex],
        [e.target.name]: e.target.value,
      };
      onEvaporatorsChange(updated);
    }
  };

  const handleAddMotorToEvaporator = (evaporatorIndex: number) => {
    const updated = [...evaporators];
    if (!updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors = [];
    }
    updated[evaporatorIndex].motors!.push({});
    onEvaporatorsChange(updated);
  };

  const handleRemoveMotorFromEvaporator = (
    evaporatorIndex: number,
    motorIndex: number,
  ) => {
    const updated = [...evaporators];
    if (updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors = updated[evaporatorIndex].motors!.filter(
        (_, i) => i !== motorIndex,
      );
      onEvaporatorsChange(updated);
    }
  };

  // ───────────────────────────────────────────────────────────────
  // CONDENSADORAS
  // ───────────────────────────────────────────────────────────────

  const handleCondenserChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = [...condensers];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    onCondensersChange(updated);
  };

  const handleAddCondenser = () => {
    onCondensersChange([...condensers, {}]);
  };

  const handleRemoveCondenser = (index: number) => {
    const updated = condensers.filter((_, i) => i !== index);
    onCondensersChange(updated);
  };

  // Motores de condensadora
  const handleCondenserMotorChange = (
    condenserIndex: number,
    motorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = [...condensers];
    if (updated[condenserIndex].motors) {
      updated[condenserIndex].motors![motorIndex] = {
        ...updated[condenserIndex].motors![motorIndex],
        [e.target.name]: e.target.value,
      };
      onCondensersChange(updated);
    }
  };

  const handleAddMotorToCondenser = (condenserIndex: number) => {
    const updated = [...condensers];
    if (!updated[condenserIndex].motors) {
      updated[condenserIndex].motors = [];
    }
    updated[condenserIndex].motors!.push({});
    onCondensersChange(updated);
  };

  const handleRemoveMotorFromCondenser = (
    condenserIndex: number,
    motorIndex: number,
  ) => {
    const updated = [...condensers];
    if (updated[condenserIndex].motors) {
      updated[condenserIndex].motors = updated[condenserIndex].motors!.filter(
        (_, i) => i !== motorIndex,
      );
      onCondensersChange(updated);
    }
  };

  // Compresores de condensadora
  const handleCondenserCompressorChange = (
    condenserIndex: number,
    compressorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = [...condensers];
    if (updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors![compressorIndex] = {
        ...updated[condenserIndex].compressors![compressorIndex],
        [e.target.name]: e.target.value,
      };
      onCondensersChange(updated);
    }
  };

  const handleAddCompressorToCondenser = (condenserIndex: number) => {
    const updated = [...condensers];
    if (!updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors = [];
    }
    updated[condenserIndex].compressors!.push({});
    onCondensersChange(updated);
  };

  const handleRemoveCompressorFromCondenser = (
    condenserIndex: number,
    compressorIndex: number,
  ) => {
    const updated = [...condensers];
    if (updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors = updated[
        condenserIndex
      ].compressors!.filter((_, i) => i !== compressorIndex);
      onCondensersChange(updated);
    }
  };

  // 🔥 REGLAS DE VISIBILIDAD DE BOTONES
  const evapCount = evaporators.length;
  const condCount = condensers.length;

  // Solo mostrar botón "Agregar Evaporador" si:
  // - Puede tener múltiples componentes O (no tiene ninguno)
  const canShowAddEvaporator = canHaveMultiple || evapCount === 0;

  // Solo mostrar botón "Agregar Condensadora" si:
  // - Puede tener múltiples componentes O (no tiene ninguna)
  const canShowAddCondenser = canHaveMultiple || condCount === 0;

  // Solo mostrar botón "Eliminar" en evaporadores si:
  // - Puede tener múltiples componentes Y (tiene más de 1)
  const canShowRemoveEvaporator = canHaveMultiple && evapCount > 1;

  // Solo mostrar botón "Eliminar" en condensadoras si:
  // - Puede tener múltiples componentes Y (tiene más de 1)
  const canShowRemoveCondenser = canHaveMultiple && condCount > 1;

  return (
    <div className={styles.componentsSection}>
      <h4>Componentes del Equipo</h4>

      {/* EVAPORADORES */}
      <div className={styles.componentGroup}>
        <div className={styles.groupHeader}>
          <h5>
            Evaporadores {!canHaveMultiple && evapCount > 0 && "(Máximo 1)"}
          </h5>
          {canShowAddEvaporator && (
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddEvaporator}
              disabled={saving}
            >
              + Agregar Evaporador
            </button>
          )}
        </div>

        {evaporators.length === 0 ? (
          <div className={styles.emptyComponent}>
            <p>No hay evaporadores registrados.</p>
          </div>
        ) : (
          evaporators.map((evaporator, index) => (
            <div key={index} className={styles.componentItem}>
              <EvaporatorEditForm
                evaporator={evaporator}
                index={index}
                saving={saving}
                onChange={handleEvaporatorChange}
                // Props para el selector de tipo
                showTypeSelector={canHaveMultiple}
                airConditionerTypes={airConditionerTypes}
                onTypeChange={handleEvaporatorTypeChange}
                // 👇 PASAMOS LA REGLA DE VISIBILIDAD
                canRemove={canShowRemoveEvaporator}
                onRemove={() => handleRemoveEvaporator(index)}
                onMotorChange={handleEvaporatorMotorChange}
                onAddMotorToEvaporator={() => handleAddMotorToEvaporator(index)}
                onRemoveMotor={handleRemoveMotorFromEvaporator}
              />
            </div>
          ))
        )}

        {/* Mensaje informativo para tipos que solo permiten 1 evaporador */}
        {!canHaveMultiple && evaporators.length === 1 && (
          <div className={styles.infoMessage}>
            <small>✓ Este tipo de aire solo permite un evaporador</small>
          </div>
        )}
      </div>

      {/* CONDENSADORAS */}
      <div className={styles.componentGroup}>
        <div className={styles.groupHeader}>
          <h5>
            Condensadoras {!canHaveMultiple && condCount > 0 && "(Máximo 1)"}
          </h5>
          {canShowAddCondenser && (
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddCondenser}
              disabled={saving}
            >
              + Agregar Condensadora
            </button>
          )}
        </div>

        {condensers.length === 0 ? (
          <div className={styles.emptyComponent}>
            <p>No hay condensadoras registradas.</p>
          </div>
        ) : (
          condensers.map((condenser, index) => (
            <div key={index} className={styles.componentItem}>
              <CondenserEditForm
                condenser={condenser}
                index={index}
                saving={saving}
                onChange={handleCondenserChange}
                canRemove={canShowRemoveCondenser}
                onRemove={() => handleRemoveCondenser(index)}
                onMotorChange={handleCondenserMotorChange}
                onCompressorChange={handleCondenserCompressorChange}
                onAddMotorToCondenser={() => handleAddMotorToCondenser(index)}
                onAddCompressorToCondenser={() =>
                  handleAddCompressorToCondenser(index)
                }
                onRemoveMotor={handleRemoveMotorFromCondenser}
                onRemoveCompressor={handleRemoveCompressorFromCondenser}
              />
            </div>
          ))
        )}

        {/* Mensaje informativo para tipos que solo permiten 1 condensadora */}
        {!canHaveMultiple && condensers.length === 1 && (
          <div className={styles.infoMessage}>
            <small>✓ Este tipo de aire solo permite una condensadora</small>
          </div>
        )}
      </div>
    </div>
  );
}
