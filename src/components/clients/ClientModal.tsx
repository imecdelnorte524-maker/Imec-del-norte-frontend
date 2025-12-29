import { useState, useEffect } from "react";
import { clients as clientsAPI } from "../../api/clients";
import { users as usersAPI } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";
import type {
  Client,
  CreateClientDto,
  ClientFormData,
  Usuario,
} from "../../interfaces/ClientInterfaces";
import styles from "../../styles/components/clients/ClientModal.module.css";
import { playErrorSound } from "../../utils/sounds";

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
  const roleName = user?.role?.nombreRol || "";
  const isCliente = roleName === "Cliente";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<Usuario[]>([]);
  const [showUserList, setShowUserList] = useState(false);

  // Estados para ÁREAS / SUBÁREAS
  const [newAreaName, setNewAreaName] = useState("");
  const [newSubAreaName, setNewSubAreaName] = useState("");
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | "">("");
  const [protectedAreaId, setProtectedAreaId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    nombre: "",
    nit: "",
    direccion: "",
    contacto: "",
    email: "",
    telefono: "",
    localizacion: "",
    idUsuarioContacto: null,
    areas: [],
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      nit: "",
      direccion: "",
      contacto: "",
      email: "",
      telefono: "",
      localizacion: "",
      idUsuarioContacto: null,
      areas: [],
    });
    setUserSearch("");
    setStep(1);
    setError(null);
    setNewAreaName("");
    setNewSubAreaName("");
    setSelectedAreaIndex("");
    setProtectedAreaId(null);
  };

  const loadUsers = async () => {
    try {
      const usersData = await usersAPI.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  // Inicializar datos al abrir o cambiar cliente/rol
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setNewAreaName("");
    setNewSubAreaName("");
    setSelectedAreaIndex("");

    if (editingClient) {
      // área principal protegida (la primera creada)
      setProtectedAreaId(editingClient.areas?.[0]?.idArea ?? null);

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
        setUserSearch(`${u.nombre} ${u.apellido || ""}`);
      }
    } else {
      resetForm();

      // Si es cliente, usar su propio usuario como contacto (solo nombre)
      if (isCliente && user) {
        const fullName = `${user.nombre} ${user.apellido || ""}`.trim();
        setFormData((prev) => ({
          ...prev,
          idUsuarioContacto: user.usuarioId,
          contacto: fullName,
          // NO autocompletar email del usuario personal
        }));
        setUserSearch(fullName);
      }
      setProtectedAreaId(null);
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
        `${u.nombre} ${u.apellido || ""}`
          .toLowerCase()
          .includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearch.toLowerCase())
    );
    setFilteredUsers(filtered.slice(0, 10));
  }, [userSearch, users, isCliente]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (
    userId: number,
    userName: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      idUsuarioContacto: userId,
      contacto: userName, // Solo autocompletar el nombre
      // NO autocompletar email ni teléfono
    }));

    setUserSearch(userName);
    setShowUserList(false);
  };

  // Handlers para ÁREAS / SUBÁREAS
  const handleAddArea = () => {
    const name = newAreaName.trim();
    if (!name) {
      setError("El nombre del área es obligatorio");
      playErrorSound();
      return;
    }

    setFormData((prev) => ({
      ...prev,
      areas: [...prev.areas, { nombreArea: name, subAreas: [] }],
    }));

    setNewAreaName("");
    setError(null);
  };

  const handleRemoveArea = (areaIndex: number) => {
    setFormData((prev) => {
      if (areaIndex < 0 || areaIndex >= prev.areas.length) return prev;

      const isOnlyArea = prev.areas.length === 1;
      const area = prev.areas[areaIndex];

      // NUEVO CLIENTE: no permitir borrar la primera creada (index 0)
      const isProtectedByIndex = !editingClient && areaIndex === 0;

      // EDICIÓN: no permitir borrar el área original principal
      const isProtectedById =
        !!editingClient &&
        area.id &&
        protectedAreaId &&
        area.id === protectedAreaId;

      if (isOnlyArea || isProtectedByIndex || isProtectedById) {
        return prev;
      }

      const areas = prev.areas.filter((_, idx) => idx !== areaIndex);
      return { ...prev, areas };
    });
  };

  const handleRemoveSubArea = (areaIndex: number, subIndex: number) => {
    setFormData((prev) => {
      if (
        areaIndex < 0 ||
        areaIndex >= prev.areas.length ||
        subIndex < 0 ||
        subIndex >= prev.areas[areaIndex].subAreas.length
      ) {
        return prev;
      }

      const area = prev.areas[areaIndex];
      const updatedSubAreas = area.subAreas.filter((_, i) => i !== subIndex);
      const updatedArea = { ...area, subAreas: updatedSubAreas };
      const areas = [...prev.areas];
      areas[areaIndex] = updatedArea;

      return { ...prev, areas };
    });
  };

  const handleAddSubArea = () => {
    const name = newSubAreaName.trim();
    if (selectedAreaIndex === "" || !name) {
      setError("Debe seleccionar un área y escribir el nombre de la subárea");
      playErrorSound();
      return;
    }

    setFormData((prev) => {
      // Asegurarnos de que es un número válido
      if (
        typeof selectedAreaIndex !== "number" ||
        selectedAreaIndex < 0 ||
        selectedAreaIndex >= prev.areas.length
      ) {
        return prev;
      }

      const area = prev.areas[selectedAreaIndex];
      const newSubArea = {
        nombreSubArea: name,
        areaId: area.id, // puede ser undefined; se corrige en el submit
      };

      const updatedArea = {
        ...area,
        subAreas: [...area.subAreas, newSubArea],
      };

      const areas = [...prev.areas];
      areas[selectedAreaIndex] = updatedArea;

      return { ...prev, areas };
    });

    setNewSubAreaName("");
    setError(null);
  };

  const validateStep1 = (): boolean => {
    // Campos obligatorios (incluye Teléfono)
    const requiredFields: (keyof ClientFormData)[] = [
      "nombre",
      "nit",
      "direccion",
      "localizacion",
      "telefono",
    ];

    const fieldLabels: Partial<Record<keyof ClientFormData, string>> = {
      nombre: "Nombre de la Empresa",
      nit: "NIT",
      direccion: "Dirección",
      localizacion: "Ubicación",
      telefono: "Teléfono",
    };

    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(
          `El campo ${fieldLabels[field] ?? String(field)} es requerido`
        );
        playErrorSound();
        return false;
      }
    }

    // Email: validar solo si viene algo
    const emailTrimmed = formData.email.trim();
    if (emailTrimmed) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setError("Ingrese un email válido");
        playErrorSound();
        return false;
      }
    }

    // Teléfono: siempre validar, ya sabemos que no está vacío
    const phoneTrimmed = formData.telefono.trim();
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(phoneTrimmed.replace(/\s/g, ""))) {
      setError("Ingrese un teléfono válido (mínimo 7 dígitos)");
      playErrorSound();
      return false;
    }

    // Ya NO es obligatorio tener usuario contacto
    return true;
  };

  const validateAreas = (): boolean => {
    if (formData.areas.length === 0) {
      setError("Debe agregar al menos un área para el cliente.");
      playErrorSound();
      setStep(2);
      return false;
    }

    for (const area of formData.areas) {
      if (!area.nombreArea || area.nombreArea.trim() === "") {
        setError("Todas las áreas deben tener un nombre.");
        playErrorSound();
        setStep(2);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    // Validar que haya al menos un área
    if (!validateAreas()) return;

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

      let clientId: number;

      if (editingClient) {
        // 1) Actualizar cliente base
        await clientsAPI.updateClient(editingClient.idCliente, clientData);
        clientId = editingClient.idCliente;

        // 2) Sincronizar ÁREAS y SUBÁREAS
        const originalAreas = editingClient.areas || [];

        // Áreas a eliminar (no presentes en el formulario y que no sean el área protegida)
        const originalAreaIds = originalAreas.map((a) => a.idArea);
        const currentAreaIds = formData.areas
          .filter((a) => a.id)
          .map((a) => a.id as number);

        const areasToDelete = originalAreaIds.filter(
          (id) =>
            !currentAreaIds.includes(id) &&
            (!protectedAreaId || id !== protectedAreaId)
        );

        for (const areaId of areasToDelete) {
          await clientsAPI.deleteArea(areaId);
        }

        // Crear / actualizar áreas y sus subáreas
        for (const areaForm of formData.areas) {
          const trimmedAreaName = areaForm.nombreArea.trim();
          let areaId: number;

          const originalArea = areaForm.id
            ? originalAreas.find((a) => a.idArea === areaForm.id)
            : undefined;

          if (!areaForm.id) {
            // Área nueva
            const createdArea = await clientsAPI.createArea({
              nombreArea: trimmedAreaName,
              clienteId: clientId,
            });
            areaId = createdArea.idArea;
          } else {
            // Área existente
            areaId = areaForm.id;

            if (originalArea && originalArea.nombreArea !== trimmedAreaName) {
              await clientsAPI.updateArea(areaId, {
                nombreArea: trimmedAreaName,
              });
            }
          }

          // Subáreas: eliminar las que ya no estén
          const originalSubAreas = originalArea?.subAreas || [];
          const originalSubIds = originalSubAreas.map((s) => s.idSubArea);
          const currentSubIds = areaForm.subAreas
            .filter((s) => s.id)
            .map((s) => s.id as number);

          const subToDelete = originalSubIds.filter(
            (id) => !currentSubIds.includes(id)
          );
          for (const subId of subToDelete) {
            await clientsAPI.deleteSubArea(subId);
          }

          // Crear / actualizar subáreas
          for (const subForm of areaForm.subAreas) {
            const trimmedSubName = subForm.nombreSubArea.trim();
            if (!trimmedSubName) continue;

            if (!subForm.id) {
              // Subárea nueva
              await clientsAPI.createSubArea({
                nombreSubArea: trimmedSubName,
                areaId,
              });
            } else {
              // Subárea existente
              const originalSub = originalSubAreas.find(
                (s) => s.idSubArea === subForm.id
              );
              if (originalSub && originalSub.nombreSubArea !== trimmedSubName) {
                await clientsAPI.updateSubArea(subForm.id, {
                  nombreSubArea: trimmedSubName,
                });
              }
            }
          }
        }
      } else {
        // CREACIÓN
        const client = await clientsAPI.createClient(clientData);
        clientId = client.idCliente;

        // Crear áreas y subáreas
        for (const areaForm of formData.areas) {
          const trimmedAreaName = areaForm.nombreArea.trim();

          const createdArea = await clientsAPI.createArea({
            nombreArea: trimmedAreaName,
            clienteId: clientId,
          });

          for (const subForm of areaForm.subAreas) {
            const trimmedSubName = subForm.nombreSubArea.trim();
            if (!trimmedSubName) continue;

            await clientsAPI.createSubArea({
              nombreSubArea: trimmedSubName,
              areaId: createdArea.idArea,
            });
          }
        }
      }

      // Recargar cliente con áreas/subáreas completas
      const finalClient = await clientsAPI.getClientById(
        editingClient ? editingClient.idCliente : clientId!
      );

      onSuccess(finalClient);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar el cliente");
      playErrorSound();
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
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <div className={styles.stepIndicator}>
              <span className={step >= 1 ? styles.activeStep : ""}>1</span>
              <span className={styles.stepDivider}>›</span>
              <span className={step >= 2 ? styles.activeStep : ""}>2</span>
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
                  <label className={styles.formLabel}>
                    Nombre de la Empresa *
                  </label>
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
                  <label className={styles.formLabel}>
                    Persona de Contacto 
                  </label>
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
                  <label className={styles.formLabel}>Email </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email corporativo de la empresa"
                    className={styles.formInput}
                    disabled={loading}
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
                    placeholder="Teléfono de la empresa"
                    className={styles.formInput}
                    disabled={loading}
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
                  <label className={styles.formLabel}>
                    Dirección Completa *
                  </label>
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
                      Buscar y Seleccionar Usuario Contacto (opcional)
                      <span className={styles.fieldNote}>
                        (Solo autocompletará el nombre de la persona de contacto)
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
                                  `${u.nombre} ${u.apellido || ""}`
                                )
                              }
                            >
                              <div className={styles.userInfo}>
                                <div className={styles.userMainInfo}>
                                  <strong>
                                    {u.nombre} {u.apellido || ""}
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
                            Solo el campo de nombre de contacto se ha autocompletado
                          </small>
                        </div>
                        <button
                          className={styles.clearUserButton}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              idUsuarioContacto: null,
                              contacto: "", // También limpiar el nombre
                            }));
                            setUserSearch("");
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
                          Se usará su usuario ({user.nombre}{" "}
                          {user.apellido || ""}) como contacto de la empresa.
                        </small>
                        <small>Email y teléfono deben ser los de la empresa</small>
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
                          Al seleccionar un usuario contacto, solo el campo{" "}
                          <strong>Persona de Contacto</strong> se autocompletará.
                          Los campos <strong>Email</strong> y <strong>Teléfono </strong>  
                           deben ser los de la empresa y se deben ingresar manualmente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Áreas, Subáreas y Resumen */}
          {step === 2 && (
            <div className={styles.step}>
              <h3 className={styles.stepTitle}>
                <span className={styles.stepNumber}>2</span>
                Áreas, Subáreas y Confirmación
              </h3>
              <p className={styles.stepDescription}>
                Defina al menos un área principal para el cliente y, si lo
                desea, sus subáreas.
              </p>

              {/* SECCIÓN ÁREAS */}
              <div className={styles.areasSection}>
                {/* Formulario para añadir área */}
                <div className={styles.addAreaForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Nombre del área principal *
                    </label>
                    <div className={styles.areaInputGroup}>
                      <input
                        type="text"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                        placeholder="Ej: Comercial, Producción, Contabilidad..."
                        className={styles.areaInput}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className={styles.addButton}
                        onClick={handleAddArea}
                        disabled={loading || !newAreaName.trim()}
                      >
                        <span className={styles.plusIcon}>+</span>
                        Añadir área
                      </button>
                    </div>
                    <small>
                      Debe existir al menos un área para poder guardar el
                      cliente.
                    </small>
                  </div>
                </div>

                {/* Lista de áreas o mensaje vacío */}
                {formData.areas.length === 0 ? (
                  <div className={styles.noAreas}>
                    <div className={styles.noDataIcon}>📁</div>
                    <p>Aún no hay áreas registradas para este cliente.</p>
                    <small>
                      Agrega al menos una área utilizando el formulario
                      superior.
                    </small>
                  </div>
                ) : (
                  <div className={styles.areasList}>
                    <h4 className={styles.listTitle}>Áreas del cliente</h4>
                    {formData.areas.map((area, index) => {
                      const isOnlyArea = formData.areas.length === 1;
                      const isProtectedByIndex = !editingClient && index === 0;
                      const isProtectedById =
                        !!editingClient &&
                        area.id !== undefined &&
                        protectedAreaId !== null &&
                        area.id === protectedAreaId;
                      const disableRemove =
                        isOnlyArea || isProtectedByIndex || isProtectedById;

                      return (
                        <div key={area.id ?? index} className={styles.areaItem}>
                          <div className={styles.areaHeader}>
                            <div className={styles.areaInfo}>
                              <div className={styles.areaName}>
                                <span className={styles.areaBullet}>•</span>
                                <input
                                  type="text"
                                  value={area.nombreArea}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData((prev) => {
                                      const areas = [...prev.areas];
                                      areas[index] = {
                                        ...areas[index],
                                        nombreArea: value,
                                      };
                                      return { ...prev, areas };
                                    });
                                  }}
                                  className={styles.areaInput}
                                  placeholder={`Nombre del área ${index + 1}`}
                                  disabled={loading}
                                />
                              </div>
                              <span className={styles.subareaCount}>
                                {area.subAreas.length} subárea
                                {area.subAreas.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.removeButton}
                              onClick={() => handleRemoveArea(index)}
                              disabled={loading || disableRemove}
                              title={
                                disableRemove
                                  ? "Debe existir al menos un área principal"
                                  : "Eliminar área"
                              }
                            >
                              ×
                            </button>
                          </div>

                          {area.subAreas.length > 0 && (
                            <div className={styles.subareasList}>
                              {area.subAreas.map((sub, subIndex) => (
                                <div
                                  key={sub.id ?? subIndex}
                                  className={styles.subareaItem}
                                >
                                  <span className={styles.subareaName}>
                                    {sub.nombreSubArea}
                                  </span>
                                  <button
                                    type="button"
                                    className={styles.removeButtonSmall}
                                    onClick={() =>
                                      handleRemoveSubArea(index, subIndex)
                                    }
                                    disabled={loading}
                                    title="Eliminar subárea"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SECCIÓN SUBÁREAS: SOLO SI HAY AL MENOS 1 ÁREA */}
                {formData.areas.length > 0 && (
                  <div className={styles.subareasSection}>
                    <h4 className={styles.subareasTitle}>
                      Agregar subáreas (opcional)
                    </h4>
                    <div className={styles.addSubAreaForm}>
                      <div className={styles.subareaControls}>
                        <select
                          className={styles.areaSelect}
                          value={
                            selectedAreaIndex === ""
                              ? ""
                              : String(selectedAreaIndex)
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedAreaIndex(
                              value === "" ? "" : parseInt(value, 10)
                            );
                          }}
                          disabled={loading}
                        >
                          <option value="">Selecciona un área</option>
                          {formData.areas.map((area, index) => (
                            <option key={area.id ?? index} value={index}>
                              {area.nombreArea || `Área ${index + 1}`}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          className={styles.subareaInput}
                          placeholder="Nombre de la subárea"
                          value={newSubAreaName}
                          onChange={(e) => setNewSubAreaName(e.target.value)}
                          disabled={loading}
                        />

                        <button
                          type="button"
                          className={styles.addSubareaButton}
                          onClick={handleAddSubArea}
                          disabled={
                            loading ||
                            selectedAreaIndex === "" ||
                            !newSubAreaName.trim()
                          }
                        >
                          <span className={styles.plusIcon}>+</span>
                          Añadir subárea
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN DE RESUMEN */}
              <div className={styles.confirmationSection}>
                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>
                    Información del Cliente
                  </h4>
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
                    <div
                      className={`${styles.summaryItem} ${styles.fullWidth}`}
                    >
                      <span className={styles.summaryLabel}>Dirección:</span>
                      <span className={styles.summaryValue}>
                        {formData.direccion}
                      </span>
                    </div>
                    <div
                      className={`${styles.summaryItem} ${styles.fullWidth}`}
                    >
                      <span className={styles.summaryLabel}>
                        Usuario Contacto:
                      </span>
                      <span className={styles.summaryValue}>
                        {userSearch || "No seleccionado"}
                        {formData.idUsuarioContacto && (
                          <span className={styles.userIdNote}>
                            {" "}
                            (ID: {formData.idUsuarioContacto})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {formData.areas.length > 0 && (
                  <div className={styles.summaryCard}>
                    <h4 className={styles.summaryTitle}>
                      Resumen de Áreas y Subáreas
                    </h4>
                    <div className={styles.areasSummary}>
                      {formData.areas.map((area, index) => (
                        <div
                          key={area.id ?? index}
                          className={styles.areaSummaryItem}
                        >
                          <div className={styles.areaSummaryHeader}>
                            <div className={styles.areaSummaryName}>
                              <span className={styles.areaNumber}>
                                Área {index + 1}:
                              </span>
                              <span>{area.nombreArea}</span>
                            </div>
                            <span className={styles.areaSubareaCount}>
                              {area.subAreas.length} subárea
                              {area.subAreas.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {area.subAreas.length > 0 && (
                            <div className={styles.subareasSummary}>
                              {area.subAreas.map((sub, subIndex) => (
                                <div
                                  key={sub.id ?? subIndex}
                                  className={styles.subareaSummaryItem}
                                >
                                  <span className={styles.subareaBullet}>
                                    •
                                  </span>
                                  <span className={styles.subareaName}>
                                    {sub.nombreSubArea}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.noteSection}>
                  <div className={styles.noteIcon}>💡</div>
                  <div className={styles.noteContent}>
                    <p className={styles.noteTitle}>Recuerda</p>
                    <p className={styles.noteText}>
                      El cliente debe tener al menos un área. Puedes añadir o
                      editar áreas y subáreas luego desde la gestión de
                      clientes.
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
                    "Actualizar Cliente"
                  ) : (
                    "Crear Cliente"
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