// src/components/equipment/equipment-details/ComponentsEditForms.tsx
import type { EvaporatorData, CondenserData } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsEditForms.module.css";

// Importar directamente desde el mismo directorio
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
  canHaveMultipleComponents?: boolean;
}

export default function ComponentsEditForms({
  saving,
  evaporators = [],
  condensers = [],
  onEvaporatorsChange,
  onCondensersChange,
  canAddMoreEvaporators = true,
  canAddMoreCondensers = true,
  canHaveMultipleComponents = false,
}: ComponentsEditFormsProps) {
  // Manejar cambios en evaporadores
  const handleEvaporatorChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...evaporators];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    onEvaporatorsChange(updated);
  };

  // Manejar cambios en condensadoras
  const handleCondenserChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...condensers];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    onCondensersChange(updated);
  };

  // Agregar nuevo evaporador
  const handleAddEvaporator = () => {
    onEvaporatorsChange([...evaporators, {}]);
  };

  // Agregar nueva condensadora
  const handleAddCondenser = () => {
    onCondensersChange([...condensers, {}]);
  };

  // Eliminar evaporador
  const handleRemoveEvaporator = (index: number) => {
    const updated = evaporators.filter((_, i) => i !== index);
    onEvaporatorsChange(updated);
  };

  // Eliminar condensadora
  const handleRemoveCondenser = (index: number) => {
    const updated = condensers.filter((_, i) => i !== index);
    onCondensersChange(updated);
  };

  // Manejar cambios en motores de evaporador
  const handleEvaporatorMotorChange = (evaporatorIndex: number, motorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...evaporators];
    if (updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors![motorIndex] = {
        ...updated[evaporatorIndex].motors![motorIndex],
        [e.target.name]: e.target.value
      };
      onEvaporatorsChange(updated);
    }
  };

  // Agregar motor a evaporador
  const handleAddMotorToEvaporator = (evaporatorIndex: number) => {
    const updated = [...evaporators];
    if (!updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors = [];
    }
    updated[evaporatorIndex].motors!.push({});
    onEvaporatorsChange(updated);
  };

  // Eliminar motor de evaporador
  const handleRemoveMotorFromEvaporator = (evaporatorIndex: number, motorIndex: number) => {
    const updated = [...evaporators];
    if (updated[evaporatorIndex].motors) {
      updated[evaporatorIndex].motors = 
        updated[evaporatorIndex].motors!.filter((_, i) => i !== motorIndex);
      onEvaporatorsChange(updated);
    }
  };

  // Manejar cambios en motores de condensadora
  const handleCondenserMotorChange = (condenserIndex: number, motorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...condensers];
    if (updated[condenserIndex].motors) {
      updated[condenserIndex].motors![motorIndex] = {
        ...updated[condenserIndex].motors![motorIndex],
        [e.target.name]: e.target.value
      };
      onCondensersChange(updated);
    }
  };

  // Agregar motor a condensadora
  const handleAddMotorToCondenser = (condenserIndex: number) => {
    const updated = [...condensers];
    if (!updated[condenserIndex].motors) {
      updated[condenserIndex].motors = [];
    }
    updated[condenserIndex].motors!.push({});
    onCondensersChange(updated);
  };

  // Eliminar motor de condensadora
  const handleRemoveMotorFromCondenser = (condenserIndex: number, motorIndex: number) => {
    const updated = [...condensers];
    if (updated[condenserIndex].motors) {
      updated[condenserIndex].motors = 
        updated[condenserIndex].motors!.filter((_, i) => i !== motorIndex);
      onCondensersChange(updated);
    }
  };

  // Manejar cambios en compresores de condensadora
  const handleCondenserCompressorChange = (condenserIndex: number, compressorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = [...condensers];
    if (updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors![compressorIndex] = {
        ...updated[condenserIndex].compressors![compressorIndex],
        [e.target.name]: e.target.value
      };
      onCondensersChange(updated);
    }
  };

  // Agregar compresor a condensadora
  const handleAddCompressorToCondenser = (condenserIndex: number) => {
    const updated = [...condensers];
    if (!updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors = [];
    }
    updated[condenserIndex].compressors!.push({});
    onCondensersChange(updated);
  };

  // Eliminar compresor de condensadora
  const handleRemoveCompressorFromCondenser = (condenserIndex: number, compressorIndex: number) => {
    const updated = [...condensers];
    if (updated[condenserIndex].compressors) {
      updated[condenserIndex].compressors = 
        updated[condenserIndex].compressors!.filter((_, i) => i !== compressorIndex);
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
                onRemove={canHaveMultipleComponents && evaporators.length > 1 
                  ? () => handleRemoveEvaporator(index) 
                  : undefined}
                onAddMotorToEvaporator={() => handleAddMotorToEvaporator(index)}
                onMotorChange={handleEvaporatorMotorChange}
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
                onRemove={canHaveMultipleComponents && condensers.length > 1 
                  ? () => handleRemoveCondenser(index) 
                  : undefined}
                onAddMotorToCondenser={() => handleAddMotorToCondenser(index)}
                onAddCompressorToCondenser={() => handleAddCompressorToCondenser(index)}
                onMotorChange={handleCondenserMotorChange}
                onCompressorChange={handleCondenserCompressorChange}
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