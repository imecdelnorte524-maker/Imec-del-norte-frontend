import { useMemo } from "react";
import type {
  AcInspection,
  AssociatedEquipment,
  OrderEstado,
  AcInspectionPhase,
} from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/AcTechnicalDataSection.module.css";
import { useAuth } from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";

interface Props {
  acInspections?: AcInspection[];
  equipments: AssociatedEquipment[];
  activeEquipmentId: number | null;
  onEquipmentChange: (equipmentId: number) => void;
  onEditEquipmentInspection?: (
    equipment: AssociatedEquipment,
    phase: AcInspectionPhase,
  ) => void;
  estadoOrden?: OrderEstado;
}

export default function AcTechnicalDataSection({
  acInspections,
  equipments,
  activeEquipmentId,
  onEquipmentChange,
  onEditEquipmentInspection,
  estadoOrden,
}: Props) {
  const { showModal } = useModal();

  if (!acInspections || acInspections.length === 0) return null;

  const hasMultipleEquipments = equipments.length > 1;

  // Filtrar las inspecciones que pertenecen al equipo activo seleccionado en el Tab
  const currentInspections = useMemo(() => {
    if (!acInspections || activeEquipmentId == null) return [];
    return acInspections
      .filter((insp) => (insp.equipmentId ?? null) === activeEquipmentId)
      .sort((a) => (a.phase === "BEFORE" ? -1 : 1));
  }, [acInspections, activeEquipmentId]);

  const activeEquipment =
    equipments.find((e) => e.equipmentId === activeEquipmentId) ||
    equipments[0];

  const { user } = useAuth();
  const isClient = (user as any)?.role?.nombreRol === "Cliente";
  const canEditParams =
    estadoOrden !== "Completado" && estadoOrden !== "Cancelada";

  const handleEditInspection = (phase: AcInspectionPhase) => {
    if (!activeEquipment) {
      showModal({
        type: "warning",
        title: "Seleccionar equipo",
        message:
          "Por favor, seleccione un equipo para registrar los parámetros.",
        buttons: [{ text: "Aceptar", variant: "primary" }],
      });
      return;
    }

    const existingInspection = currentInspections.find(
      (i) => i.phase === phase,
    );

    if (existingInspection) {
      showModal({
        type: "info",
        title: "Editar registro",
        message: `¿Desea editar el registro de ${phase === "BEFORE" ? "ANTES" : "DESPUÉS"}?`,
        buttons: [
          {
            text: "Cancelar",
            variant: "secondary",
          },
          {
            text: "Editar",
            variant: "primary",
            onClick: () => onEditEquipmentInspection?.(activeEquipment, phase),
          },
        ],
      });
    } else {
      onEditEquipmentInspection?.(activeEquipment, phase);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.mainTitle}>
        Parámetros Técnicos de Funcionamiento
      </h3>

      {/* TABS DE EQUIPOS */}
      {hasMultipleEquipments && (
        <div className={styles.tabsContainer}>
          {equipments.map((eq) => (
            <button
              key={eq.equipmentId}
              type="button"
              className={`${styles.tabButton} ${
                activeEquipmentId === eq.equipmentId ? styles.tabActive : ""
              }`}
              onClick={() => onEquipmentChange(eq.equipmentId)}
            >
              {eq.code || `Eq. ${eq.equipmentId}`}
            </button>
          ))}
        </div>
      )}

      {!hasMultipleEquipments && activeEquipment && (
        <div className={styles.singleEquipmentTag}>
          Equipo: <strong>{activeEquipment.code}</strong>
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      {activeEquipment &&
        onEditEquipmentInspection &&
        !isClient &&
        canEditParams && (
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.editInspectionButton}
              onClick={() => handleEditInspection("BEFORE")}
            >
              Registrar / editar ANTES
            </button>
            <button
              type="button"
              className={styles.editInspectionButton}
              onClick={() => handleEditInspection("AFTER")}
            >
              Registrar / editar DESPUÉS
            </button>
          </div>
        )}

      <div className={styles.cardsWrapper}>
        {currentInspections.length === 0 ? (
          <div className={styles.noDataBox}>
            <p>
              No hay registros técnicos para el equipo {activeEquipment?.code}{" "}
              todavía.
            </p>
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
                <small>{new Date(insp.createdAt).toLocaleString()}</small>
              </div>

              <div className={styles.technicalBody}>
                {/* --- UNIDAD EVAPORADORA --- */}
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
                        <span>Microfaradios:</span>
                        <strong>{insp.evapMicrofarads} µF</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- UNIDAD CONDENSADORA --- */}
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
                        <span>Microfaradios:</span>
                        <strong>{insp.condMicrofarads} µF</strong>
                      </div>
                    )}
                    {insp.compressorOhmio != null && (
                      <div className={styles.dataItem}>
                        <span>Ω Ohmio Comp:</span>
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
