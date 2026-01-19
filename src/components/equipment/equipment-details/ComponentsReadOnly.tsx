// src/components/equipment/equipment-details/ComponentsReadOnly.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsReadOnly.module.css";

interface ComponentsReadOnlyProps {
  equipment: Equipment;
}

export default function ComponentsReadOnly({
  equipment,
}: ComponentsReadOnlyProps) {
  const hasComponents =
    equipment.motor ||
    equipment.evaporator ||
    equipment.condenser ||
    equipment.compressor;

  return (
    <div className={styles.section}>
      <h3>Componentes del Equipo</h3>

      {/* Motor */}
      {equipment.motor && Object.values(equipment.motor).some((val) => val) && (
        <div className={styles.componentSection}>
          <h4>Motor</h4>
          <div className={styles.detailGrid}>
            {equipment.motor.amperaje && (
              <div className={styles.detailItem}>
                <strong>Amperaje:</strong>
                <span>{equipment.motor.amperaje}</span>
              </div>
            )}
            {equipment.motor.voltaje && (
              <div className={styles.detailItem}>
                <strong>Voltaje:</strong>
                <span>{equipment.motor.voltaje}</span>
              </div>
            )}
            {equipment.motor.rpm && (
              <div className={styles.detailItem}>
                <strong>RPM:</strong>
                <span>{equipment.motor.rpm}</span>
              </div>
            )}
            {equipment.motor.serialMotor && (
              <div className={styles.detailItem}>
                <strong>Serial Motor:</strong>
                <span>{equipment.motor.serialMotor}</span>
              </div>
            )}
            {equipment.motor.modeloMotor && (
              <div className={styles.detailItem}>
                <strong>Modelo Motor:</strong>
                <span>{equipment.motor.modeloMotor}</span>
              </div>
            )}
            {equipment.motor.diametroEje && (
              <div className={styles.detailItem}>
                <strong>Diámetro Eje:</strong>
                <span>{equipment.motor.diametroEje}</span>
              </div>
            )}
            {equipment.motor.tipoEje && (
              <div className={styles.detailItem}>
                <strong>Tipo Eje:</strong>
                <span>{equipment.motor.tipoEje}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evaporador */}
      {equipment.evaporator &&
        Object.values(equipment.evaporator).some((val) => val) && (
          <div className={styles.componentSection}>
            <h4>Evaporador</h4>
            <div className={styles.detailGrid}>
              {equipment.evaporator.marca && (
                <div className={styles.detailItem}>
                  <strong>Marca:</strong>
                  <span>{equipment.evaporator.marca}</span>
                </div>
              )}
              {equipment.evaporator.modelo && (
                <div className={styles.detailItem}>
                  <strong>Modelo:</strong>
                  <span>{equipment.evaporator.modelo}</span>
                </div>
              )}
              {equipment.evaporator.serial && (
                <div className={styles.detailItem}>
                  <strong>Serial:</strong>
                  <span>{equipment.evaporator.serial}</span>
                </div>
              )}
              {equipment.evaporator.capacidad && (
                <div className={styles.detailItem}>
                  <strong>Capacidad:</strong>
                  <span>{equipment.evaporator.capacidad}</span>
                </div>
              )}
              {equipment.evaporator.amperaje && (
                <div className={styles.detailItem}>
                  <strong>Amperaje:</strong>
                  <span>{equipment.evaporator.amperaje}</span>
                </div>
              )}
              {equipment.evaporator.tipoRefrigerante && (
                <div className={styles.detailItem}>
                  <strong>Tipo Refrigerante:</strong>
                  <span>{equipment.evaporator.tipoRefrigerante}</span>
                </div>
              )}
              {equipment.evaporator.voltaje && (
                <div className={styles.detailItem}>
                  <strong>Voltaje:</strong>
                  <span>{equipment.evaporator.voltaje}</span>
                </div>
              )}
              {equipment.evaporator.numeroFases && (
                <div className={styles.detailItem}>
                  <strong>Número de Fases:</strong>
                  <span>{equipment.evaporator.numeroFases}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Condensador */}
      {equipment.condenser &&
        Object.values(equipment.condenser).some((val) => val) && (
          <div className={styles.componentSection}>
            <h4>Condensador</h4>
            <div className={styles.detailGrid}>
              {equipment.condenser.marca && (
                <div className={styles.detailItem}>
                  <strong>Marca:</strong>
                  <span>{equipment.condenser.marca}</span>
                </div>
              )}
              {equipment.condenser.modelo && (
                <div className={styles.detailItem}>
                  <strong>Modelo:</strong>
                  <span>{equipment.condenser.modelo}</span>
                </div>
              )}
              {equipment.condenser.serial && (
                <div className={styles.detailItem}>
                  <strong>Serial:</strong>
                  <span>{equipment.condenser.serial}</span>
                </div>
              )}
              {equipment.condenser.capacidad && (
                <div className={styles.detailItem}>
                  <strong>Capacidad:</strong>
                  <span>{equipment.condenser.capacidad}</span>
                </div>
              )}
              {equipment.condenser.amperaje && (
                <div className={styles.detailItem}>
                  <strong>Amperaje:</strong>
                  <span>{equipment.condenser.amperaje}</span>
                </div>
              )}
              {equipment.condenser.voltaje && (
                <div className={styles.detailItem}>
                  <strong>Voltaje:</strong>
                  <span>{equipment.condenser.voltaje}</span>
                </div>
              )}
              {equipment.condenser.tipoRefrigerante && (
                <div className={styles.detailItem}>
                  <strong>Tipo Refrigerante:</strong>
                  <span>{equipment.condenser.tipoRefrigerante}</span>
                </div>
              )}
              {equipment.condenser.numeroFases && (
                <div className={styles.detailItem}>
                  <strong>Número de Fases:</strong>
                  <span>{equipment.condenser.numeroFases}</span>
                </div>
              )}
              {equipment.condenser.presionAlta && (
                <div className={styles.detailItem}>
                  <strong>Presión Alta:</strong>
                  <span>{equipment.condenser.presionAlta}</span>
                </div>
              )}
              {equipment.condenser.presionBaja && (
                <div className={styles.detailItem}>
                  <strong>Presión Baja:</strong>
                  <span>{equipment.condenser.presionBaja}</span>
                </div>
              )}
              {equipment.condenser.hp && (
                <div className={styles.detailItem}>
                  <strong>HP:</strong>
                  <span>{equipment.condenser.hp}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Compresor */}
      {equipment.compressor &&
        Object.values(equipment.compressor).some((val) => val) && (
          <div className={styles.componentSection}>
            <h4>Compresor</h4>
            <div className={styles.detailGrid}>
              {equipment.compressor.marca && (
                <div className={styles.detailItem}>
                  <strong>Marca:</strong>
                  <span>{equipment.compressor.marca}</span>
                </div>
              )}
              {equipment.compressor.modelo && (
                <div className={styles.detailItem}>
                  <strong>Modelo:</strong>
                  <span>{equipment.compressor.modelo}</span>
                </div>
              )}
              {equipment.compressor.serial && (
                <div className={styles.detailItem}>
                  <strong>Serial:</strong>
                  <span>{equipment.compressor.serial}</span>
                </div>
              )}
              {equipment.compressor.capacidad && (
                <div className={styles.detailItem}>
                  <strong>Capacidad:</strong>
                  <span>{equipment.compressor.capacidad}</span>
                </div>
              )}
              {equipment.compressor.amperaje && (
                <div className={styles.detailItem}>
                  <strong>Amperaje:</strong>
                  <span>{equipment.compressor.amperaje}</span>
                </div>
              )}
              {equipment.compressor.tipoRefrigerante && (
                <div className={styles.detailItem}>
                  <strong>Tipo Refrigerante:</strong>
                  <span>{equipment.compressor.tipoRefrigerante}</span>
                </div>
              )}
              {equipment.compressor.voltaje && (
                <div className={styles.detailItem}>
                  <strong>Voltaje:</strong>
                  <span>{equipment.compressor.voltaje}</span>
                </div>
              )}
              {equipment.compressor.numeroFases && (
                <div className={styles.detailItem}>
                  <strong>Número de Fases:</strong>
                  <span>{equipment.compressor.numeroFases}</span>
                </div>
              )}
              {equipment.compressor.tipoAceite && (
                <div className={styles.detailItem}>
                  <strong>Tipo de Aceite:</strong>
                  <span>{equipment.compressor.tipoAceite}</span>
                </div>
              )}
              {equipment.compressor.cantidadAceite && (
                <div className={styles.detailItem}>
                  <strong>Cantidad de Aceite:</strong>
                  <span>{equipment.compressor.cantidadAceite}</span>
                </div>
              )}
            </div>
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
