import { useEffect, useState, useRef } from "react";
import {
  createAcInspectionBeforeRequest,
  createAcInspectionAfterRequest,
  uploadWorkOrderImagesRequest,
  type CreateAcInspectionPayload,
} from "../../api/orders";
import type {
  AssociatedEquipment,
  Order
} from "../../interfaces/OrderInterfaces";
import styles from "../../styles/components/orders/AcInpectionModal.module.css";

type AcPhase = "BEFORE" | "AFTER";

interface Props {
  order: Order;
  equipment: AssociatedEquipment; // 👈 Clave para saber qué equipo es
  phase: AcPhase;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_IMAGES = 10;

export default function AcInspectionModal({
  order,
  equipment,
  phase,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const orderId = order.orden_id;
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BUSCAR INSPECCIÓN DE ESTE EQUIPO ESPECÍFICO
  const existingInspection = order.acInspections?.find(
    (insp) => insp.phase === phase && insp.equipmentId === equipment.equipmentId
  );
  
  // Buscar fotos que tengan el código del equipo en la observación (para trazabilidad simple)
  // OJO: Si el backend no filtra fotos por equipo, esto es visual. El backend recibe las fotos en la orden.
  const existingImages = order.images?.filter(
    (img) => img.evidencePhase === phase
  ) || [];
  
  // Para ser menos estricto con las fotos al editar: si ya hay CUALQUIER foto en esa fase, no obligamos.
  const hasExistingImages = existingImages.length > 0;
  const hasExistingData = !!existingInspection;

  useEffect(() => {
    if (isOpen) {
      if (existingInspection) {
        setEvapTempSupply(existingInspection.evapTempSupply?.toString() || "");
        setEvapTempReturn(existingInspection.evapTempReturn?.toString() || "");
        setEvapTempAmbient(existingInspection.evapTempAmbient?.toString() || "");
        setEvapTempOutdoor(existingInspection.evapTempOutdoor?.toString() || "");
        setEvapMotorRpm(existingInspection.evapMotorRpm?.toString() || "");
        setEvapMicrofarads(existingInspection.evapMicrofarads?.toString() || "");
        
        setCondHighPressure(existingInspection.condHighPressure?.toString() || "");
        setCondLowPressure(existingInspection.condLowPressure?.toString() || "");
        setCondAmperage(existingInspection.condAmperage?.toString() || "");
        setCondVoltage(existingInspection.condVoltage?.toString() || "");
        setCondTempIn(existingInspection.condTempIn?.toString() || "");
        setCondTempDischarge(existingInspection.condTempDischarge?.toString() || "");
        setCondMotorRpm(existingInspection.condMotorRpm?.toString() || "");
        setCondMicrofarads(existingInspection.condMicrofarads?.toString() || "");
        setCompressorOhmio(existingInspection.compressorOhmio?.toString() || "");
        
        setObservation(existingInspection.observation || "");
      } else {
        // Limpiar formulario si es nuevo registro para este equipo
        setEvapTempSupply(""); setEvapTempReturn(""); setEvapTempAmbient(""); 
        setEvapTempOutdoor(""); setEvapMotorRpm(""); setEvapMicrofarads("");
        setCondHighPressure(""); setCondLowPressure(""); setCondAmperage("");
        setCondVoltage(""); setCondTempIn(""); setCondTempDischarge("");
        setCondMotorRpm(""); setCondMicrofarads(""); setCompressorOhmio("");
        setObservation("");
      }
    } else {
      setSelectedFiles([]);
      setPreviews(p => { p.forEach(u => URL.revokeObjectURL(u)); return []; });
    }
  }, [isOpen, phase, order, equipment, existingInspection]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      if (selectedFiles.length + newFiles.length > MAX_IMAGES) {
        setError(`Máximo ${MAX_IMAGES} imágenes`);
        return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const parseNumber = (val: string, name: string) => {
    const n = parseFloat(val.replace(",", "."));
    if (isNaN(n)) throw new Error(`El campo "${name}" debe ser un número válido`);
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
      // Si no hay ninguna foto en toda la fase y no sube nuevas, error
      if (selectedFiles.length === 0 && !hasExistingImages) {
        throw new Error(`Debe subir al menos una imagen de evidencia.`);
      }

      const payload: CreateAcInspectionPayload = {
        equipmentId: equipment.equipmentId, // 👈 Se envía el ID del equipo
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

      if (phase === "BEFORE") await createAcInspectionBeforeRequest(orderId, payload);
      else await createAcInspectionAfterRequest(orderId, payload);

      if (selectedFiles.length > 0) {
        // En la observación de la foto ponemos a qué equipo pertenece
        const evidencePhase = phase === "BEFORE" ? "BEFORE" : "AFTER";
        await uploadWorkOrderImagesRequest(orderId, selectedFiles, {
          phase: evidencePhase,
          observation: `[${equipment.code}] ${observation || "Evidencia técnica"}`,
        });
      }

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
            {phase === "BEFORE" ? "PARAMETROS FUNCIONAMIENTO ANTES DEL MANTENIMIENTO" : "PARAMETROS FUNCIONAMIENTO DESPUÉS DEL MANTENIMIENTO"} - {equipment.code}
          </h3>
          <button type="button" onClick={onClose} className={styles.modalCloseButton}>×</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* SECCIONES FORMULARIO */}
          <div className={styles.section}>
            <h4>Unidad Evaporadora</h4>
            <div className={styles.formGrid}>
              <div className={styles.formRow}><label>Temp. Suministro</label><input type="number" step="0.1" value={evapTempSupply} onChange={e=>setEvapTempSupply(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Temp. Retorno</label><input type="number" step="0.1" value={evapTempReturn} onChange={e=>setEvapTempReturn(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Temp. Ambiente</label><input type="number" step="0.1" value={evapTempAmbient} onChange={e=>setEvapTempAmbient(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Temp. Exterior</label><input type="number" step="0.1" value={evapTempOutdoor} onChange={e=>setEvapTempOutdoor(e.target.value)} required/></div>
              <div className={styles.formRow}><label>RPM Motor</label><input type="number" value={evapMotorRpm} onChange={e=>setEvapMotorRpm(e.target.value)} required/></div>
              {phase === "BEFORE" && (
                <div className={styles.formRow}><label>Microfaradios (capacitor)</label><input type="number" step="0.1" value={evapMicrofarads} onChange={e=>setEvapMicrofarads(e.target.value)} required/></div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h4>Unidad Condensadora</h4>
            <div className={styles.formGrid}>
              <div className={styles.formRow}><label>P. Alta (psi)</label><input type="number" step="0.1" value={condHighPressure} onChange={e=>setCondHighPressure(e.target.value)} required/></div>
              <div className={styles.formRow}><label>P. Baja (psi)</label><input type="number" step="0.1" value={condLowPressure} onChange={e=>setCondLowPressure(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Amperaje (A)</label><input type="number" step="0.01" value={condAmperage} onChange={e=>setCondAmperage(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Voltaje (V)</label><input type="number" value={condVoltage} onChange={e=>setCondVoltage(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Temp. Entrada</label><input type="number" step="0.1" value={condTempIn} onChange={e=>setCondTempIn(e.target.value)} required/></div>
              <div className={styles.formRow}><label>Temp. Descarga</label><input type="number" step="0.1" value={condTempDischarge} onChange={e=>setCondTempDischarge(e.target.value)} required/></div>
              <div className={styles.formRow}><label>RPM Motor</label><input type="number" value={condMotorRpm} onChange={e=>setCondMotorRpm(e.target.value)} required/></div>
              {phase === "BEFORE" && (
                <>
                  <div className={styles.formRow}><label>Microfaradios (capacitor)</label><input type="number" step="0.1" value={condMicrofarads} onChange={e=>setCondMicrofarads(e.target.value)} required/></div>
                  <div className={styles.formRow}><label>Ω Ohmio Comp.</label><input type="number" step="0.1" value={compressorOhmio} onChange={e=>setCompressorOhmio(e.target.value)} required/></div>
                </>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <label>Observaciones</label>
            <textarea className={styles.rejectTextarea} value={observation} onChange={e=>setObservation(e.target.value)} placeholder="Observaciones..." />
          </div>

          {/* EVIDENCIAS */}
          <div className={styles.formRow}>
            <label className={styles.customLabel}>Evidencias {hasExistingImages && "(Ya existen fotos)"}</label>
            <div className={styles.fileUploadContainer}>
              <input ref={fileInputRef} type="file" className={styles.hiddenFileInput} accept="image/*" multiple onChange={handleFileChange} />
              <button type="button" onClick={()=>fileInputRef.current?.click()} className={styles.fileUploadLabel}>
                <span className={styles.uploadIcon}>📷</span>
                <span className={styles.uploadText}>{selectedFiles.length === 0 ? "Seleccionar" : `${selectedFiles.length} seleccionadas`}</span>
              </button>
            </div>
            {previews.length > 0 && (
              <div className={styles.previewGrid}>
                {previews.map((url, idx) => (
                  <div key={idx} className={styles.previewCard}>
                    <img src={url} alt="Preview" />
                    <button type="button" className={styles.removeBadge} onClick={() => removeImage(idx)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? "Guardando..." : hasExistingData ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}