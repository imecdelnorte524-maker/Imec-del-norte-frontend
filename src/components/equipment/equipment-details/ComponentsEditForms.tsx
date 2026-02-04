// src/components/equipment/equipment-details/ComponentsEditForms.tsx
import type {
  EvaporatorData,
  CondenserData,
} from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsEditForms.module.css";

import EvaporatorEditForm from "./forms/EvaporatorEditForm";
import CondenserEditForm from "./forms/CondenserEditForm";

interface ComponentsEditFormsProps {
  saving: boolean;
  evaporators: EvaporatorData[];
  condensers: CondenserData[];
  onEvaporatorsChange: (evaporators: EvaporatorData[]) => void;
  onCondensersChange: (condensers: CondenserData[]) => void;
  canAddMoreEvaporators?: boolean;
  canAddMoreCondensers?: boolean;
  canHaveMultipleComponents?: boolean; // sigue existiendo por si lo usas para los botones "Agregar"
}

export default function ComponentsEditForms({
  saving,
  evaporators = [],
  condensers = [],
  onEvaporatorsChange,
  onCondensersChange,
  canAddMoreEvaporators = true,
  canAddMoreCondensers = true,
  // canHaveMultipleComponents = false,
}: ComponentsEditFormsProps) {
  // ───────────────────────────────────────────────────────────────
  // EVAPORADORES
  // ───────────────────────────────────────────────────────────────

  const handleEvaporatorChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const updated = [...evaporators];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    onEvaporatorsChange(updated);
  };

  const handleAddEvaporator = () => {
    onEvaporatorsChange([...evaporators, {}]);
  };

  const handleRemoveEvaporator = (index: number) => {
    const updated = evaporators.filter((_, i) => i !== index);
    onEvaporatorsChange(updated);
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
      updated[evaporatorIndex].motors = updated[
        evaporatorIndex
      ].motors!.filter((_, i) => i !== motorIndex);
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
      updated[condenserIndex].motors = updated[
        condenserIndex
      ].motors!.filter((_, i) => i !== motorIndex);
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

  return (
    <div className={styles.componentsSection}>
      <h4>Componentes del Equipo</h4>

      {/* EVAPORADORES */}
      <div className={styles.componentGroup}>
        <div className={styles.groupHeader}>
          <h5>Evaporadores</h5>
          {canAddMoreEvaporators && (
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
                // 🔹 AHORA SIEMPRE PERMITIMOS ELIMINAR
                onRemove={() => handleRemoveEvaporator(index)}
                onMotorChange={handleEvaporatorMotorChange}
                onAddMotorToEvaporator={() =>
                  handleAddMotorToEvaporator(index)
                }
                onRemoveMotor={handleRemoveMotorFromEvaporator}
              />
            </div>
          ))
        )}
      </div>

      {/* CONDENSADORAS */}
      <div className={styles.componentGroup}>
        <div className={styles.groupHeader}>
          <h5>Condensadoras</h5>
          {canAddMoreCondensers && (
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
                // 🔹 AHORA SIEMPRE PERMITIMOS ELIMINAR
                onRemove={() => handleRemoveCondenser(index)}
                onMotorChange={handleCondenserMotorChange}
                onCompressorChange={handleCondenserCompressorChange}
                onAddMotorToCondenser={() =>
                  handleAddMotorToCondenser(index)
                }
                onAddCompressorToCondenser={() =>
                  handleAddCompressorToCondenser(index)
                }
                onRemoveMotor={handleRemoveMotorFromCondenser}
                onRemoveCompressor={handleRemoveCompressorFromCondenser}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}