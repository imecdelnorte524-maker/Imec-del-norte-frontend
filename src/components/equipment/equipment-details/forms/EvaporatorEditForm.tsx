// src/components/equipment/equipment-details/forms/EvaporatorEditForm.tsx
import type {
  EvaporatorData,
  AirConditionerTypeOption,
} from "../../../../interfaces/EquipmentInterfaces";
import styles from "../../../../styles/components/equipment/equipment-details/forms/ComponentEditForms.module.css";
import MotorEditForm from "./MotorEditForm";
import { useState, useEffect } from "react";

interface EvaporatorEditFormProps {
  evaporator: EvaporatorData;
  index: number;
  saving: boolean;
  onChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onAddMotor?: () => void;
  canRemove?: boolean;
  onRemove?: () => void;
  onMotorChange?: (
    evaporatorIndex: number,
    motorIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onAddMotorToEvaporator?: (evaporatorIndex: number) => void;
  onRemoveMotor?: (evaporatorIndex: number, motorIndex: number) => void;

  // Nuevas props para el selector de tipo
  showTypeSelector?: boolean;
  airConditionerTypes?: AirConditionerTypeOption[];
  onTypeChange?: (
    index: number,
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
}

export default function EvaporatorEditForm({
  evaporator,
  index,
  saving,
  onChange,
  onAddMotor,
  canRemove,
  onRemove,
  onMotorChange,
  onAddMotorToEvaporator,
  onRemoveMotor,
  showTypeSelector = false,
  airConditionerTypes = [],
  onTypeChange,
}: EvaporatorEditFormProps) {
  const hasMotors = evaporator.motors && evaporator.motors.length > 0;

  // Estados locales para validación
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limpiar errores cuando cambian los datos
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      validateField("marca", evaporator.marca);
      validateField("modelo", evaporator.modelo);
      validateField("serial", evaporator.serial);
      validateField("capacidad", evaporator.capacidad);
      validateField("tipoRefrigerante", evaporator.tipoRefrigerante);
      if (showTypeSelector) {
        validateField(
          "airConditionerTypeEvapId",
          evaporator.airConditionerTypeEvapId?.toString(),
        );
      }
    }
  }, [evaporator]);

  // Función de validación por campo
  const validateField = (fieldName: string, value: string | undefined) => {
    if (!touched[fieldName]) return;

    let error = "";

    switch (fieldName) {
      case "airConditionerTypeEvapId":
        if (showTypeSelector && (!value || value === "")) {
          error = "El tipo de evaporador es requerido";
        }
        break;
      case "marca":
        if (!value || value.trim() === "") {
          error = "La marca es requerida";
        } else if (value.length > 100) {
          error = "La marca no puede exceder 100 caracteres";
        }
        break;
      case "modelo":
        if (!value || value.trim() === "") {
          error = "El modelo es requerido";
        } else if (value.length > 100) {
          error = "El modelo no puede exceder 100 caracteres";
        }
        break;
      case "serial":
        if (value && value.length > 50) {
          error = "El serial no puede exceder 50 caracteres";
        }
        break;
      case "capacidad":
        if (value && value.length > 50) {
          error = "La capacidad no puede exceder 50 caracteres";
        }
        break;
      case "tipoRefrigerante":
        if (value && value.length > 50) {
          error = "El tipo de refrigerante no puede exceder 50 caracteres";
        }
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error;
  };

  // Manejador de blur para validación
  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({
      ...prev,
      [fieldName]: true,
    }));

    let value: string | undefined;
    switch (fieldName) {
      case "airConditionerTypeEvapId":
        value = evaporator.airConditionerTypeEvapId?.toString();
        break;
      case "marca":
        value = evaporator.marca;
        break;
      case "modelo":
        value = evaporator.modelo;
        break;
      case "serial":
        value = evaporator.serial;
        break;
      case "capacidad":
        value = evaporator.capacidad;
        break;
      case "tipoRefrigerante":
        value = evaporator.tipoRefrigerante;
        break;
    }
    validateField(fieldName, value);
  };

  // Manejador de cambio con validación en tiempo real
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Si el campo ya fue tocado, validar en tiempo real
    if (touched[name]) {
      validateField(name, value);
    }

    onChange(index, e);
  };

  // Manejador específico para cambio de tipo
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;

    if (touched["airConditionerTypeEvapId"]) {
      validateField("airConditionerTypeEvapId", value);
    }

    if (onTypeChange) {
      onTypeChange(index, e);
    } else {
      // Crear un evento compatible con onChange
      const customEvent = {
        target: {
          name: "airConditionerTypeEvapId",
          value: value,
          type: "select-one",
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(index, customEvent);
    }
  };

  // Determinar si un campo tiene error
  const hasError = (fieldName: string): boolean => {
    return !!errors[fieldName] && touched[fieldName];
  };

  // Clase CSS para campo con error
  const getFieldClass = (fieldName: string): string => {
    return hasError(fieldName) ? styles.fieldError : "";
  };

  return (
    <div className={styles.componentSection}>
      <div className={styles.componentHeader}>
        <h5>Evaporador {index + 1}</h5>
        {canRemove && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={onRemove}
            disabled={saving}
          >
            ✕ Eliminar evaporador
          </button>
        )}
      </div>

      <div className={styles.formGrid}>
        {/* Selector de tipo de evaporador (solo cuando aplica) */}
        {showTypeSelector && (
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label htmlFor={`evap-type-edit-${index}`}>
              Tipo de Evaporador <span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrapper}>
              <select
                id={`evap-type-edit-${index}`}
                name="airConditionerTypeEvapId"
                value={evaporator.airConditionerTypeEvapId || ""}
                onChange={handleTypeChange}
                onBlur={() => handleBlur("airConditionerTypeEvapId")}
                disabled={saving}
                className={getFieldClass("airConditionerTypeEvapId")}
              >
                <option value="">Seleccionar tipo...</option>
                {airConditionerTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <span className={styles.selectArrow}>▼</span>
            </div>
            {airConditionerTypes.length === 0 && (
              <span className={styles.helperText}>
                No hay tipos de evaporador disponibles
              </span>
            )}
            {hasError("airConditionerTypeEvapId") && (
              <span className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {errors.airConditionerTypeEvapId}
              </span>
            )}

            {/* Mostrar información del tipo seleccionado */}
            {evaporator.airConditionerTypeEvapId &&
              airConditionerTypes.length > 0 && (
                <div className={styles.typeInfo}>
                  <small>
                    ✓ Tipo seleccionado:{" "}
                    {
                      airConditionerTypes.find(
                        (t) => t.id === evaporator.airConditionerTypeEvapId,
                      )?.name
                    }
                  </small>
                </div>
              )}
          </div>
        )}

        <div className={styles.formField}>
          <label htmlFor={`evap-marca-edit-${index}`}>
            Marca <span className={styles.required}>*</span>
          </label>
          <input
            id={`evap-marca-edit-${index}`}
            type="text"
            name="marca"
            value={evaporator.marca || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("marca")}
            disabled={saving}
            placeholder="Ej: Daikin"
            className={getFieldClass("marca")}
            maxLength={100}
          />
          {hasError("marca") && (
            <span className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.marca}
            </span>
          )}
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-modelo-edit-${index}`}>
            Modelo <span className={styles.required}>*</span>
          </label>
          <input
            id={`evap-modelo-edit-${index}`}
            type="text"
            name="modelo"
            value={evaporator.modelo || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("modelo")}
            disabled={saving}
            placeholder="Ej: FTXS50K"
            className={getFieldClass("modelo")}
            maxLength={100}
          />
          {hasError("modelo") && (
            <span className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.modelo}
            </span>
          )}
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-serial-edit-${index}`}>Serial</label>
          <input
            id={`evap-serial-edit-${index}`}
            type="text"
            name="serial"
            value={evaporator.serial || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("serial")}
            disabled={saving}
            placeholder="Ej: EV-987654321"
            className={getFieldClass("serial")}
            maxLength={50}
          />
          {hasError("serial") && (
            <span className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.serial}
            </span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-capacidad-edit-${index}`}>Capacidad</label>
          <input
            id={`evap-capacidad-edit-${index}`}
            type="text"
            name="capacidad"
            value={evaporator.capacidad || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("capacidad")}
            disabled={saving}
            placeholder="Ej: 18000 BTU"
            className={getFieldClass("capacidad")}
            maxLength={50}
          />
          {hasError("capacidad") && (
            <span className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.capacidad}
            </span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-refrigerante-edit-${index}`}>
            Tipo Refrigerante
          </label>
          <input
            id={`evap-refrigerante-edit-${index}`}
            type="text"
            name="tipoRefrigerante"
            value={evaporator.tipoRefrigerante || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("tipoRefrigerante")}
            disabled={saving}
            placeholder="Ej: R-410A"
            className={getFieldClass("tipoRefrigerante")}
            maxLength={50}
          />
          {hasError("tipoRefrigerante") && (
            <span className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {errors.tipoRefrigerante}
            </span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>
      </div>

      {/* SECCIÓN DE MOTORES */}
      {hasMotors && (
        <div className={styles.motorsSection}>
          <h6>Motores del Evaporador</h6>
          {evaporator.motors?.map((motor, motorIndex) => (
            <div key={motorIndex} className={styles.motorItem}>
              <MotorEditForm
                motor={motor}
                index={motorIndex}
                saving={saving}
                onChange={(e) => onMotorChange?.(index, motorIndex, e)}
                onRemove={
                  onRemoveMotor
                    ? () => onRemoveMotor(index, motorIndex)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Botón para agregar motor */}
      {(onAddMotor || onAddMotorToEvaporator) && (
        <div className={styles.componentActions}>
          <button
            type="button"
            className={styles.addButton}
            onClick={
              onAddMotorToEvaporator
                ? () => onAddMotorToEvaporator(index)
                : onAddMotor
            }
            disabled={saving}
          >
            + Agregar Motor
          </button>
        </div>
      )}

      {/* Indicador de campos requeridos */}
      <div className={styles.formFooter}>
        <span className={styles.requiredHint}>
          <span className={styles.required}>*</span> Campos requeridos
        </span>
      </div>
    </div>
  );
}
