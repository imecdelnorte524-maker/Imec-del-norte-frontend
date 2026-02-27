// src/components/tools/ToolSoftDeleteModal.tsx
import { useState, useEffect } from "react";
import { toolsApi } from "../../api/tools";
import type {
  ToolEliminationReason,
  DeleteToolPayload,
} from "../../interfaces/ToolsInterfaces";
import styles from "../../styles/components/tools/ToolSoftDeleteModal.module.css";
import { playErrorSound } from "../../utils/sounds";

interface SoftDeleteToolInfo {
  herramientaId: number;
  nombre: string;
  marca?: string;
  serial?: string;
  estado?: string;
}

interface ToolSoftDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tool: SoftDeleteToolInfo | null;
}

export default function ToolSoftDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  tool,
}: ToolSoftDeleteModalProps) {
  const [motivo, setMotivo] = useState<ToolEliminationReason | "">("");
  const [observacion, setObservacion] = useState("");
  const [reasons, setReasons] = useState<ToolEliminationReason[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMotivo("");
      setObservacion("");
      setError(null);
      return;
    }

    const loadReasons = async () => {
      try {
        const data = await toolsApi.getEliminationReasons();
        setReasons(data as ToolEliminationReason[]);
      } catch (err: any) {
        console.error("Error cargando motivos:", err);
        setReasons([]);
      }
    };

    loadReasons();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool || !motivo) {
      setError("Debe seleccionar un motivo");
      playErrorSound();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: DeleteToolPayload = {
        motivo: motivo as ToolEliminationReason,
        observacion: observacion || undefined,
      };

      await toolsApi.softDelete(tool.herramientaId, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("❌ Error en soft delete:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Error al retirar la herramienta",
      );
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tool) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <h3>Retirar Herramienta</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.toolInfo}>
            <p>
              <strong>Herramienta:</strong> {tool.nombre}
            </p>
            {tool.marca && (
              <p>
                <strong>Marca:</strong> {tool.marca}
              </p>
            )}
            {tool.serial && (
              <p>
                <strong>Serial:</strong> {tool.serial}
              </p>
            )}
            {tool.estado && (
              <p>
                <strong>Estado actual:</strong> {tool.estado}
              </p>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Motivo de retiro *</label>
            <select
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value as ToolEliminationReason)
              }
              disabled={loading}
              className={styles.select}
              required
            >
              <option value="">Seleccionar motivo...</option>
              {reasons.map((reason) => (
                <option key={String(reason)} value={reason as string}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Observación (opcional)</label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={loading}
              className={styles.textarea}
              placeholder="Detalle adicional sobre el retiro"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnDanger}
              disabled={loading || !motivo}
            >
              {loading ? "Retirando..." : "Retirar Herramienta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
