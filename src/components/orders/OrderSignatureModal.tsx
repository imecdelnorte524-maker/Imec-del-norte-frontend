// src/components/orders/OrderSignatureModal.tsx
import { useState } from "react";
import SignaturePad from "../sg-sst/SignaturePad";
import styles from "../../styles/components/orders/OrderSignatureModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    position: string;
    signatureData: string | null;
  }) => Promise<void> | void;
  loading?: boolean;
}

export default function OrderSignatureModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: Props) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    position: false,
    signature: false,
  });

  if (!isOpen) return null;

  const handleSaveSignature = (data: string) => {
    if (!loading) {
      // Solo permitir guardar si no está cargando
      setSignatureData(data);
      setFieldErrors((prev) => ({ ...prev, signature: false }));
      setError(null);
    }
  };

  const handleClearSignature = () => {
    if (!loading) {
      // Solo permitir limpiar si no está cargando
      setSignatureData(null);
    }
  };

  const validateFields = () => {
    const errors = {
      name: !name.trim(),
      position: !position.trim(),
      signature: !signatureData,
    };

    setFieldErrors(errors);

    if (errors.name || errors.position || errors.signature) {
      if (!name.trim() && !position.trim() && !signatureData) {
        setError("Todos los campos son obligatorios");
      } else if (!name.trim()) {
        setError("El nombre es obligatorio");
      } else if (!position.trim()) {
        setError("El cargo es obligatorio");
      } else if (!signatureData) {
        setError("La firma es obligatoria");
      }
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    if (loading) return; // Prevenir múltiples envíos
    if (!validateFields()) return;

    setError(null);
    await onSubmit({
      name: name.trim(),
      position: position.trim(),
      signatureData,
    });
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={loading ? undefined : onClose}
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Firma de recibido</h3>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Cerrar"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="receiver-name">Nombre de quien recibe</label>
            <input
              id="receiver-name"
              type="text"
              className={fieldErrors.name ? styles.error : ""}
              value={name}
              onChange={(e) => {
                if (!loading) {
                  setName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: false }));
                  setError(null);
                }
              }}
              placeholder="Ej: Carlos Pérez"
              disabled={loading}
              autoComplete="off"
            />
            {fieldErrors.name && (
              <div className={styles.fieldError}>Este campo es obligatorio</div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="receiver-position">Cargo</label>
            <input
              id="receiver-position"
              type="text"
              className={fieldErrors.position ? styles.error : ""}
              value={position}
              onChange={(e) => {
                if (!loading) {
                  setPosition(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, position: false }));
                  setError(null);
                }
              }}
              placeholder="Ej: Jefe de Mantenimiento"
              disabled={loading}
              autoComplete="off"
            />
            {fieldErrors.position && (
              <div className={styles.fieldError}>Este campo es obligatorio</div>
            )}
          </div>

          <div className={styles.signatureSection}>
            <label htmlFor="signature-pad">Firma</label>
            <div
              className={`${styles.signaturePadWrapper} ${fieldErrors.signature ? styles.error : ""} ${loading ? styles.disabled : ""}`}
            >
              <SignaturePad
                onSignatureSave={handleSaveSignature}
                onClear={handleClearSignature}
              />
            </div>
            {fieldErrors.signature && (
              <div className={styles.fieldError}>La firma es obligatoria</div>
            )}
            <div className={styles.signatureInstructions}>
              {loading
                ? "Procesando firma..."
                : "Firma en el recuadro superior y haz clic en 'Guardar firma'"}
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={styles.cancelButton}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner} />
                  Cancelando...
                </>
              ) : (
                "Cancelar"
              )}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner} />
                  Guardando...
                </>
              ) : (
                "Guardar firma"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
