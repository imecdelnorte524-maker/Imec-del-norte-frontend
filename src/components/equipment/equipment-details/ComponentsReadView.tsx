import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsReadView.module.css";

interface ComponentsReadViewProps {
  equipment: Equipment;
}

export default function ComponentsReadView({
  equipment,
}: ComponentsReadViewProps) {
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

              {/* Motores dentro del evaporador */}
              {evaporator.motors && evaporator.motors.length > 0 && (
                <div className={styles.nestedSection}>
                  <h6>Motores</h6>
                  {evaporator.motors.map((motor, motorIndex) => (
                    <div key={motorIndex} className={styles.motorSection}>
                      <h6>Motor {motorIndex + 1}</h6>
                      <div className={styles.detailGrid}>
                        {motor.amperaje && (
                          <div className={styles.detailItem}>
                            <strong>Amperaje:</strong>
                            <span>{motor.amperaje}</span>
                          </div>
                        )}
                        {motor.voltaje && (
                          <div className={styles.detailItem}>
                            <strong>Voltaje:</strong>
                            <span>{motor.voltaje}</span>
                          </div>
                        )}
                        {motor.numeroFases && (
                          <div className={styles.detailItem}>
                            <strong>Número de Fases:</strong>
                            <span>{motor.numeroFases}</span>
                          </div>
                        )}
                        {motor.diametroEje && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro Eje:</strong>
                            <span>{motor.diametroEje}</span>
                          </div>
                        )}
                        {motor.tipoEje && (
                          <div className={styles.detailItem}>
                            <strong>Tipo Eje:</strong>
                            <span>{motor.tipoEje}</span>
                          </div>
                        )}
                        {motor.rpm && (
                          <div className={styles.detailItem}>
                            <strong>RPM:</strong>
                            <span>{motor.rpm}</span>
                          </div>
                        )}
                        {motor.correa && (
                          <div className={styles.detailItem}>
                            <strong>Correa:</strong>
                            <span>{motor.correa}</span>
                          </div>
                        )}
                        {motor.diametroPolea && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro Polea:</strong>
                            <span>{motor.diametroPolea}</span>
                          </div>
                        )}
                        {motor.capacidadHp && (
                          <div className={styles.detailItem}>
                            <strong>Capacidad HP:</strong>
                            <span>{motor.capacidadHp}</span>
                          </div>
                        )}
                        {motor.frecuencia && (
                          <div className={styles.detailItem}>
                            <strong>Frecuencia:</strong>
                            <span>{motor.frecuencia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

              {/* Motores dentro de la condensadora */}
              {condenser.motors && condenser.motors.length > 0 && (
                <div className={styles.nestedSection}>
                  <h6>Motores</h6>
                  {condenser.motors.map((motor, motorIndex) => (
                    <div key={`motor-${motorIndex}`} className={styles.motorSection}>
                      <h6>Motor {motorIndex + 1}</h6>
                      <div className={styles.detailGrid}>
                        {motor.amperaje && (
                          <div className={styles.detailItem}>
                            <strong>Amperaje:</strong>
                            <span>{motor.amperaje}</span>
                          </div>
                        )}
                        {motor.voltaje && (
                          <div className={styles.detailItem}>
                            <strong>Voltaje:</strong>
                            <span>{motor.voltaje}</span>
                          </div>
                        )}
                        {motor.numeroFases && (
                          <div className={styles.detailItem}>
                            <strong>Número de Fases:</strong>
                            <span>{motor.numeroFases}</span>
                          </div>
                        )}
                        {motor.diametroEje && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro Eje:</strong>
                            <span>{motor.diametroEje}</span>
                          </div>
                        )}
                        {motor.tipoEje && (
                          <div className={styles.detailItem}>
                            <strong>Tipo Eje:</strong>
                            <span>{motor.tipoEje}</span>
                          </div>
                        )}
                        {motor.rpm && (
                          <div className={styles.detailItem}>
                            <strong>RPM:</strong>
                            <span>{motor.rpm}</span>
                          </div>
                        )}
                        {motor.correa && (
                          <div className={styles.detailItem}>
                            <strong>Correa:</strong>
                            <span>{motor.correa}</span>
                          </div>
                        )}
                        {motor.diametroPolea && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro Polea:</strong>
                            <span>{motor.diametroPolea}</span>
                          </div>
                        )}
                        {motor.capacidadHp && (
                          <div className={styles.detailItem}>
                            <strong>Capacidad HP:</strong>
                            <span>{motor.capacidadHp}</span>
                          </div>
                        )}
                        {motor.frecuencia && (
                          <div className={styles.detailItem}>
                            <strong>Frecuencia:</strong>
                            <span>{motor.frecuencia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compresores dentro de la condensadora */}
              {condenser.compressors && condenser.compressors.length > 0 && (
                <div className={styles.nestedSection}>
                  <h6>Compresores</h6>
                  {condenser.compressors.map((compressor, compressorIndex) => (
                    <div key={`compressor-${compressorIndex}`} className={styles.compressorSection}>
                      <h6>Compresor {compressorIndex + 1}</h6>
                      <div className={styles.detailGrid}>
                        {compressor.marca && (
                          <div className={styles.detailItem}>
                            <strong>Marca:</strong>
                            <span>{compressor.marca}</span>
                          </div>
                        )}
                        {compressor.modelo && (
                          <div className={styles.detailItem}>
                            <strong>Modelo:</strong>
                            <span>{compressor.modelo}</span>
                          </div>
                        )}
                        {compressor.serial && (
                          <div className={styles.detailItem}>
                            <strong>Serial:</strong>
                            <span>{compressor.serial}</span>
                          </div>
                        )}
                        {compressor.capacidad && (
                          <div className={styles.detailItem}>
                            <strong>Capacidad:</strong>
                            <span>{compressor.capacidad}</span>
                          </div>
                        )}
                        {compressor.voltaje && (
                          <div className={styles.detailItem}>
                            <strong>Voltaje:</strong>
                            <span>{compressor.voltaje}</span>
                          </div>
                        )}
                        {compressor.frecuencia && (
                          <div className={styles.detailItem}>
                            <strong>Frecuencia:</strong>
                            <span>{compressor.frecuencia}</span>
                          </div>
                        )}
                        {compressor.tipoRefrigerante && (
                          <div className={styles.detailItem}>
                            <strong>Tipo Refrigerante:</strong>
                            <span>{compressor.tipoRefrigerante}</span>
                          </div>
                        )}
                        {compressor.tipoAceite && (
                          <div className={styles.detailItem}>
                            <strong>Tipo de Aceite:</strong>
                            <span>{compressor.tipoAceite}</span>
                          </div>
                        )}
                        {compressor.cantidadAceite && (
                          <div className={styles.detailItem}>
                            <strong>Cantidad de Aceite:</strong>
                            <span>{compressor.cantidadAceite}</span>
                          </div>
                        )}
                        {compressor.capacitor && (
                          <div className={styles.detailItem}>
                            <strong>Capacitor:</strong>
                            <span>{compressor.capacitor}</span>
                          </div>
                        )}
                        {compressor.lra && (
                          <div className={styles.detailItem}>
                            <strong>LRA:</strong>
                            <span>{compressor.lra}</span>
                          </div>
                        )}
                        {compressor.fla && (
                          <div className={styles.detailItem}>
                            <strong>FLA:</strong>
                            <span>{compressor.fla}</span>
                          </div>
                        )}
                        {compressor.cantidadPolos && (
                          <div className={styles.detailItem}>
                            <strong>Cantidad de Polos:</strong>
                            <span>{compressor.cantidadPolos}</span>
                          </div>
                        )}
                        {compressor.amperaje && (
                          <div className={styles.detailItem}>
                            <strong>Amperaje:</strong>
                            <span>{compressor.amperaje}</span>
                          </div>
                        )}
                        {compressor.voltajeBobina && (
                          <div className={styles.detailItem}>
                            <strong>Voltaje Bobina:</strong>
                            <span>{compressor.voltajeBobina}</span>
                          </div>
                        )}
                        {compressor.vac && (
                          <div className={styles.detailItem}>
                            <strong>VAC:</strong>
                            <span>{compressor.vac}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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