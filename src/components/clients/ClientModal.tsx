import { useState, useEffect } from 'react';
import { clients as clientsAPI } from '../../api/clients';
import { users as usersAPI } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';
import type {
  Client,
  CreateClientDto,
  ClientFormData,
  Usuario,
} from '../../interfaces/ClientInterfaces';
import styles from '../../styles/components/clients/ClientModal.module.css';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client?: Client) => void;
  editingClient?: Client | null;
}

export default function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  editingClient,
}: ClientModalProps) {
  const { user } = useAuth();
  const roleName = user?.role?.nombreRol || '';
  const isCliente = roleName === 'Cliente';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);
  const [showUserList, setShowUserList] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    nombre: '',
    nit: '',
    direccion: '',
    contacto: '',
    email: '',
    telefono: '',
    localizacion: '',
    idUsuarioContacto: null,
    areas: [],
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      nit: '',
      direccion: '',
      contacto: '',
      email: '',
      telefono: '',
      localizacion: '',
      idUsuarioContacto: null,
      areas: [],
    });
    setUserSearch('');
    setStep(1);
    setError(null);
  };

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Inicializar datos al abrir o cambiar cliente/rol
  useEffect(() => {
    if (!isOpen) return;

    if (editingClient) {
      setFormData({
        nombre: editingClient.nombre,
        nit: editingClient.nit,
        direccion: editingClient.direccion,
        contacto: editingClient.contacto,
        email: editingClient.email,
        telefono: editingClient.telefono,
        localizacion: editingClient.localizacion,
        idUsuarioContacto: editingClient.idUsuarioContacto,
        areas:
          editingClient.areas?.map((area) => ({
            id: area.idArea,
            nombreArea: area.nombreArea,
            subAreas:
              area.subAreas?.map((subArea) => ({
                id: subArea.idSubArea,
                nombreSubArea: subArea.nombreSubArea,
                areaId: subArea.areaId,
              })) || [],
          })) || [],
      });

      if (editingClient.usuarioContacto) {
        const u = editingClient.usuarioContacto;
        setUserSearch(`${u.nombre} ${u.apellido || ''}`);
      }
    } else {
      resetForm();

      // Si es cliente, usar su propio usuario como contacto
      if (isCliente && user) {
        const fullName = `${user.nombre} ${user.apellido || ''}`.trim();
        setFormData((prev) => ({
          ...prev,
          idUsuarioContacto: user.usuarioId,
          contacto: fullName,
          email: user.email,
          telefono: user.telefono || '',
        }));
        setUserSearch(fullName);
      }
    }

    // Solo Admin/Secretaria cargan usuarios
    if (!isCliente) {
      loadUsers();
    }
  }, [isOpen, editingClient, isCliente, user]);

  // Filtrar usuarios (solo para Admin/Secretaria)
  useEffect(() => {
    if (!userSearch.trim() || isCliente) {
      setFilteredUsers([]);
      return;
    }

    const filtered = users.filter(
      (u) =>
        `${u.nombre} ${u.apellido || ''}`
          .toLowerCase()
          .includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearch.toLowerCase()),
    );
    setFilteredUsers(filtered.slice(0, 10));
  }, [userSearch, users, isCliente]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (
    userId: number,
    userName: string,
    userEmail?: string,
    userPhone?: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      idUsuarioContacto: userId,
      contacto: userName,
      email: userEmail || prev.email,
      telefono: userPhone || prev.telefono,
    }));

    setUserSearch(userName);
    setShowUserList(false);
  };

  const validateStep1 = (): boolean => {
    const requiredFields = [
      'nombre',
      'nit',
      'direccion',
      'contacto',
      'email',
      'telefono',
      'localizacion',
    ];

    for (const field of requiredFields) {
      const value = formData[field as keyof ClientFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        setError(`El campo ${field} es requerido`);
        return false;
      }
    }

    if (!formData.idUsuarioContacto) {
      if (isCliente && user) {
        // El backend usará al usuario autenticado como contacto
        return true;
      }
      setError('Debe seleccionar un usuario contacto');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Ingrese un email válido');
      return false;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(formData.telefono.replace(/\s/g, ''))) {
      setError('Ingrese un teléfono válido (mínimo 7 dígitos)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientData: CreateClientDto = {
        nombre: formData.nombre,
        nit: formData.nit,
        direccion: formData.direccion,
        contacto: formData.contacto,
        email: formData.email,
        telefono: formData.telefono,
        localizacion: formData.localizacion,
      };

      if (formData.idUsuarioContacto) {
        clientData.idUsuarioContacto = formData.idUsuarioContacto;
      }

      let client: Client;
      if (editingClient) {
        client = await clientsAPI.updateClient(editingClient.idCliente, clientData);
      } else {
        client = await clientsAPI.createClient(clientData);
      }

      onSuccess(client);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>
              {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <div className={styles.stepIndicator}>
              <span className={step >= 1 ? styles.activeStep : ''}>1</span>
              <span className={styles.stepDivider}>›</span>
              <span className={step >= 2 ? styles.activeStep : ''}>2</span>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              <span className={styles.errorText}>{error}</span>
              <button
                className={styles.errorClose}
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Paso 1 */}
          {step === 1 && (
            <div className={styles.step}>
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>1</span>
                Información del Cliente
              </h3>

              <div className={styles.formGrid}>
                {/* Nombre y NIT */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre de la Empresa *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Cerámica Italia S.A."
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>NIT *</label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    placeholder="Ej: 900123456-7"
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                {/* Contacto y Email */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Persona de Contacto *</label>
                  <input
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    placeholder="Se autocompletará al seleccionar el usuario"
                    className={styles.formInput}
                    disabled={true}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Se autocompletará si el usuario tiene email"
                    className={styles.formInput}
                    disabled={true}
                  />
                </div>

                {/* Teléfono y ubicación */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Se autocompletará si el usuario tiene teléfono"
                    className={styles.formInput}
                    disabled={true}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ubicación *</label>
                  <input
                    type="text"
                    name="localizacion"
                    value={formData.localizacion}
                    onChange={handleInputChange}
                    placeholder="Ciudad, Departamento"
                    className={styles.formInput}
                    disabled={loading}
                  />
                </div>

                {/* Dirección */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Dirección Completa *</label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección física completa de la empresa"
                    className={styles.formTextarea}
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* Usuario contacto: buscador (solo Admin/Secretaria) */}
                {!isCliente && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel}>
                      Buscar y Seleccionar Usuario Contacto *
                      <span className={styles.fieldNote}>
                        (Esto autocompletará los campos anteriores)
                      </span>
                    </label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserList(true);
                        }}
                        onFocus={() => setShowUserList(true)}
                        placeholder="Buscar usuario por nombre, apellido o email..."
                        className={styles.formInput}
                        disabled={loading}
                      />

                      {showUserList && filteredUsers.length > 0 && (
                        <div className={styles.autocompleteList}>
                          {filteredUsers.map((u) => (
                            <div
                              key={u.usuarioId}
                              className={styles.autocompleteItem}
                              onClick={() =>
                                handleUserSelect(
                                  u.usuarioId,
                                  `${u.nombre} ${u.apellido || ''}`,
                                  u.email,
                                  u.telefono,
                                )
                              }
                            >
                              <div className={styles.userInfo}>
                                <div className={styles.userMainInfo}>
                                  <strong>
                                    {u.nombre} {u.apellido || ''}
                                  </strong>
                                  <span className={styles.userRole}>
                                    {u.role?.nombreRol}
                                  </span>
                                </div>
                                <div className={styles.userContactInfo}>
                                  <small className={styles.userEmail}>
                                    {u.email}
                                  </small>
                                  {u.telefono && (
                                    <small className={styles.userPhone}>
                                      {u.telefono}
                                    </small>
                                  )}
                                </div>
                              </div>
                              <span className={styles.selectIcon}>✓</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.idUsuarioContacto && (
                      <div className={styles.selectedUser}>
                        <span className={styles.checkmark}>✓</span>
                        <div className={styles.selectedUserInfo}>
                          <strong>Usuario contacto seleccionado</strong>
                          <small>
                            Los campos de contacto, email y teléfono se han
                            autocompletado
                          </small>
                        </div>
                        <button
                          className={styles.clearUserButton}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              idUsuarioContacto: null,
                            }));
                            setUserSearch('');
                          }}
                          disabled={loading}
                          title="Cambiar usuario contacto"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Cliente: se muestra su propio usuario como contacto */}
                {isCliente && user && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.selectedUser}>
                      <span className={styles.checkmark}>✓</span>
                      <div className={styles.selectedUserInfo}>
                        <strong>Usuario contacto</strong>
                        <small>
                          Se usará su usuario (
                          {user.nombre} {user.apellido || ''}
                          ) como contacto de la empresa.
                        </small>
                        <small>{user.email}</small>
                        {user.telefono && <small>{user.telefono}</small>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Nota de simplificación */}
                {!formData.idUsuarioContacto && !isCliente && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.simplificationNote}>
                      <span className={styles.noteIcon}>💡</span>
                      <div className={styles.noteContent}>
                        <p className={styles.noteTitle}>
                          Simplificación de formulario
                        </p>
                        <p className={styles.noteText}>
                          Al seleccionar un usuario contacto, los campos{' '}
                          <strong>Persona de Contacto</strong>,
                          <strong> Email</strong> y <strong>Teléfono</strong> se
                          autocompletarán automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: resumen (igual que ya tenías, adaptado) */}
          {step === 2 && (
            <div className={styles.step}>
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>2</span>
                Confirmar y Guardar
              </h3>

              <div className={styles.confirmationSection}>
                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Información del Cliente</h4>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Empresa:</span>
                      <span className={styles.summaryValue}>
                        {formData.nombre}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>NIT:</span>
                      <span className={styles.summaryValue}>
                        {formData.nit}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Contacto:</span>
                      <span className={styles.summaryValue}>
                        {formData.contacto}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Email:</span>
                      <span className={styles.summaryValue}>
                        {formData.email}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Teléfono:</span>
                      <span className={styles.summaryValue}>
                        {formData.telefono}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Ubicación:</span>
                      <span className={styles.summaryValue}>
                        {formData.localizacion}
                      </span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.fullWidth}`}>
                      <span className={styles.summaryLabel}>Dirección:</span>
                      <span className={styles.summaryValue}>
                        {formData.direccion}
                      </span>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.fullWidth}`}>
                      <span className={styles.summaryLabel}>
                        Usuario Contacto:
                      </span>
                      <span className={styles.summaryValue}>
                        {userSearch || 'No seleccionado'}
                        {formData.idUsuarioContacto && (
                          <span className={styles.userIdNote}>
                            {' '}
                            (ID: {formData.idUsuarioContacto})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.noteSection}>
                  <div className={styles.noteIcon}>💡</div>
                  <div className={styles.noteContent}>
                    <p className={styles.noteTitle}>
                      Simplificación de formulario activada
                    </p>
                    <p className={styles.noteText}>
                      {formData.idUsuarioContacto
                        ? 'Los campos de contacto se han autocompletado desde el usuario seleccionado.'
                        : 'Si es cliente, se usará su usuario como contacto de la empresa.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerContent}>
            <div className={styles.navigationButtons}>
              {step > 1 && (
                <button
                  className={styles.backButton}
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  ← Volver
                </button>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              {step < 2 ? (
                <button
                  className={styles.nextButton}
                  onClick={() => {
                    if (step === 1) {
                      if (validateStep1()) {
                        setStep(2);
                        setError(null);
                      }
                    }
                  }}
                  disabled={loading}
                >
                  Continuar →
                </button>
              ) : (
                <button
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Guardando...
                    </>
                  ) : editingClient ? (
                    'Actualizar Cliente'
                  ) : (
                    'Crear Cliente'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}