import { useState, useEffect } from 'react';
import type { Rol, CreateRolDto, UpdateRolDto } from '../../interfaces/RolesInterfaces';
import styles from '../../styles/components/roles/RoleModal.module.css';
import { playErrorSound } from '../../utils/sounds';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRole?: Rol | null;
  onCreateRole: (data: CreateRolDto) => Promise<Rol>;
  onUpdateRole: (id: number, data: UpdateRolDto) => Promise<Rol>;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSuccess,
  editingRole,
  onCreateRole,
  onUpdateRole,
}: RoleModalProps) {
  const [formData, setFormData] = useState<CreateRolDto>({
    nombreRol: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingRole) {
        setFormData({
          nombreRol: editingRole.nombreRol ?? '',
          descripcion: editingRole.descripcion ?? '',
        });
      } else {
        setFormData({
          nombreRol: '',
          descripcion: '',
        });
      }
      setError(null);
    }
  }, [isOpen, editingRole]);

  // Extrae un mensaje legible desde distintos formatos de error de axios/backend
  const getApiErrorMessage = (err: any): string => {
    const resp = err?.response?.data;
    if (!resp) {
      return err?.message || 'Error desconocido';
    }
    if (Array.isArray(resp.message)) return resp.message.join(', ');
    if (typeof resp.message === 'string') return resp.message;
    if (typeof resp.error === 'string') return resp.error;
    try {
      return JSON.stringify(resp);
    } catch {
      return String(resp);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreTrim = (formData.nombreRol ?? '').trim();
    if (!nombreTrim) {
      setError('El nombre del rol es requerido');
      playErrorSound();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingRole) {
        // Para update: enviamos los campos (trim). Si quieres enviar solo los que cambiaron
        // puedes comparar con editingRole y construir el payload dinámicamente.
        const payload: UpdateRolDto = {
          nombreRol: nombreTrim,
          // Permitimos envío de string vacío si el usuario lo dejó así (para permitir limpiar la descripción)
          descripcion: formData.descripcion !== undefined ? formData.descripcion.trim() : '',
        };
        console.debug('Updating role payload:', payload);
        await onUpdateRole(editingRole.rolId, payload);
      } else {
        // Para create: si descripción está vacía la dejamos undefined (mapCreateRolToBackend
        // en rolesApi la convertirá a null si así lo definiste ahí).
        const payload: CreateRolDto = {
          nombreRol: nombreTrim,
          descripcion: formData.descripcion?.trim() || undefined,
        };
        console.debug('Creating role payload:', payload);
        await onCreateRole(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = getApiErrorMessage(err);
      setError(msg);
      playErrorSound();
      console.error('RoleModal submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
        <div className={styles.modalHeader}>
          <h2 id="role-modal-title">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {error && (
            <div className={styles.errorMessage} role="status" aria-live="polite">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="nombreRol">Nombre del Rol *</label>
            <input
              type="text"
              id="nombreRol"
              name="nombreRol"
              value={formData.nombreRol}
              onChange={handleChange}
              placeholder="Ej: Administrador, Técnico, Cliente"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción del rol y sus permisos..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Guardando...' : (editingRole ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}