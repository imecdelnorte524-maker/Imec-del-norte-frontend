import { useState } from 'react';
import { inventory } from '../../api/inventory';
import { catalog } from '../../api/catalog';
import type { Inventory } from '../../interfaces/InventoryInterfaces';
import styles from '../../styles/components/inventory/DeleteInventoryModal.module.css';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: Inventory | null;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: DeleteConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!item || !item.inventarioId) {
      setError('No hay item seleccionado para eliminar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (item.herramientaId && item.tool) {
        try {
          console.log(
            `🗑️ Eliminando herramienta ${item.herramientaId} antes del inventario...`,
          );
          await catalog.deleteHerramienta(item.herramientaId);
          console.log('✅ Herramienta eliminada exitosamente');
        } catch (toolError: any) {
          console.warn(
            '⚠️ Error al eliminar herramienta, continuando con eliminación de inventario:',
            toolError,
          );
        }
      }

      if (item.insumoId && item.supply) {
        try {
          console.log(
            `🗑️ Eliminando insumo ${item.insumoId} antes del inventario...`,
          );
          await catalog.deleteInsumo(item.insumoId);
          console.log('✅ Insumo eliminado exitosamente');
        } catch (supplyError: any) {
          console.warn(
            '⚠️ Error al eliminar insumo, continuando con eliminación de inventario:',
            supplyError,
          );
        }
      }

      console.log(
        `🗑️ Eliminando registro de inventario ${item.inventarioId}...`,
      );
      const result = await inventory.deleteInventoryAndItem(
        item.inventarioId,
      );

      console.log('✅ Eliminación completa exitosa:', result);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Error al eliminar:', err);
      setError(
        err.message ||
          'Error al eliminar el item. Por favor, intente de nuevo.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const willDeleteTool = item.herramientaId && item.tool;
  const willDeleteSupply = item.insumoId && item.supply;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Confirmar Eliminación Completa</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <div className={styles.modalBody}>
          <p>
            ¿Estás seguro de que deseas eliminar{' '}
            <strong>completamente</strong> este registro? Esta
            acción eliminará:
          </p>

          <div className={styles.itemInfo}>
            <p>
              <strong>Tipo:</strong>{' '}
              {item.tipo === 'herramienta'
                ? '🛠️ Herramienta'
                : '📦 Insumo'}
            </p>
            <p>
              <strong>Nombre:</strong> {item.nombreItem}
            </p>
            <p>
              <strong>Cantidad:</strong> {item.cantidadActual}
            </p>
            <p>
              <strong>Ubicación:</strong>{' '}
              {item.ubicacion || 'No especificada'}
            </p>
            <p>
              <strong>ID Inventario:</strong>{' '}
              {item.inventarioId}
            </p>

            {willDeleteTool && item.tool && (
              <>
                <p>
                  <strong>Herramienta ID:</strong>{' '}
                  {item.herramientaId}
                </p>
                <p>
                  <strong>Estado:</strong> {item.tool.estado}
                </p>
                {item.tool.serial && (
                  <p>
                    <strong>Serial:</strong> {item.tool.serial}
                  </p>
                )}
                {item.tool.marca && (
                  <p>
                    <strong>Marca:</strong> {item.tool.marca}
                  </p>
                )}
              </>
            )}

            {willDeleteSupply && item.supply && (
              <>
                <p>
                  <strong>Insumo ID:</strong> {item.insumoId}
                </p>
                <p>
                  <strong>Categoría:</strong>{' '}
                  {item.supply.categoria}
                </p>
                <p>
                  <strong>Unidad:</strong>{' '}
                  {item.supply.unidadMedida}
                </p>
                <p>
                  <strong>Stock mínimo:</strong>{' '}
                  {item.supply.stockMin}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  {item.supply.estado}
                </p>
              </>
            )}
          </div>

          <div className={styles.warning}>
            ⚠️ Esta acción es <strong>irreversible</strong> y
            eliminará:
            <ul
              style={{
                margin: '8px 0 0 20px',
                padding: 0,
                fontSize: '0.9rem',
              }}
            >
              <li>
                El registro de inventario (ID:{' '}
                {item.inventarioId})
              </li>
              {willDeleteTool && (
                <li>
                  La herramienta y todos sus datos (ID:{' '}
                  {item.herramientaId})
                </li>
              )}
              {willDeleteSupply && (
                <li>
                  El insumo y todos sus datos (ID:{' '}
                  {item.insumoId})
                </li>
              )}
              <li>
                Todos los datos relacionados permanentemente
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={styles.btnDanger}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ marginRight: '8px' }}>⏳</span>
                Eliminando...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>🗑️</span>
                Sí, Eliminar Todo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}