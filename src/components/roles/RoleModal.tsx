import { useState, useEffect } from 'react';
import type { Rol, CreateRolDto, UpdateRolDto } from '../../interfaces/UserInterfaces';
import styles from '../../styles/components/roles/RoleModal.module.css';

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
  onUpdateRole 
}: RoleModalProps) {
  const [formData, setFormData] = useState<CreateRolDto>({
    nombreRol: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingRole) {
        setFormData({
          nombreRol: editingRole.nombreRol,
          descripcion: editingRole.descripcion || ''
        });
      } else {
        setFormData({
          nombreRol: '',
          descripcion: ''
        });
      }
      setError(null);
    }
  }, [isOpen, editingRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombreRol.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingRole) {
        await onUpdateRole(editingRole.rolId, formData as UpdateRolDto);
      } else {
        await onCreateRole(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
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