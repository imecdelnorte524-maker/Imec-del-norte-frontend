import type React from "react";
import { useState, useEffect } from "react";
import styles from "../../../../styles/components/equipment/equipment-list/forms/ComponentForm.module.css";
import type {
  EvaporatorData,
  AirConditionerTypeOption,
} from "../../../../interfaces/EquipmentInterfaces";

interface EvaporatorFormProps {
  data: EvaporatorData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  onTypeChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
  loading: boolean;
  showTypeSelector?: boolean;
  airConditionerTypes?: AirConditionerTypeOption[];
  selectedTypeId?: number | string | null;
  index?: number; // Para identificar el evaporador en logs o mensajes de error
}

export default function EvaporatorForm({
  data,
  onChange,
  onTypeChange,
  disabled,
  loading,
  showTypeSelector = false,
  airConditionerTypes = [],
  selectedTypeId,
  index,
}: EvaporatorFormProps) {
  // Estados locales para manejar validación y errores
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limpiar errores cuando cambian los datos
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      validateField("marca", data.marca);
      validateField("modelo", data.modelo);
      validateField("serial", data.serial);
      validateField("capacidad", data.capacidad);
      validateField("tipoRefrigerante", data.tipoRefrigerante);
    }
  }, [data]);

  // Función de validación por campo
  const validateField = (fieldName: string, value: string | undefined) => {
    if (!touched[fieldName]) return;

    let error = "";

    switch (fieldName) {
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
    validateField(fieldName, data[fieldName as keyof EvaporatorData] as string);
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

    onChange(e);
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
    <div className={styles.componentForm}>
      <h5>
        {index !== undefined
          ? `Evaporador ${index + 1}`
          : "Datos del Evaporador"}
      </h5>

      <div className={styles.formGrid}>
        {/* Selector de tipo de aire condicionado para este evaporador (solo cuando aplica) */}
        {showTypeSelector && (
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <label htmlFor={`evap-type-${index}`}>
              Tipo de Evaporador <span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrapper}>
              <select
                id={`evap-type-${index}`}
                name="airConditionerTypeEvapId"
                value={selectedTypeId || data.airConditionerTypeEvapId || ""}
                onChange={(e) => {
                  if (onTypeChange) {
                    onTypeChange(e);
                  } else {
                    handleChange(e);
                  }
                }}
                required={showTypeSelector}
                disabled={disabled || loading}
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
              <span className={styles.errorText}>
                {errors.airConditionerTypeEvapId}
              </span>
            )}
          </div>
        )}

        <div className={styles.formField}>
          <label htmlFor={`evap-marca-${index}`}>
            Marca <span className={styles.required}>*</span>
          </label>
          <input
            id={`evap-marca-${index}`}
            type="text"
            name="marca"
            value={data.marca || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("marca")}
            disabled={disabled}
            placeholder="Ej: Daikin"
            className={getFieldClass("marca")}
            maxLength={100}
          />
          {hasError("marca") && (
            <span className={styles.errorText}>{errors.marca}</span>
          )}
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-modelo-${index}`}>
            Modelo <span className={styles.required}>*</span>
          </label>
          <input
            id={`evap-modelo-${index}`}
            type="text"
            name="modelo"
            value={data.modelo || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("modelo")}
            disabled={disabled}
            placeholder="Ej: FTXS50K"
            className={getFieldClass("modelo")}
            maxLength={100}
          />
          {hasError("modelo") && (
            <span className={styles.errorText}>{errors.modelo}</span>
          )}
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-serial-${index}`}>Serial</label>
          <input
            id={`evap-serial-${index}`}
            type="text"
            name="serial"
            value={data.serial || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("serial")}
            disabled={disabled}
            placeholder="Ej: EV-987654321"
            className={getFieldClass("serial")}
            maxLength={50}
          />
          {hasError("serial") && (
            <span className={styles.errorText}>{errors.serial}</span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-capacidad-${index}`}>Capacidad</label>
          <input
            id={`evap-capacidad-${index}`}
            type="text"
            name="capacidad"
            value={data.capacidad || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("capacidad")}
            disabled={disabled}
            placeholder="Ej: 18000 BTU"
            className={getFieldClass("capacidad")}
            maxLength={50}
          />
          {hasError("capacidad") && (
            <span className={styles.errorText}>{errors.capacidad}</span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>

        <div className={styles.formField}>
          <label htmlFor={`evap-refrigerante-${index}`}>
            Tipo Refrigerante
          </label>
          <input
            id={`evap-refrigerante-${index}`}
            type="text"
            name="tipoRefrigerante"
            value={data.tipoRefrigerante || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("tipoRefrigerante")}
            disabled={disabled}
            placeholder="Ej: R-410A"
            className={getFieldClass("tipoRefrigerante")}
            maxLength={50}
          />
          {hasError("tipoRefrigerante") && (
            <span className={styles.errorText}>{errors.tipoRefrigerante}</span>
          )}
          <span className={styles.helperText}>Opcional</span>
        </div>
      </div>

      {/* Indicador de campos requeridos */}
      <div className={styles.formFooter}>
        <span className={styles.requiredHint}>
          <span className={styles.required}>*</span> Campos requeridos
        </span>
      </div>
    </div>
  );
}
