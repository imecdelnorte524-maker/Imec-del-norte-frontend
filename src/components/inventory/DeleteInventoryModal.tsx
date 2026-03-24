import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query"; // 👈 IMPORTAR
import { inventory } from "../../api/inventory";
import type { InventoryItem } from "../../interfaces/InventoryInterfaces";
import styles from "../../styles/components/inventory/DeleteInventoryModal.module.css";
import { playErrorSound } from "../../utils/sounds";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem | null;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: DeleteConfirmationModalProps) {
  const queryClient = useQueryClient(); // 👈 AÑADIR
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!item || !item.inventarioId) {
      setError("No hay item seleccionado para eliminar");
      playErrorSound();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await inventory.deleteComplete(item.inventarioId);

      // 🔥 REFRESCAR CACHÉ
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      if (item.tipo === "herramienta") {
        await queryClient.invalidateQueries({ queryKey: ["tools"] });
      } else {
        await queryClient.invalidateQueries({ queryKey: ["supplies"] });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error al eliminar:", err);
      setError(
        err.message ||
          "Error al eliminar el item. Por favor, intente de nuevo.",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const willDeleteTool = !!item.tool;
  const willDeleteSupply = !!item.supply;

  const herramientaId = item.tool?.herramientaId;
  const insumoId = item.supply?.insumoId;

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

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.modalBody}>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>completamente</strong>{" "}
            este registro? Esta acción eliminará:
          </p>

          <div className={styles.itemInfo}>
            <p>
              <strong>Tipo:</strong>{" "}
              {item.tipo === "herramienta" ? "🛠️ Herramienta" : "📦 Insumo"}
            </p>
            <p>
              <strong>Nombre:</strong> {item.nombreItem}
            </p>
            <p>
              <strong>Cantidad:</strong> {item.cantidadActual}
            </p>
            <p>
              <strong>Ubicación:</strong> {item.ubicacion || "No especificada"}
            </p>
            <p>
              <strong>ID Inventario:</strong> {item.inventarioId}
            </p>

            {willDeleteTool && item.tool && (
              <>
                <p>
                  <strong>Herramienta ID:</strong> {herramientaId}
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
                  <strong>Insumo ID:</strong> {insumoId}
                </p>
                <p>
                  <strong>Categoría:</strong> {item.supply.categoria}
                </p>
                <p>
                  <strong>Unidad:</strong> {item.supply.unidadMedida}
                </p>
                <p>
                  <strong>Stock mínimo:</strong> {item.supply.stockMin}
                </p>
                <p>
                  <strong>Estado:</strong> {item.supply.estado}
                </p>
              </>
            )}
          </div>

          <div className={styles.warning}>
            ⚠️ Esta acción es <strong>irreversible</strong> y eliminará:
            <ul
              style={{
                margin: "8px 0 0 20px",
                padding: 0,
                fontSize: "0.9rem",
              }}
            >
              <li>El registro de inventario (ID: {item.inventarioId})</li>
              {willDeleteTool && herramientaId && (
                <li>La herramienta y todos sus datos (ID: {herramientaId})</li>
              )}
              {willDeleteSupply && insumoId && (
                <li>El insumo y todos sus datos (ID: {insumoId})</li>
              )}
              <li>Todos los datos relacionados permanentemente</li>
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
                <span style={{ marginRight: "8px" }}>⏳</span>
                Eliminando...
              </>
            ) : (
              <>
                <span style={{ marginRight: "8px" }}>🗑️</span>
                Sí, Eliminar Todo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
