import { useState, useEffect } from "react";
import { warehouses } from "../../api/warehouses";
import styles from "../../styles/components/warehouses/WarehouseModal.module.css";
import { playErrorSound } from "../../utils/sounds";

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId?: number | null;
}

export default function WarehouseModal({
  isOpen,
  onClose,
  onSuccess,
  clientId,
}: WarehouseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    direccion: "",
  });

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        descripcion: "",
        direccion: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setError("El nombre de la bodega es obligatorio");
      playErrorSound();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 👇 ENVIAR clientId al backend
      const payload = {
        ...formData,
        clienteId: clientId || null, // Enviar null si no hay cliente
      };

      await warehouses.create(payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creando bodega:", err);
      setError(err.message || "Error al crear la bodega");
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <span className={styles.headerIcon}>🏢</span>
            {clientId ? "Nueva Bodega para Cliente" : "Nueva Bodega"}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nombre" className={styles.label}>
              <span className={styles.required}>*</span>
              Nombre de la Bodega
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={styles.input}
              placeholder="Ej: Bodega Central, Almacén Principal..."
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descripcion" className={styles.label}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Descripción opcional de la bodega..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="direccion" className={styles.label}>
              Dirección
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className={styles.input}
              placeholder="Dirección física de la bodega..."
              disabled={loading}
            />
          </div>

          {/* 👇 MOSTRAR CLIENTE ASOCIADO (solo informativo) */}
          {clientId && (
            <div className={styles.infoBox}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span className={styles.infoText}>
                Esta bodega se asociará automáticamente al cliente
              </span>
            </div>
          )}

          <div className={styles.formActions}>
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
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Creando...
                </>
              ) : (
                "Crear Bodega"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
