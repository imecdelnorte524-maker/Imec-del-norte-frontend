// src/components/common/WarehouseSelector.tsx
import { useState, useEffect, useRef } from "react";
import { warehouses, type Warehouse } from "../../api/warehouses";
import styles from "../../styles/components/common/WarehouseSelector.module.css";

interface WarehouseSelectorProps {
  value?: number | null;
  onChange: (bodegaId: number | null) => void;
  disabled?: boolean;
  required?: boolean;
  allowCreate?: boolean;
}

export default function WarehouseSelector({
  value,
  onChange,
  disabled = false,
  required = false,
  allowCreate = true,
}: WarehouseSelectorProps) {
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewWarehouse, setShowNewWarehouse] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehouses.getAll();
      setWarehousesList(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      setError("Por favor ingrese un nombre para la bodega");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const newWarehouse = await warehouses.create({
        nombre: newWarehouseName.trim(),
        descripcion: "",
      });

      setWarehousesList([...warehousesList, newWarehouse]);
      onChange(newWarehouse.bodegaId);
      setNewWarehouseName("");
      setShowNewWarehouse(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const selectedWarehouse = warehousesList.find(w => w.bodegaId === value);

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        Bodega {required && <span className={styles.required}>*</span>}
      </label>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Cargando bodegas...</div>
      ) : (
        <>
          <div className={styles.selectContainer}>
            <select
              ref={selectRef}
              value={value || ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              disabled={disabled}
              className={styles.select}
              required={required}
            >
              <option value="">Seleccionar bodega...</option>
              {warehousesList.map((warehouse) => (
                <option key={warehouse.bodegaId} value={warehouse.bodegaId}>
                  {warehouse.nombre}
                  {!warehouse.activa && " (Inactiva)"}
                </option>
              ))}
            </select>

            {allowCreate && (
              <button
                type="button"
                onClick={() => setShowNewWarehouse(!showNewWarehouse)}
                className={styles.addButton}
                disabled={disabled}
              >
                {showNewWarehouse ? "✕" : "+"}
              </button>
            )}
          </div>

          {showNewWarehouse && (
            <div className={styles.createForm}>
              <input
                type="text"
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
                placeholder="Nombre de la nueva bodega"
                className={styles.input}
                disabled={creating}
              />
              <button
                type="button"
                onClick={handleCreateWarehouse}
                className={styles.createButton}
                disabled={creating || !newWarehouseName.trim()}
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          )}

          {selectedWarehouse && (
            <div className={styles.selectedInfo}>
              <small>
                <strong>Seleccionada:</strong> {selectedWarehouse.nombre}
                {selectedWarehouse.descripcion && ` - ${selectedWarehouse.descripcion}`}
              </small>
            </div>
          )}
        </>
      )}
    </div>
  );
}