// src/components/common/UnitMeasureAutocomplete.tsx
import { useState, useEffect, useRef } from "react";
import { unitMeasureApi, type UnitMeasure } from "../../api/unit-measure";
import styles from "../../styles/components/common/UnitMeasureAutocomplete.module.css";

interface UnitMeasureAutocompleteProps {
  value?: string;
  onChange: (unitName: string) => void;
  onUnitCreated?: (unit: UnitMeasure) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function UnitMeasureAutocomplete({
  value,
  onChange,
  onUnitCreated,
  disabled = false,
  required = false,
  placeholder = "Ej: Unidad, Metro, Litro...",
  className = "",
}: UnitMeasureAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UnitMeasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [creating, setCreating] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchUnits = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const results = await unitMeasureApi.search(searchTerm);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error buscando unidades:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length >= 1) {
      searchUnits(newValue);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectUnit = (unit: UnitMeasure) => {
    setInputValue(unit.nombre);
    onChange(unit.nombre);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleCreateUnit = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    try {
      setCreating(true);
      const newUnit = await unitMeasureApi.findOrCreate(trimmedValue);
      setInputValue(newUnit.nombre);
      onChange(newUnit.nombre);
      setShowSuggestions(false);
      setSuggestions([]);
      
      if (onUnitCreated) {
        onUnitCreated(newUnit);
      }
      
      // Enfocar el input después de crear
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error("Error creando unidad:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        // Seleccionar la primera sugerencia
        handleSelectUnit(suggestions[0]);
      } else if (inputValue.trim()) {
        // Crear nueva unidad
        handleCreateUnit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "ArrowDown" && showSuggestions && suggestions.length > 0) {
      // Navegación con teclado
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    setHasFocus(true);
    if (inputValue.length >= 1) {
      searchUnits(inputValue);
    }
  };

  const handleBlur = () => {
    setHasFocus(false);
    // Pequeño delay para permitir clicks en sugerencias
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const isExistingUnit = suggestions.some(unit => 
    unit.nombre.toLowerCase() === inputValue.toLowerCase().trim()
  );

  const showCreateButton = inputValue.trim() && !isExistingUnit && !creating;
  const showHelpText = inputValue.trim() && !isExistingUnit && !showSuggestions && hasFocus;

  return (
    <div 
      className={`${styles.container} ${className}`} 
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      <label className={styles.label}>
        Unidad de Medida {required && <span className={styles.required}>*</span>}
      </label>

      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`${styles.input} ${disabled ? styles.disabled : ''}`}
            disabled={disabled || creating}
            required={required}
            autoComplete="off"
          />
          
          {showCreateButton && (
            <button
              type="button"
              onClick={handleCreateUnit}
              className={styles.createButton}
              disabled={disabled || creating}
              title={`Crear unidad "${inputValue.trim()}"`}
            >
              {creating ? (
                <span className={styles.spinner}></span>
              ) : (
                <span className={styles.plusIcon}>+</span>
              )}
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className={styles.suggestionsDropdown}>
            <div className={styles.suggestionsList}>
              {loading ? (
                <div className={styles.loading}>
                  <span className={styles.spinnerSmall}></span>
                  Buscando...
                </div>
              ) : (
                <>
                  {suggestions.map((unit) => (
                    <div
                      key={unit.unidadMedidaId}
                      onClick={() => handleSelectUnit(unit)}
                      className={styles.suggestionItem}
                    >
                      <span className={styles.unitName}>{unit.nombre}</span>
                      {unit.abreviatura && (
                        <span className={styles.unitAbbreviation}>
                          ({unit.abreviatura})
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {showHelpText && (
          <div className={styles.helpText}>
            Presiona Enter o haz clic en "+" para crear "{inputValue.trim()}"
          </div>
        )}
      </div>
    </div>
  );
}