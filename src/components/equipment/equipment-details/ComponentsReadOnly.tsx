// src/components/equipment/equipment-details/ComponentsReadOnly.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/ComponentsReadOnly.module.css";

interface ComponentsReadOnlyProps {
  equipment: Equipment;
}

export default function ComponentsReadOnly({
  equipment,
}: ComponentsReadOnlyProps) {
  const evapCount = equipment.evaporators?.length ?? 0;
  const condCount = equipment.condensers?.length ?? 0;

  const hasEvaporators = evapCount > 0;
  const hasCondensers = condCount > 0;
  const hasComponents = hasEvaporators || hasCondensers;

  return (
    <div className={styles.section}>
      <h3>Componentes del Equipo</h3>

      {/* EVAPORADORES */}
      {hasEvaporators && (
        <div className={styles.componentGroup}>
          <h4>
            {evapCount === 1
              ? "Evaporador"
              : `Evaporadores (${evapCount})`}
          </h4>

          {equipment.evaporators!.map((evaporator, index) => (
            <div key={index} className={styles.componentSection}>
              <h5>
                {evapCount === 1
                  ? "Evaporador"
                  : `Evaporador ${index + 1}`}
              </h5>

              {/* Datos principales del evaporador */}
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

              {/* Motores del evaporador */}
              {evaporator.motors && evaporator.motors.length > 0 && (
                <div className={styles.subComponentGroup}>
                  <h5>
                    {evaporator.motors.length === 1
                      ? "Motor del Evaporador"
                      : `Motores del Evaporador (${evaporator.motors.length})`}
                  </h5>
                  {evaporator.motors.map((motor, mIndex) => (
                    <div
                      key={mIndex}
                      className={styles.subComponentSection}
                    >
                      <h6>
                        {evaporator.motors!.length === 1
                          ? "Motor"
                          : `Motor ${mIndex + 1}`}
                      </h6>
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
                        {motor.tipoEje && (
                          <div className={styles.detailItem}>
                            <strong>Tipo de Eje:</strong>
                            <span>{motor.tipoEje}</span>
                          </div>
                        )}
                        {motor.diametroEje && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro de Eje:</strong>
                            <span>{motor.diametroEje}</span>
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
                            <strong>HP:</strong>
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
          <h4>
            {condCount === 1
              ? "Condensadora"
              : `Condensadoras (${condCount})`}
          </h4>

          {equipment.condensers!.map((condenser, index) => (
            <div key={index} className={styles.componentSection}>
              <h5>
                {condCount === 1
                  ? "Condensadora"
                  : `Condensadora ${index + 1}`}
              </h5>

              {/* Datos principales de la condensadora */}
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

              {/* Motores de la condensadora */}
              {condenser.motors && condenser.motors.length > 0 && (
                <div className={styles.subComponentGroup}>
                  <h5>
                    {condenser.motors.length === 1
                      ? "Motor de la Condensadora"
                      : `Motores de la Condensadora (${condenser.motors.length})`}
                  </h5>
                  {condenser.motors.map((motor, mIndex) => (
                    <div
                      key={mIndex}
                      className={styles.subComponentSection}
                    >
                      <h6>
                        {condenser.motors!.length === 1
                          ? "Motor"
                          : `Motor ${mIndex + 1}`}
                      </h6>
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
                        {motor.tipoEje && (
                          <div className={styles.detailItem}>
                            <strong>Tipo de Eje:</strong>
                            <span>{motor.tipoEje}</span>
                          </div>
                        )}
                        {motor.diametroEje && (
                          <div className={styles.detailItem}>
                            <strong>Diámetro de Eje:</strong>
                            <span>{motor.diametroEje}</span>
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
                            <strong>HP:</strong>
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

              {/* Compresores de la condensadora */}
              {condenser.compressors &&
                condenser.compressors.length > 0 && (
                  <div className={styles.subComponentGroup}>
                    <h5>
                      {condenser.compressors.length === 1
                        ? "Compresor"
                        : `Compresores (${condenser.compressors.length})`}
                    </h5>
                    {condenser.compressors.map((comp, cIndex) => (
                      <div
                        key={cIndex}
                        className={styles.subComponentSection}
                      >
                        <h6>
                          {condenser.compressors!.length === 1
                            ? "Compresor"
                            : `Compresor ${cIndex + 1}`}
                        </h6>
                        <div className={styles.detailGrid}>
                          {comp.marca && (
                            <div className={styles.detailItem}>
                              <strong>Marca:</strong>
                              <span>{comp.marca}</span>
                            </div>
                          )}
                          {comp.modelo && (
                            <div className={styles.detailItem}>
                              <strong>Modelo:</strong>
                              <span>{comp.modelo}</span>
                            </div>
                          )}
                          {comp.serial && (
                            <div className={styles.detailItem}>
                              <strong>Serial:</strong>
                              <span>{comp.serial}</span>
                            </div>
                          )}
                          {comp.capacidad && (
                            <div className={styles.detailItem}>
                              <strong>Capacidad:</strong>
                              <span>{comp.capacidad}</span>
                            </div>
                          )}
                          {comp.voltaje && (
                            <div className={styles.detailItem}>
                              <strong>Voltaje:</strong>
                              <span>{comp.voltaje}</span>
                            </div>
                          )}
                          {comp.frecuencia && (
                            <div className={styles.detailItem}>
                              <strong>Frecuencia:</strong>
                              <span>{comp.frecuencia}</span>
                            </div>
                          )}
                          {comp.tipoRefrigerante && (
                            <div className={styles.detailItem}>
                              <strong>Tipo Refrigerante:</strong>
                              <span>{comp.tipoRefrigerante}</span>
                            </div>
                          )}
                          {comp.tipoAceite && (
                            <div className={styles.detailItem}>
                              <strong>Tipo Aceite:</strong>
                              <span>{comp.tipoAceite}</span>
                            </div>
                          )}
                          {comp.cantidadAceite && (
                            <div className={styles.detailItem}>
                              <strong>Cant. Aceite:</strong>
                              <span>{comp.cantidadAceite}</span>
                            </div>
                          )}
                          {comp.capacitor && (
                            <div className={styles.detailItem}>
                              <strong>Capacitor:</strong>
                              <span>{comp.capacitor}</span>
                            </div>
                          )}
                          {comp.lra && (
                            <div className={styles.detailItem}>
                              <strong>LRA:</strong>
                              <span>{comp.lra}</span>
                            </div>
                          )}
                          {comp.fla && (
                            <div className={styles.detailItem}>
                              <strong>FLA:</strong>
                              <span>{comp.fla}</span>
                            </div>
                          )}
                          {comp.cantidadPolos && (
                            <div className={styles.detailItem}>
                              <strong>Cant. Polos:</strong>
                              <span>{comp.cantidadPolos}</span>
                            </div>
                          )}
                          {comp.amperaje && (
                            <div className={styles.detailItem}>
                              <strong>Amperaje:</strong>
                              <span>{comp.amperaje}</span>
                            </div>
                          )}
                          {comp.voltajeBobina && (
                            <div className={styles.detailItem}>
                              <strong>Voltaje Bobina:</strong>
                              <span>{comp.voltajeBobina}</span>
                            </div>
                          )}
                          {comp.vac && (
                            <div className={styles.detailItem}>
                              <strong>VAC:</strong>
                              <span>{comp.vac}</span>
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