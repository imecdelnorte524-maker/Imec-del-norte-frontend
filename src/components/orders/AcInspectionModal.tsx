import { useEffect, useState } from "react";
import {
  createAcInspectionBeforeRequest,
  createAcInspectionAfterRequest,
  type CreateAcInspectionPayload,
} from "../../api/orders";
import type {
  AssociatedEquipment,
  Order,
} from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/AcInpectionModal.module.css";

type AcPhase = "BEFORE" | "AFTER";

interface Props {
  order: Order;
  equipment: AssociatedEquipment;
  phase: AcPhase;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AcInspectionModal({
  order,
  equipment,
  phase,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const orderId = order.orden_id;

  const [evapTempSupply, setEvapTempSupply] = useState("");
  const [evapTempReturn, setEvapTempReturn] = useState("");
  const [evapTempAmbient, setEvapTempAmbient] = useState("");
  const [evapTempOutdoor, setEvapTempOutdoor] = useState("");
  const [evapMotorRpm, setEvapMotorRpm] = useState("");
  const [evapMicrofarads, setEvapMicrofarads] = useState("");

  const [condHighPressure, setCondHighPressure] = useState("");
  const [condLowPressure, setCondLowPressure] = useState("");
  const [condAmperage, setCondAmperage] = useState("");
  const [condVoltage, setCondVoltage] = useState("");
  const [condTempIn, setCondTempIn] = useState("");
  const [condTempDischarge, setCondTempDischarge] = useState("");
  const [condMotorRpm, setCondMotorRpm] = useState("");
  const [condMicrofarads, setCondMicrofarads] = useState("");
  const [compressorOhmio, setCompressorOhmio] = useState("");
  const [observation, setObservation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingInspection = order.acInspections?.find(
    (insp) =>
      insp.phase === phase && insp.equipmentId === equipment.equipmentId,
  );

  const hasExistingData = !!existingInspection;

  useEffect(() => {
    if (!isOpen) return;

    if (existingInspection) {
      setEvapTempSupply(existingInspection.evapTempSupply?.toString() || "");
      setEvapTempReturn(existingInspection.evapTempReturn?.toString() || "");
      setEvapTempAmbient(existingInspection.evapTempAmbient?.toString() || "");
      setEvapTempOutdoor(existingInspection.evapTempOutdoor?.toString() || "");
      setEvapMotorRpm(existingInspection.evapMotorRpm?.toString() || "");
      setEvapMicrofarads(existingInspection.evapMicrofarads?.toString() || "");

      setCondHighPressure(
        existingInspection.condHighPressure?.toString() || "",
      );
      setCondLowPressure(existingInspection.condLowPressure?.toString() || "");
      setCondAmperage(existingInspection.condAmperage?.toString() || "");
      setCondVoltage(existingInspection.condVoltage?.toString() || "");
      setCondTempIn(existingInspection.condTempIn?.toString() || "");
      setCondTempDischarge(
        existingInspection.condTempDischarge?.toString() || "",
      );
      setCondMotorRpm(existingInspection.condMotorRpm?.toString() || "");
      setCondMicrofarads(existingInspection.condMicrofarads?.toString() || "");
      setCompressorOhmio(existingInspection.compressorOhmio?.toString() || "");

      setObservation(existingInspection.observation || "");
    } else {
      setEvapTempSupply("");
      setEvapTempReturn("");
      setEvapTempAmbient("");
      setEvapTempOutdoor("");
      setEvapMotorRpm("");
      setEvapMicrofarads("");

      setCondHighPressure("");
      setCondLowPressure("");
      setCondAmperage("");
      setCondVoltage("");
      setCondTempIn("");
      setCondTempDischarge("");
      setCondMotorRpm("");
      setCondMicrofarads("");
      setCompressorOhmio("");

      setObservation("");
    }
  }, [isOpen, phase, existingInspection]);

  if (!isOpen) return null;

  const parseNumber = (val: string, name: string) => {
    const n = parseFloat(val.replace(",", "."));
    if (isNaN(n))
      throw new Error(`El campo "${name}" debe ser un número válido`);
    return n;
  };

  const parseOptionalNumber = (val: string) => {
    if (!val || val.trim() === "") return undefined;
    const n = parseFloat(val.replace(",", "."));
    return isNaN(n) ? undefined : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: CreateAcInspectionPayload = {
        equipmentId: equipment.equipmentId,
        evapTempSupply: parseNumber(evapTempSupply, "Temp. Suministro"),
        evapTempReturn: parseNumber(evapTempReturn, "Temp. Retorno"),
        evapTempAmbient: parseNumber(evapTempAmbient, "Temp. Ambiente"),
        evapTempOutdoor: parseNumber(evapTempOutdoor, "Temp. Exterior"),
        evapMotorRpm: parseNumber(evapMotorRpm, "RPM Evap"),

        condHighPressure: parseNumber(condHighPressure, "Presión Alta"),
        condLowPressure: parseNumber(condLowPressure, "Presión Baja"),
        condAmperage: parseNumber(condAmperage, "Amperaje"),
        condVoltage: parseNumber(condVoltage, "Voltaje"),
        condTempIn: parseNumber(condTempIn, "Temp. Entrada"),
        condTempDischarge: parseNumber(condTempDischarge, "Temp. Descarga"),
        condMotorRpm: parseNumber(condMotorRpm, "RPM Cond"),

        observation: observation || undefined,
      };

      if (phase === "BEFORE") {
        payload.evapMicrofarads = parseNumber(evapMicrofarads, "Mf Evap");
        payload.condMicrofarads = parseNumber(condMicrofarads, "Mf Cond");
        payload.compressorOhmio = parseNumber(compressorOhmio, "Ohmio Comp.");
      } else {
        payload.evapMicrofarads = parseOptionalNumber(evapMicrofarads);
        payload.condMicrofarads = parseOptionalNumber(condMicrofarads);
        payload.compressorOhmio = parseOptionalNumber(compressorOhmio);
      }

      setSubmitting(true);

      if (phase === "BEFORE")
        await createAcInspectionBeforeRequest(orderId, payload);
      else await createAcInspectionAfterRequest(orderId, payload);

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderRow}>
          <h3>
            {phase === "BEFORE"
              ? "PARAMETROS FUNCIONAMIENTO ANTES DEL MANTENIMIENTO"
              : "PARAMETROS FUNCIONAMIENTO DESPUÉS DEL MANTENIMIENTO"}{" "}
            - {equipment.code}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
          >
            ×
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h4>Unidad Evaporadora</h4>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label>Temp. Suministro</label>
                <input
                  type="number"
                  step="0.1"
                  value={evapTempSupply}
                  onChange={(e) => setEvapTempSupply(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Temp. Retorno</label>
                <input
                  type="number"
                  step="0.1"
                  value={evapTempReturn}
                  onChange={(e) => setEvapTempReturn(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Temp. Ambiente</label>
                <input
                  type="number"
                  step="0.1"
                  value={evapTempAmbient}
                  onChange={(e) => setEvapTempAmbient(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Temp. Exterior</label>
                <input
                  type="number"
                  step="0.1"
                  value={evapTempOutdoor}
                  onChange={(e) => setEvapTempOutdoor(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>RPM Motor</label>
                <input
                  type="number"
                  value={evapMotorRpm}
                  onChange={(e) => setEvapMotorRpm(e.target.value)}
                  required
                />
              </div>
              {phase === "BEFORE" && (
                <div className={styles.formRow}>
                  <label>Microfaradios (capacitor)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={evapMicrofarads}
                    onChange={(e) => setEvapMicrofarads(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4>Unidad Condensadora</h4>
            <div className={styles.formGrid}>
              <div className={styles.formRow}>
                <label>P. Alta (psi)</label>
                <input
                  type="number"
                  step="0.1"
                  value={condHighPressure}
                  onChange={(e) => setCondHighPressure(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>P. Baja (psi)</label>
                <input
                  type="number"
                  step="0.1"
                  value={condLowPressure}
                  onChange={(e) => setCondLowPressure(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Amperaje (A)</label>
                <input
                  type="number"
                  step="0.01"
                  value={condAmperage}
                  onChange={(e) => setCondAmperage(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Voltaje (V)</label>
                <input
                  type="number"
                  value={condVoltage}
                  onChange={(e) => setCondVoltage(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Temp. Entrada</label>
                <input
                  type="number"
                  step="0.1"
                  value={condTempIn}
                  onChange={(e) => setCondTempIn(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>Temp. Descarga</label>
                <input
                  type="number"
                  step="0.1"
                  value={condTempDischarge}
                  onChange={(e) => setCondTempDischarge(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formRow}>
                <label>RPM Motor</label>
                <input
                  type="number"
                  value={condMotorRpm}
                  onChange={(e) => setCondMotorRpm(e.target.value)}
                  required
                />
              </div>
              {phase === "BEFORE" && (
                <>
                  <div className={styles.formRow}>
                    <label>Microfaradios (capacitor)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={condMicrofarads}
                      onChange={(e) => setCondMicrofarads(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label>Ω Ohmio Comp.</label>
                    <input
                      type="number"
                      step="0.1"
                      value={compressorOhmio}
                      onChange={(e) => setCompressorOhmio(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <label>Observaciones</label>
            <textarea
              className={styles.rejectTextarea}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Observaciones..."
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting
                ? "Guardando..."
                : hasExistingData
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
