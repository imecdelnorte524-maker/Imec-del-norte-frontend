// src/components/equipment/equipment-details/ComponentsEditForms.tsx
import type { EvaporatorData, CondenserData } from "../../../interfaces/EquipmentInterfaces";
// Importar desde la ubicación correcta de los formularios
// Asumiendo que EvaporatorForm y CondenserForm están en "../equipment-list/forms"
import { EvaporatorForm, CondenserForm } from "../equipment-list/forms";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsEditForms.module.css";

interface ComponentsEditFormsProps {
  saving: boolean;
  evaporators: EvaporatorData[];
  condensers: CondenserData[];
  onEvaporatorsChange: (evaporators: EvaporatorData[]) => void;
  onCondensersChange: (condensers: CondenserData[]) => void;
  // AGREGAR ESTAS NUEVAS PROPIEDADES:
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
              <div className={styles.componentItemHeader}>
                <h6>Evaporador {index + 1}</h6>
                {canHaveMultipleComponents && evaporators.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveEvaporator(index)}
                    disabled={saving}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>
              <EvaporatorForm
                data={evaporator}
                onChange={(e) => handleEvaporatorChange(index, e)}
                disabled={saving}
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
              <div className={styles.componentItemHeader}>
                <h6>Condensadora {index + 1}</h6>
                {canHaveMultipleComponents && condensers.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemoveCondenser(index)}
                    disabled={saving}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>
              <CondenserForm
                data={condenser}
                onChange={(e) => handleCondenserChange(index, e)}
                disabled={saving}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}