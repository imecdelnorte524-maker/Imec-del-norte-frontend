import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsReadOnly.module.css";

interface ComponentsReadOnlyProps {
  equipment: Equipment;
}

export default function ComponentsReadOnly({
  equipment,
}: ComponentsReadOnlyProps) {
  const hasEvaporators = equipment.evaporators && equipment.evaporators.length > 0;
  const hasCondensers = equipment.condensers && equipment.condensers.length > 0;
  const hasComponents = hasEvaporators || hasCondensers;

  return (
    <div className={styles.section}>
      <h3>Componentes del Equipo</h3>

      {/* EVAPORADORES */}
      {hasEvaporators && (
        <div className={styles.componentGroup}>
          <h4>Evaporadores</h4>
          {equipment.evaporators!.map((evaporator, index) => (
            <div key={index} className={styles.componentSection}>
              <h5>Evaporador {index + 1}</h5>
              <div className={styles.detailGrid}>
                {evaporator.marca && (
                  <div className={styles.detailItem}>
                    <strong>Marca:</strong>
                    <span>{evaporator.marca}</span>
                  </div>
                )}
                {evaporator.modelo && (
                  <div className={styles.detailItem}>
                    <strong>Modelo:</strong>
                    <span>{evaporator.modelo}</span>
                  </div>
                )}
                {evaporator.serial && (
                  <div className={styles.detailItem}>
                    <strong>Serial:</strong>
                    <span>{evaporator.serial}</span>
                  </div>
                )}
                {evaporator.capacidad && (
                  <div className={styles.detailItem}>
                    <strong>Capacidad:</strong>
                    <span>{evaporator.capacidad}</span>
                  </div>
                )}
                {evaporator.tipoRefrigerante && (
                  <div className={styles.detailItem}>
                    <strong>Tipo Refrigerante:</strong>
                    <span>{evaporator.tipoRefrigerante}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONDENSADORAS */}
      {hasCondensers && (
        <div className={styles.componentGroup}>
          <h4>Condensadoras</h4>
          {equipment.condensers!.map((condenser, index) => (
            <div key={index} className={styles.componentSection}>
              <h5>Condensadora {index + 1}</h5>
              <div className={styles.detailGrid}>
                {condenser.marca && (
                  <div className={styles.detailItem}>
                    <strong>Marca:</strong>
                    <span>{condenser.marca}</span>
                  </div>
                )}
                {condenser.modelo && (
                  <div className={styles.detailItem}>
                    <strong>Modelo:</strong>
                    <span>{condenser.modelo}</span>
                  </div>
                )}
                {condenser.serial && (
                  <div className={styles.detailItem}>
                    <strong>Serial:</strong>
                    <span>{condenser.serial}</span>
                  </div>
                )}
                {condenser.capacidad && (
                  <div className={styles.detailItem}>
                    <strong>Capacidad:</strong>
                    <span>{condenser.capacidad}</span>
                  </div>
                )}
                {condenser.amperaje && (
                  <div className={styles.detailItem}>
                    <strong>Amperaje:</strong>
                    <span>{condenser.amperaje}</span>
                  </div>
                )}
                {condenser.voltaje && (
                  <div className={styles.detailItem}>
                    <strong>Voltaje:</strong>
                    <span>{condenser.voltaje}</span>
                  </div>
                )}
                {condenser.tipoRefrigerante && (
                  <div className={styles.detailItem}>
                    <strong>Tipo Refrigerante:</strong>
                    <span>{condenser.tipoRefrigerante}</span>
                  </div>
                )}
                {condenser.numeroFases && (
                  <div className={styles.detailItem}>
                    <strong>Número de Fases:</strong>
                    <span>{condenser.numeroFases}</span>
                  </div>
                )}
                {condenser.presionAlta && (
                  <div className={styles.detailItem}>
                    <strong>Presión Alta:</strong>
                    <span>{condenser.presionAlta}</span>
                  </div>
                )}
                {condenser.presionBaja && (
                  <div className={styles.detailItem}>
                    <strong>Presión Baja:</strong>
                    <span>{condenser.presionBaja}</span>
                  </div>
                )}
                {condenser.hp && (
                  <div className={styles.detailItem}>
                    <strong>HP:</strong>
                    <span>{condenser.hp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasComponents && (
        <p className={styles.emptyComponents}>
          No hay componentes registrados para este equipo.
        </p>
      )}
    </div>
  );
}