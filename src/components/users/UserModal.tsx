import { useState, useEffect } from 'react';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../../interfaces/UserInterfaces';
import styles from '../../styles/components/users/UserModal.module.css';

// Objeto para los tipos de cédula
const TIPOS_CEDULA = {
  CC: 'CC',
  PPT: 'PPT'
} as const;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingUser: Usuario | null;
  onCreateUser: (data: CreateUsuarioDto) => Promise<Usuario>;
  onUpdateUser: (id: number, data: UpdateUsuarioDto) => Promise<Usuario>;
  roles: any[];
}

export default function UserModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingUser, 
  onCreateUser, 
  onUpdateUser,
  roles 
}: UserModalProps) {
  const [formData, setFormData] = useState<CreateUsuarioDto>({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    telefono: '',
    tipoCedula: TIPOS_CEDULA.CC,
    cedula: '',
    rolId: 0
  });

  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setLoading(false);
      
      if (editingUser) {
        setFormData({
          username: editingUser.username,
          email: editingUser.email,
          password: '', // No mostrar password actual
          nombre: editingUser.nombre,
          apellido: editingUser.apellido,
          telefono: editingUser.telefono || '',
          tipoCedula: editingUser.tipoCedula,
          cedula: editingUser.cedula,
          rolId: editingUser.role.rolId
        });
      } else {
        // Si no hay roles disponibles, usar 0 como valor temporal
        const defaultRolId = roles.length > 0 ? roles[0].rolId : 0;
        
        setFormData({
          username: '',
          email: '',
          password: '',
          nombre: '',
          apellido: '',
          telefono: '',
          tipoCedula: TIPOS_CEDULA.CC,
          cedula: '',
          rolId: defaultRolId
        });
      }
    }
  }, [isOpen, editingUser, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    
    // Validaciones básicas
    if (!formData.username || !formData.email || !formData.nombre || !formData.apellido || !formData.cedula) {
      setLocalError('Por favor complete todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (!editingUser && !formData.password) {
      setLocalError('La contraseña es obligatoria para nuevos usuarios');
      setLoading(false);
      return;
    }

    // Validar que tipoCedula sea válido
    if (!Object.values(TIPOS_CEDULA).includes(formData.tipoCedula as any)) {
      setLocalError('El tipo de cédula debe ser CC o PPT');
      setLoading(false);
      return;
    }

    // Validar que se haya seleccionado un rol válido
    if (formData.rolId === 0 || !roles.find(rol => rol.rolId === formData.rolId)) {
      setLocalError('Por favor seleccione un rol válido');
      setLoading(false);
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario (sin password si está vacío)
        const updateData: UpdateUsuarioDto = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await onUpdateUser(editingUser.usuarioId, updateData);
      } else {
        // Crear usuario
        await onCreateUser(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error en handleSubmit:', err);
      setLocalError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convertir rolId a número
    if (name === 'rolId') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleClose = () => {
    const defaultRolId = roles.length > 0 ? roles[0].rolId : 0;
    
    setFormData({
      username: '',
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      telefono: '',
      tipoCedula: TIPOS_CEDULA.CC,
      cedula: '',
      rolId: defaultRolId
    });
    setLocalError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        {localError && (
          <div className={styles.errorMessage}>
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="tipoCedula">Tipo Cédula *</label>
              <select
                id="tipoCedula"
                name="tipoCedula"
                value={formData.tipoCedula}
                onChange={handleChange}
                className={styles.select}
                required
                disabled={loading}
              >
                <option value={TIPOS_CEDULA.CC}>Cédula de Ciudadanía</option>
                <option value={TIPOS_CEDULA.PPT}>Permiso por Protección Temporal</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="cedula">Cédula *</label>
              <input
                type="text"
                id="cedula"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                placeholder="Ej: 123456789"
                className={styles.input}
                required
                minLength={8}
                maxLength={10}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ej: juan@empresa.com"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="username">Nombre de Usuario *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej: juanperez"
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">
              Contraseña {!editingUser && '*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={editingUser ? "Dejar vacío para no cambiar" : "Ingrese contraseña"}
              className={styles.input}
              required={!editingUser}
              minLength={6}
              disabled={loading}
            />
            {editingUser && (
              <small className={styles.helpText}>
                Dejar vacío para mantener la contraseña actual
              </small>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 3001234567"
                className={styles.input}
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="rolId">Rol *</label>
              <select
                id="rolId"
                name="rolId"
                value={formData.rolId}
                onChange={handleChange}
                className={styles.select}
                required
                disabled={loading || roles.length === 0}
              >
                {roles.length === 0 ? (
                  <option value="">Cargando roles...</option>
                ) : (
                  roles.map(rol => (
                    <option key={rol.rolId} value={rol.rolId}>
                      {rol.nombreRol}
                    </option>
                  ))
                )}
              </select>
              {roles.length === 0 && (
                <small className={styles.helpText}>
                  No se pudieron cargar los roles. Intente recargar la página.
                </small>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={handleClose} 
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.btnPrimary} 
              disabled={loading || roles.length === 0}
            >
              {loading ? 'Procesando...' : editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}