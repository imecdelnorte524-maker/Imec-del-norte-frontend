// src/components/tools/ToolSoftDeleteModal.tsx
import { useState, useEffect } from "react";
import { toolsApi } from "../../api/tools";
import type { Tool } from "../../api/tools";
import styles from "../../styles/components/tools/ToolSoftDeleteModal.module.css";

interface ToolSoftDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tool: Tool | null;
}

export default function ToolSoftDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  tool,
}: ToolSoftDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (isOpen && tool) {
      loadEliminationReasons();
      setSelectedReason("");
      setCustomReason("");
      setObservations("");
      setError(null);
    }
  }, [isOpen, tool]);

  const loadEliminationReasons = async () => {
    try {
      const data = await toolsApi.getEliminationReasons();
      setReasons(data);
    } catch (err: any) {
      console.error("Error cargando motivos:", err);
      setReasons(["DAÑADA", "ROBADA", "RETIRADA", "OTRO"]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool || !selectedReason) return;

    const motivo = selectedReason === "OTRO" ? customReason : selectedReason;
    if (!motivo.trim()) {
      setError("Por favor selecciona o especifica un motivo");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await toolsApi.softDelete(tool.herramientaId, {
        motivo,
        observacion: observations || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error eliminando herramienta:", err);
      setError(err.message || "Error al eliminar la herramienta");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tool) return null;

  const isOtherSelected = selectedReason === "OTRO";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Retirar Herramienta</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.modalBody}>
            <div className={styles.toolInfo}>
              <h3>Información de la herramienta</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <strong>Nombre:</strong>
                  <span>{tool.nombre}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Serial:</strong>
                  <span>{tool.serial || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Marca:</strong>
                  <span>{tool.marca || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <strong>Estado actual:</strong>
                  <span className={styles.currentStatus}>{tool.estado}</span>
                </div>
              </div>
            </div>

            <div className={styles.reasonSection}>
              <h3>Motivo de retiro</h3>
              <p className={styles.sectionDescription}>
                Selecciona el motivo por el cual se retira esta herramienta del inventario activo.
              </p>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div className={styles.reasonsGrid}>
                {reasons.map((reason) => (
                  <label
                    key={reason}
                    className={`${styles.reasonOption} ${
                      selectedReason === reason ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className={styles.radioInput}
                      disabled={loading}
                      required
                    />
                    <span className={styles.reasonText}>
                      {reason === "DAÑADA" && "🔧 Dañada"}
                      {reason === "ROBADA" && "🚨 Robada"}
                      {reason === "RETIRADA" && "📤 Retirada"}
                      {reason === "OTRO" && "📝 Otro"}
                      {![
                        "DAÑADA",
                        "ROBADA",
                        "RETIRADA",
                        "OTRO",
                      ].includes(reason) && reason}
                    </span>
                  </label>
                ))}
              </div>

              {isOtherSelected && (
                <div className={styles.customReasonContainer}>
                  <label htmlFor="customReason" className={styles.customReasonLabel}>
                    Especificar motivo
                  </label>
                  <input
                    id="customReason"
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe el motivo del retiro..."
                    className={styles.customReasonInput}
                    disabled={loading}
                    required={isOtherSelected}
                  />
                </div>
              )}

              <div className={styles.observationsContainer}>
                <label htmlFor="observations" className={styles.observationsLabel}>
                  Observaciones adicionales (opcional)
                </label>
                <textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detalles adicionales sobre el retiro..."
                  className={styles.observationsTextarea}
                  disabled={loading}
                  rows={3}
                />
                <small className={styles.helpText}>
                  Ej: Fecha del incidente, ubicación, detalles del daño, etc.
                </small>
              </div>
            </div>

            <div className={styles.warningBox}>
              <div className={styles.warningIcon}>⚠️</div>
              <div className={styles.warningContent}>
                <strong>Atención:</strong> Esta acción realizará una eliminación lógica
                (soft delete) de la herramienta. Los datos permanecerán en el sistema
                pero la herramienta será marcada como retirada y no aparecerá en el
                inventario activo. Puedes restaurarla posteriormente si es necesario.
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.confirmButton}
              disabled={loading || !selectedReason || (isOtherSelected && !customReason.trim())}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Procesando...
                </>
              ) : (
                "Confirmar Retiro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}