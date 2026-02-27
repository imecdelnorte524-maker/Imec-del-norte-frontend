// src/components/orders/AcTechnicalDataSection.tsx
import { useState, useMemo, useEffect } from "react";
import type {
  AcInspection,
  AssociatedEquipment,
  OrderEstado,
} from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/AcTechnicalDataSection.module.css";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  acInspections?: AcInspection[];
  equipments: AssociatedEquipment[];
  onEquipmentChange?: (equipmentId: number | null) => void;
  onEditEquipmentInspection?: (equipment: AssociatedEquipment) => void;
  estadoOrden?: OrderEstado;
}

export default function AcTechnicalDataSection({
  acInspections,
  equipments,
  onEquipmentChange,
  onEditEquipmentInspection,
  estadoOrden,
}: Props) {
  // Si no hay inspecciones, no mostramos la sección
  if (!acInspections || acInspections.length === 0) return null;

  const hasEquipments = Array.isArray(equipments) && equipments.length > 0;
  const hasMultipleEquipments = hasEquipments && equipments.length > 1;

  // Equipo inicial:
  // - Si hay equipos: priorizar uno que tenga inspecciones.
  // - Si no, usar el equipmentId de la primera inspección.
  const computeInitialEqId = () => {
    if (hasEquipments) {
      const firstWithData = acInspections.find(
        (insp) =>
          insp.equipmentId != null &&
          equipments.some((eq) => eq.equipmentId === insp.equipmentId),
      );
      if (firstWithData && firstWithData.equipmentId != null) {
        return firstWithData.equipmentId;
      }
      return equipments[0].equipmentId;
    }
    return acInspections[0]?.equipmentId ?? null;
  };

  const [activeEqId, setActiveEqId] = useState<number | null>(
    computeInitialEqId,
  );

  useEffect(() => {
    setActiveEqId(computeInitialEqId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipments, acInspections?.length]);

  // Notificar al padre qué equipo está activo
  useEffect(() => {
    if (onEquipmentChange) {
      onEquipmentChange(activeEqId);
    }
  }, [activeEqId, onEquipmentChange]);

  const showWithoutFilter = !hasEquipments && activeEqId === null;

  const currentInspections = useMemo(() => {
    if (!acInspections) return [];

    if (showWithoutFilter) {
      return acInspections.slice().sort((a, b) => {
        if (a.phase === b.phase) return 0;
        return a.phase === "BEFORE" ? -1 : 1;
      });
    }

    if (hasEquipments && !hasMultipleEquipments) {
      return acInspections.slice().sort((a, b) => {
        if (a.phase === b.phase) return 0;
        return a.phase === "BEFORE" ? -1 : 1;
      });
    }

    if (hasMultipleEquipments && activeEqId != null) {
      return acInspections
        .filter((insp) => insp.equipmentId === activeEqId)
        .sort((a, b) => {
          if (a.phase === b.phase) return 0;
          return a.phase === "BEFORE" ? -1 : 1;
        });
    }

    return [];
  }, [
    acInspections,
    activeEqId,
    hasEquipments,
    hasMultipleEquipments,
    showWithoutFilter,
  ]);

  const isEmptyForThisEquipment = currentInspections.length === 0;

  const activeEquipment =
    hasEquipments && activeEqId != null
      ? equipments.find((e) => e.equipmentId === activeEqId) || equipments[0]
      : hasEquipments
        ? equipments[0]
        : null;

  const { user } = useAuth();
  const roleName = user?.role?.nombreRol || "";
  const isClient = roleName === "Cliente";
  const isOrderCompleted = estadoOrden !== "Completado";

  return (
    <div className={styles.container}>
      <h3 className={styles.mainTitle}>
        Parámetros Técnicos de Funcionamiento
      </h3>

      {/* TABS O TAG SEGÚN NÚMERO DE EQUIPOS */}
      {hasEquipments && hasMultipleEquipments && (
        <div className={styles.tabsContainer}>
          {equipments.map((eq) => (
            <button
              key={eq.equipmentId}
              type="button"
              className={`${styles.tabButton} ${
                activeEqId === eq.equipmentId ? styles.tabActive : ""
              }`}
              onClick={() => setActiveEqId(eq.equipmentId)}
            >
              {eq.code || `Eq. ${eq.equipmentId}`}
            </button>
          ))}
        </div>
      )}

      {hasEquipments && !hasMultipleEquipments && activeEquipment && (
        <div className={styles.singleEquipmentTag}>
          Equipo:&nbsp;
          <strong>
            {activeEquipment.code || `Eq. ${activeEquipment.equipmentId}`}
          </strong>
        </div>
      )}

      {/* Botón para abrir modal de inspección del equipo activo */}
      {hasEquipments &&
        activeEquipment &&
        onEditEquipmentInspection &&
        !isClient &&
        isOrderCompleted && (
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.editInspectionButton}
              onClick={() => onEditEquipmentInspection(activeEquipment)}
            >
              Registrar / editar parámetros de este equipo
            </button>
          </div>
        )}

      <div className={styles.cardsWrapper}>
        {isEmptyForThisEquipment ? (
          <div className={styles.noDataBox}>
            <p>No hay registros técnicos para este equipo todavía.</p>
          </div>
        ) : (
          currentInspections.map((insp) => (
            <div key={insp.id} className={styles.inspectionCard}>
              <div
                className={`${styles.phaseHeader} ${
                  insp.phase === "BEFORE" ? styles.bgBefore : styles.bgAfter
                }`}
              >
                <span>
                  {insp.phase === "BEFORE"
                    ? "📊 PARÁMETROS ANTES DEL MANTENIMIENTO"
                    : "📊 PARÁMETROS DESPUÉS DEL MANTENIMIENTO"}
                </span>
                <small>{new Date(insp.createdAt).toLocaleDateString()}</small>
              </div>

              <div className={styles.technicalBody}>
                {/* Evaporadora */}
                <div className={styles.unitSection}>
                  <h5>🌬️ Unidad Evaporadora</h5>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                      <span>Temp. Suministro:</span>
                      <strong>{insp.evapTempSupply}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Temp. Retorno:</span>
                      <strong>{insp.evapTempReturn}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Temp. Ambiente:</span>
                      <strong>{insp.evapTempAmbient}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Temp. Exterior:</span>
                      <strong>{insp.evapTempOutdoor}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>RPM Motor:</span>
                      <strong>{insp.evapMotorRpm}</strong>
                    </div>
                    {insp.evapMicrofarads != null && (
                      <div className={styles.dataItem}>
                        <span>Microfaradios (capacitor):</span>
                        <strong>{insp.evapMicrofarads} µF</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Condensadora */}
                <div className={styles.unitSection}>
                  <h5>❄️ Unidad Condensadora</h5>
                  <div className={styles.dataGrid}>
                    <div className={styles.dataItem}>
                      <span>P. Alta (psi):</span>
                      <strong>{insp.condHighPressure}</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>P. Baja (psi):</span>
                      <strong>{insp.condLowPressure}</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Amperaje (A):</span>
                      <strong>{insp.condAmperage}</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Voltaje (V):</span>
                      <strong>{insp.condVoltage}</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Temp. Entrada:</span>
                      <strong>{insp.condTempIn}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>Temp. Descarga:</span>
                      <strong>{insp.condTempDischarge}°C</strong>
                    </div>
                    <div className={styles.dataItem}>
                      <span>RPM Motor:</span>
                      <strong>{insp.condMotorRpm}</strong>
                    </div>
                    {insp.condMicrofarads != null && (
                      <div className={styles.dataItem}>
                        <span>Microfaradios (capacitor):</span>
                        <strong>{insp.condMicrofarads} µF</strong>
                      </div>
                    )}
                    {insp.compressorOhmio != null && (
                      <div className={styles.dataItem}>
                        <span>Ω Ohmio Comp.:</span>
                        <strong>{insp.compressorOhmio}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {insp.observation && (
                <div className={styles.observationFooter}>
                  <strong>Observación técnica:</strong>
                  <p>{insp.observation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
