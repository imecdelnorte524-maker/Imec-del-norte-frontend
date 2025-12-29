import { useState, useEffect } from 'react';
import { inventory } from '../../api/inventory';
import type { Inventory } from '../../interfaces/InventoryInterfaces';
import {
  ToolStatus,
  SupplyStatus,
} from '../../shared/enums/inventory.enum';
import styles from '../../styles/components/inventory/EditInventoryModal.module.css';
import { playErrorSound } from '../../utils/sounds';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Inventory | null;
}

export default function EditInventoryModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: EditInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cantidadActual: 0,
    ubicacion: '',
    estado: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        cantidadActual: item.cantidadActual,
        ubicacion: item.ubicacion || '',
        estado:
          item.tool?.estado ||
          item.supply?.estado ||
          'Disponible',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!item) return;

  try {
    setLoading(true);
    setError(null);

    const updateData: any = {
      cantidadActual: formData.cantidadActual,
      ubicacion: formData.ubicacion || null,
      estado: formData.estado,  // Agregado
    };

    console.log('Datos a enviar:', updateData);  // ← Agrega esto
    console.log('Estado seleccionado:', formData.estado);  // ← Agrega esto

    await inventory.updateInventory(item.inventarioId, updateData);
    onSuccess();
  } catch (err: any) {
    console.error('Error detallado:', err.response?.data);  // ← Agrega esto
    setError(err.message || 'Error al actualizar el item');
    playErrorSound();
  } finally {
    setLoading(false);
  }
};

  const handleUpdateStock = async () => {
    if (!item || !item.insumoId) return;

    try {
      setLoading(true);
      await inventory.updateStock(
        item.inventarioId,
        formData.cantidadActual,
      );
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar stock');
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const isInsumo = item.tipo === 'insumo';
  const isHerramienta = item.tipo === 'herramienta';

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Editar {isInsumo ? 'Insumo' : 'Herramienta'}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nombre</label>
            <input
              type="text"
              value={item.nombreItem}
              className={styles.input}
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo</label>
            <input
              type="text"
              value={
                isHerramienta
                  ? '🛠️ Herramienta'
                  : '📦 Insumo'
              }
              className={styles.input}
              disabled
            />
          </div>

          {isInsumo && item.supply && (
            <>
              <div className={styles.formGroup}>
                <label>Categoría</label>
                <input
                  type="text"
                  value={item.supply.categoria}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Unidad de Medida</label>
                <input
                  type="text"
                  value={item.supply.unidadMedida}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cantidadActual">
                  Cantidad Actual *
                </label>
                <div className={styles.quantityControl}>
                  <input
                    type="number"
                    id="cantidadActual"
                    value={formData.cantidadActual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidadActual: Number(
                          e.target.value,
                        ),
                      })
                    }
                    min="0"
                    step={
                      item.supply.unidadMedida === 'Unidad'
                        ? '1'
                        : '0.1'
                    }
                    className={styles.input}
                    required
                  />
                  <span className={styles.unitLabel}>
                    {item.supply.unidadMedida}
                  </span>
                </div>
                <div className={styles.stockInfo}>
                  <small>
                    Stock mínimo: {item.supply.stockMin}{' '}
                    {item.supply.unidadMedida}
                  </small>
                  <small>
                    Valor unitario: $
                    {item.supply.valorUnitario.toLocaleString()}
                  </small>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value,
                    })
                  }
                  className={styles.select}
                >
                  {Object.values(SupplyStatus).map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </>
          )}

          {isHerramienta && item.tool && (
            <>
              <div className={styles.formGroup}>
                <label>Marca</label>
                <input
                  type="text"
                  value={item.tool.marca || 'No especificada'}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Serial</label>
                <input
                  type="text"
                  value={item.tool.serial || 'No especificado'}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="estado">Estado</label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estado: e.target.value,
                    })
                  }
                  className={styles.select}
                >
                  {Object.values(ToolStatus).map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="ubicacion">Ubicación</label>
            <input
              type="text"
              id="ubicacion"
              value={formData.ubicacion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ubicacion: e.target.value,
                })
              }
              placeholder="Ubicación en el inventario"
              className={styles.input}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
            >
              Cancelar
            </button>

            {isInsumo && (
              <button
                type="button"
                onClick={handleUpdateStock}
                className={styles.btnWarning}
                disabled={loading}
              >
                {loading
                  ? 'Actualizando...'
                  : 'Actualizar Solo Stock'}
              </button>
            )}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}