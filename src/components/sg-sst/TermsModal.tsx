import { useState, useEffect } from "react";
import { termsApi } from "../../api/terms";
import styles from "../../styles/components/sg-sst/TermsModal.module.css";
import type { TermsData } from "../../interfaces/TermsIntefaces";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (version: number) => void;
  onReject: () => void;
  type: string;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
  onReject,
  type,
}: TermsModalProps) {
  const [termsData, setTermsData] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    if (isOpen && type) {
      loadTerms();
    }
  }, [isOpen, type]);

  const loadTerms = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotConfigured(false);
      const data = await termsApi.getTermsByType(type);
      setTermsData(data);
    } catch (error: any) {
      console.error("Error loading terms:", error);

      if (error?.response?.status === 404) {
        setNotConfigured(true);
        setTermsData(null);
      } else {
        setError("No se pudieron cargar los términos y condiciones");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalBody}>
            <div className={styles.loadingText}>Cargando términos...</div>
          </div>
        </div>
      </div>
    );
  }

  if (notConfigured) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Términos no configurados</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.errorText}>
              Aún no existen términos y condiciones configurados para este formulario.
            </div>
            <p style={{ marginTop: "12px", fontSize: "0.95rem", color: "#666" }}>
              Solicita al administrador o al personal SG-SST que los cree desde el panel de gestión.
            </p>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.rejectButton}
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !termsData) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalBody}>
            <div className={styles.errorText}>
              {error || "Error al cargar términos"}
            </div>
            <button onClick={onClose} className={styles.closeErrorButton}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{termsData.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.termsBox}>
            {termsData.description && (
              <p className={styles.descriptionText}>{termsData.description}</p>
            )}

            <ul className={styles.termsList}>
              {termsData.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <p className={styles.versionText}>
              Versión: {termsData.version}
              {termsData.updatedAt &&
                ` - Actualizado: ${new Date(
                  termsData.updatedAt,
                ).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.rejectButton}
            onClick={onReject}
          >
            ✗ No acepto
          </button>
          <button
            type="button"
            className={styles.acceptButton}
            onClick={() => onAccept(termsData.version)}
          >
            ✓ Sí, acepto
          </button>
        </div>
      </div>
    </div>
  );
}