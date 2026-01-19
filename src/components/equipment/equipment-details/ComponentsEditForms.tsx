// src/components/equipment/equipment-details/ComponentsEditForms.tsx
import type {
  MotorData,
  EvaporatorData,
  CondenserData,
  CompressorData,
  AirConditionerTypeOption,
} from "../../../interfaces/EquipmentInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";

interface ComponentsEditFormsProps {
  saving: boolean;
  selectedAcType: AirConditionerTypeOption | undefined;
  motorForm: MotorData;
  evaporatorForm: EvaporatorData;
  condenserForm: CondenserData;
  compressorForm: CompressorData;
  onMotorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEvaporatorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCondenserFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCompressorFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ComponentsEditForms({
  saving,
  selectedAcType,
  motorForm,
  evaporatorForm,
  condenserForm,
  compressorForm,
  onMotorFormChange,
  onEvaporatorFormChange,
  onCondenserFormChange,
  onCompressorFormChange,
}: ComponentsEditFormsProps) {
  return (
    <div className={styles.componentsSection}>
      <h4>Componentes del Equipo</h4>

      {/* Motor */}
      <div className={styles.componentSection}>
        <h5>Motor</h5>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label>Amperaje</label>
            <input
              name="amperaje"
              value={motorForm.amperaje || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: 10A"
            />
          </div>
          <div className={styles.formField}>
            <label>Voltaje</label>
            <input
              name="voltaje"
              value={motorForm.voltaje || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: 220V"
            />
          </div>
          <div className={styles.formField}>
            <label>RPM</label>
            <input
              name="rpm"
              value={motorForm.rpm || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: 1500"
            />
          </div>
          <div className={styles.formField}>
            <label>Serial Motor</label>
            <input
              name="serialMotor"
              value={motorForm.serialMotor || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: SN123456"
            />
          </div>
          <div className={styles.formField}>
            <label>Modelo Motor</label>
            <input
              name="modeloMotor"
              value={motorForm.modeloMotor || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: MTR-001"
            />
          </div>
          <div className={styles.formField}>
            <label>Diámetro Eje</label>
            <input
              name="diametroEje"
              value={motorForm.diametroEje || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: 12mm"
            />
          </div>
          <div className={styles.formField}>
            <label>Tipo Eje</label>
            <input
              name="tipoEje"
              value={motorForm.tipoEje || ""}
              onChange={onMotorFormChange}
              disabled={saving}
              placeholder="Ej: Redondo"
            />
          </div>
        </div>
      </div>

      {/* Evaporador */}
      {(!selectedAcType || selectedAcType.hasEvaporator) && (
        <div className={styles.componentSection}>
          <h5>Evaporador</h5>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Marca</label>
              <input
                name="marca"
                value={evaporatorForm.marca || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: Samsung"
              />
            </div>
            <div className={styles.formField}>
              <label>Modelo</label>
              <input
                name="modelo"
                value={evaporatorForm.modelo || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: AEV12"
              />
            </div>
            <div className={styles.formField}>
              <label>Serial</label>
              <input
                name="serial"
                value={evaporatorForm.serial || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: EV123456"
              />
            </div>
            <div className={styles.formField}>
              <label>Capacidad</label>
              <input
                name="capacidad"
                value={evaporatorForm.capacidad || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: 12000 BTU"
              />
            </div>
            <div className={styles.formField}>
              <label>Amperaje</label>
              <input
                name="amperaje"
                value={evaporatorForm.amperaje || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: 8A"
              />
            </div>
            <div className={styles.formField}>
              <label>Tipo Refrigerante</label>
              <input
                name="tipoRefrigerante"
                value={evaporatorForm.tipoRefrigerante || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: R410A"
              />
            </div>
            <div className={styles.formField}>
              <label>Voltaje</label>
              <input
                name="voltaje"
                value={evaporatorForm.voltaje || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: 220V"
              />
            </div>
            <div className={styles.formField}>
              <label>Número de Fases</label>
              <input
                name="numeroFases"
                value={evaporatorForm.numeroFases || ""}
                onChange={onEvaporatorFormChange}
                disabled={saving}
                placeholder="Ej: 1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Condensador */}
      {(!selectedAcType || selectedAcType.hasCondenser) && (
        <div className={styles.componentSection}>
          <h5>Condensador</h5>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Marca</label>
              <input
                name="marca"
                value={condenserForm.marca || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: Samsung"
              />
            </div>
            <div className={styles.formField}>
              <label>Modelo</label>
              <input
                name="modelo"
                value={condenserForm.modelo || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: CNV12"
              />
            </div>
            <div className={styles.formField}>
              <label>Serial</label>
              <input
                name="serial"
                value={condenserForm.serial || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: CN123456"
              />
            </div>
            <div className={styles.formField}>
              <label>Capacidad</label>
              <input
                name="capacidad"
                value={condenserForm.capacidad || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 12000 BTU"
              />
            </div>
            <div className={styles.formField}>
              <label>Amperaje</label>
              <input
                name="amperaje"
                value={condenserForm.amperaje || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 8A"
              />
            </div>
            <div className={styles.formField}>
              <label>Voltaje</label>
              <input
                name="voltaje"
                value={condenserForm.voltaje || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 220V"
              />
            </div>
            <div className={styles.formField}>
              <label>Tipo Refrigerante</label>
              <input
                name="tipoRefrigerante"
                value={condenserForm.tipoRefrigerante || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: R410A"
              />
            </div>
            <div className={styles.formField}>
              <label>Número de Fases</label>
              <input
                name="numeroFases"
                value={condenserForm.numeroFases || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 1"
              />
            </div>
            <div className={styles.formField}>
              <label>Presión Alta</label>
              <input
                name="presionAlta"
                value={condenserForm.presionAlta || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 150 PSI"
              />
            </div>
            <div className={styles.formField}>
              <label>Presión Baja</label>
              <input
                name="presionBaja"
                value={condenserForm.presionBaja || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 50 PSI"
              />
            </div>
            <div className={styles.formField}>
              <label>HP</label>
              <input
                name="hp"
                value={condenserForm.hp || ""}
                onChange={onCondenserFormChange}
                disabled={saving}
                placeholder="Ej: 2.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* Compresor */}
      <div className={styles.componentSection}>
        <h5>Compresor</h5>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label>Marca</label>
            <input
              name="marca"
              value={compressorForm.marca || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: Samsung"
            />
          </div>
          <div className={styles.formField}>
            <label>Modelo</label>
            <input
              name="modelo"
              value={compressorForm.modelo || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: AEV12"
            />
          </div>
          <div className={styles.formField}>
            <label>Serial</label>
            <input
              name="serial"
              value={compressorForm.serial || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: EV123456"
            />
          </div>
          <div className={styles.formField}>
            <label>Capacidad</label>
            <input
              name="capacidad"
              value={compressorForm.capacidad || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 12000 BTU"
            />
          </div>
          <div className={styles.formField}>
            <label>Amperaje</label>
            <input
              name="amperaje"
              value={compressorForm.amperaje || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 8A"
            />
          </div>
          <div className={styles.formField}>
            <label>Tipo Refrigerante</label>
            <input
              name="tipoRefrigerante"
              value={compressorForm.tipoRefrigerante || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: R410A"
            />
          </div>
          <div className={styles.formField}>
            <label>Voltaje</label>
            <input
              name="voltaje"
              value={compressorForm.voltaje || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 220V"
            />
          </div>
          <div className={styles.formField}>
            <label>Número de Fases</label>
            <input
              name="numeroFases"
              value={compressorForm.numeroFases || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 1"
            />
          </div>
          <div className={styles.formField}>
            <label>Tipo de Aceite</label>
            <input
              name="tipoAceite"
              value={compressorForm.tipoAceite || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 15W"
            />
          </div>
          <div className={styles.formField}>
            <label>Cantidad de Aceite</label>
            <input
              name="cantidadAceite"
              value={compressorForm.cantidadAceite || ""}
              onChange={onCompressorFormChange}
              disabled={saving}
              placeholder="Ej: 2L"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
