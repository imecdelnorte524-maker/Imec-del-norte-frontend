import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  type FormEvent,
} from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import { usersApi } from "../api/users";
import styles from "../styles/pages/UserProfilePage.module.css";
import type { UpdateUsuarioDto } from "../interfaces/UserInterfaces";
import { useLocation } from "react-router-dom";

interface UserPhoto {
  id: number;
  url: string;
  createdAt: string;
}

export default function UserProfilePage() {
  const {
    user,
    changePassword,
    loading,
    error: authError,
    refetchUser,
  } = useAuth();
  const location = useLocation();

  const [photo, setPhoto] = useState<UserPhoto | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const passwordRules = {
    length: newPassword.length >= 8,
    lower: /[a-z]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const allPasswordRulesOk = Object.values(passwordRules).every(Boolean);

  // ----- NUEVOS CAMPOS -----
  const [ubicacionResidencia, setUbicacionResidencia] = useState<string>("");
  const [arl, setArl] = useState<string>("");
  const [eps, setEps] = useState<string>("");
  const [afp, setAfp] = useState<string>("");

  const [emergencyName, setEmergencyName] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");
  const [emergencyRelation, setEmergencyRelation] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const additionalInfoRef = useRef<HTMLDivElement | null>(null);

  // ---------- Helpers de sanitización ----------
  const sanitizeText = (s?: string | null): string | null =>
    typeof s === "string" ? s.replace(/\s+/g, " ").trim() || null : s ?? null;

  const sanitizePhone = (s?: string | null): string | null => {
    if (!s) return null;
    const cleaned = s.replace(/[^\d+]/g, "");
    if (!cleaned || cleaned === "+") return null;
    return cleaned;
  };

  const extractServerMessage = (err: any): string => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Error al guardar la información.";
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data?.message && typeof data.message === "object")
      return JSON.stringify(data.message);
    return JSON.stringify(data);
  };

  useEffect(() => {
    const loadPhoto = async () => {
      if (!user) return;
      try {
        setLoadingPhoto(true);
        setPhotoError(null);

        const data = await usersApi.getUserPhoto(user.usuarioId);

        if (data && data.url) {
          setPhoto({
            id: data.id,
            url: data.url,
            createdAt: data.createdAt,
          });
        } else {
          setPhoto(null);
        }
      } catch (err: any) {
        console.error("Error cargando foto de usuario:", err);
        setPhotoError(err.message || "Error al cargar la foto de perfil");
      } finally {
        setLoadingPhoto(false);
      }
    };

    loadPhoto();
  }, [user]);

  // Cargar datos del perfil cuando el usuario cambie
  useEffect(() => {
    if (!user) return;

    setUbicacionResidencia(
      (user as any).ubicacionResidencia ?? (user as any).ubicacion ?? ""
    );
    setArl((user as any).arl ?? "");
    setEps((user as any).eps ?? "");
    setAfp((user as any).afp ?? "");

    setEmergencyName(
      (user as any).contactoEmergenciaNombre ??
        (user as any).contactoEmergencia?.nombre ??
        ""
    );
    setEmergencyPhone(
      (user as any).contactoEmergenciaTelefono ??
        (user as any).contactoEmergencia?.telefono ??
        ""
    );
    setEmergencyRelation(
      (user as any).contactoEmergenciaParentesco ??
        (user as any).contactoEmergencia?.parentesco ??
        ""
    );
  }, [user]);

  const isClient = user?.role?.nombreRol?.toLowerCase() === "cliente";

  const isProfileComplete = useMemo(() => {
    if (!user) return true;
    if (isClient) return true;
    return [
      ubicacionResidencia,
      arl,
      eps,
      afp,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
    ].every((v) => v && v.trim().length > 0);
  }, [
    user,
    isClient,
    ubicacionResidencia,
    arl,
    eps,
    afp,
    emergencyName,
    emergencyPhone,
    emergencyRelation,
  ]);

  useEffect(() => {
    if (location?.state && (location as any).state.focus === "additional") {
      setTimeout(() => {
        additionalInfoRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 250);

      try {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (err) {
        // noop
      }
    }
  }, [location?.state, additionalInfoRef.current]);

  const markProfileCompletedLocal = () => {
    if (!user) return;
    localStorage.setItem(`profileCompleted_${user.usuarioId}`, "true");
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault(); // CRÍTICO: Prevenir recarga
    setProfileError(null);
    setProfileSuccess(null);

    if (!user) return;

    if (!isClient && !isProfileComplete) {
      setProfileError("Por favor completa todos los campos obligatorios.");
      return;
    }

    const payload: UpdateUsuarioDto = {
      ubicacionResidencia: sanitizeText(ubicacionResidencia),
      arl: sanitizeText(arl),
      eps: sanitizeText(eps),
      afp: sanitizeText(afp),
      contactoEmergenciaNombre: sanitizeText(emergencyName),
      contactoEmergenciaTelefono: sanitizePhone(emergencyPhone),
      contactoEmergenciaParentesco: sanitizeText(emergencyRelation),
    };

    try {
      setSavingProfile(true);

      // 1. Actualizar datos del usuario
      await usersApi.updateUser(user.usuarioId, payload);

      // 2. Obtener perfil actualizado inmediatamente
      try {
        await refetchUser();
      } catch (refreshErr) {
        console.warn("No se pudo refrescar el user en contexto:", refreshErr);
      }

      // 3. Recargar foto por si hubo cambios
      try {
        const data = await usersApi.getUserPhoto(user.usuarioId);
        if (data && data.url) {
          setPhoto({
            id: data.id,
            url: data.url,
            createdAt: data.createdAt,
          });
        } else {
          setPhoto(null);
        }
      } catch (photoErr) {
        console.warn("No se pudo recargar la foto:", photoErr);
      }

      setProfileSuccess("Información actualizada correctamente.");

      if (isProfileComplete) {
        markProfileCompletedLocal();
      }
    } catch (err: any) {
      console.error("Error guardando perfil:", err);
      setProfileError(extractServerMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // File handling (foto) - CORREGIDO
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); // Prevenir cualquier comportamiento por defecto
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La imagen no debe superar los 5MB");
      return;
    }

    try {
      setLoadingPhoto(true);
      setPhotoError(null);

      const uploaded = await usersApi.uploadUserPhoto(user.usuarioId, file);
      const data = uploaded.data ?? uploaded;

      setPhoto({
        id: data.id,
        url: data.url,
        createdAt: data.createdAt,
      });

      // Actualizar el contexto del usuario
      try {
        await refetchUser();
      } catch {
        // noop
      }
    } catch (err: any) {
      console.error("Error al subir foto de usuario:", err);
      setPhotoError(err.message || "Error al subir la foto de perfil");
    } finally {
      setLoadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePhoto = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir cualquier comportamiento por defecto
    if (!user || !photo) return;

    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar tu foto de perfil?"
    );
    if (!confirmDelete) return;

    try {
      setLoadingPhoto(true);
      setPhotoError(null);

      await usersApi.deleteUserPhoto(user.usuarioId);
      setPhoto(null);
      setShowPhotoModal(false);

      // Actualizar el contexto del usuario
      try {
        await refetchUser();
      } catch {
        // noop
      }
    } catch (err: any) {
      console.error("Error eliminando foto de usuario:", err);
      setPhotoError(err.message || "Error al eliminar la foto de perfil");
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault(); // CRÍTICO: Prevenir recarga
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Todos los campos son obligatorios.");
      return;
    }

    if (!allPasswordRulesOk) {
      setPasswordError(
        "La nueva contraseña no cumple con los requisitos de seguridad."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    try {
      const msg = await changePassword(currentPassword, newPassword);
      setPasswordSuccess(msg || "Contraseña actualizada exitosamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Actualizar el contexto del usuario después de cambiar contraseña
      try {
        await refetchUser();
      } catch {
        // noop
      }
    } catch {
      if (authError) {
        setPasswordError(authError);
      } else {
        setPasswordError("Error al cambiar la contraseña.");
      }
    }
  };

  // Función para manejar click en botones de foto
  const handlePhotoButtonClick = (action: 'upload' | 'delete') => (e: React.MouseEvent) => {
    e.preventDefault();
    if (action === 'upload') {
      fileInputRef.current?.click();
    } else if (action === 'delete') {
      handleDeletePhoto(e);
    }
  };

  // Función para cerrar modal de foto
  const handleCloseModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPhotoModal(false);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className={styles.page}>
          <div className={styles.centerMessage}>
            No hay usuario autenticado.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${user.nombre} ${user.apellido}`.trim();
  const createdAt = new Date(user.fechaCreacion).toLocaleString();
  const initials =
    `${user.nombre?.[0] ?? ""}${user.apellido?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <DashboardLayout>
      <div className={styles.page}>
        {/* AVISO cuando el usuario debe cambiar la contraseña */}
        {user.mustChangePassword && (
          <div className={styles.passwordAlert}>
            <p className={styles.passwordAlertTitle}>
              Es necesario que cambies tu contraseña.
            </p>
            <p className={styles.passwordAlertText}>
              Por seguridad, antes de acceder a todas las secciones del sistema
              debes actualizar tu contraseña en el formulario de abajo.
            </p>
          </div>
        )}

        <header className={styles.header}>
          <h1>Mi Perfil</h1>
          <p>
            Consulta tu información, actualiza tu foto de perfil y cambia tu
            contraseña.
          </p>
        </header>

        <div className={styles.layout}>
          {/* Columna izquierda: foto + info básica */}
          <section className={styles.leftColumn}>
            <div className={styles.profileCard}>
              <div className={styles.photoSection}>
                {photo ? (
                  <img
                    src={photo.url}
                    alt="Foto de perfil"
                    className={styles.profilePhoto}
                    onClick={() => setShowPhotoModal(true)}
                  />
                ) : (
                  <div className={styles.avatarFallback}>{initials}</div>
                )}

                {loadingPhoto && (
                  <span className={styles.photoStatus}>
                    Procesando imagen...
                  </span>
                )}

                {photoError && <div className={styles.error}>{photoError}</div>}

                <div className={styles.photoActions}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    id="fileInput"
                  />
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handlePhotoButtonClick('upload')}
                    disabled={loadingPhoto}
                  >
                    {photo ? "Cambiar foto" : "Subir foto"}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handlePhotoButtonClick('delete')}
                      disabled={loadingPhoto}
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.basicInfo}>
                <h2>{fullName || user.username}</h2>
                <p className={styles.role}>
                  {user.role?.nombreRol || "Usuario"}
                </p>
                <p className={styles.email}>{user.email}</p>
              </div>
            </div>

            <div className={styles.metaCard}>
              <h3>Información de cuenta</h3>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Usuario:</span>
                <span className={styles.metaValue}>{user.username}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Estado:</span>
                <span className={styles.metaValue}>
                  {user.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Registrado en:</span>
                <span className={styles.metaValue}>{createdAt}</span>
              </div>
            </div>
          </section>

          {/* Columna derecha: detalles + cambio de contraseña + info adicional */}
          <section className={styles.rightColumn}>
            <div className={styles.detailCard}>
              <h3>Datos personales</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nombre</span>
                  <span className={styles.detailValue}>{fullName || "—"}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tipo de documento</span>
                  <span className={styles.detailValue}>
                    {user.tipoCedula || "—"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Documento</span>
                  <span className={styles.detailValue}>
                    {user.cedula || "—"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Teléfono</span>
                  <span className={styles.detailValue}>
                    {user.telefono || "—"}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Correo electrónico</span>
                  <span className={styles.detailValue}>{user.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Rol</span>
                  <span className={styles.detailValue}>
                    {user.role?.nombreRol || "Usuario"}
                  </span>
                </div>
              </div>
            </div>

            {!isClient && (
              <div className={styles.detailCard} ref={additionalInfoRef}>
                <h3>Información adicional</h3>

                <form
                  onSubmit={handleSaveProfile}
                  className={styles.profileForm}
                >
                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>
                      Ubicación de residencia
                    </label>
                    <input
                      className={styles.textInput}
                      value={ubicacionResidencia}
                      onChange={(e) => setUbicacionResidencia(e.target.value)}
                      placeholder="Ciudad, dirección, barrio..."
                      type="text"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>ARL</label>
                    <input
                      className={styles.textInput}
                      value={arl}
                      onChange={(e) => setArl(e.target.value)}
                      type="text"
                      placeholder="ARL"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>EPS</label>
                    <input
                      className={styles.textInput}
                      value={eps}
                      onChange={(e) => setEps(e.target.value)}
                      type="text"
                      placeholder="EPS"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>AFP</label>
                    <input
                      className={styles.textInput}
                      value={afp}
                      onChange={(e) => setAfp(e.target.value)}
                      type="text"
                      placeholder="AFP"
                    />
                  </div>

                  <hr />

                  <h4>Contacto de emergencia</h4>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>
                      Nombre completo
                    </label>
                    <input
                      className={styles.textInput}
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      type="text"
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>
                      Número de teléfono
                    </label>
                    <input
                      className={styles.textInput}
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      type="text"
                      placeholder="+57 300 000 0000"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.detailLabel}>Parentesco</label>
                    <input
                      className={styles.textInput}
                      value={emergencyRelation}
                      onChange={(e) => setEmergencyRelation(e.target.value)}
                      type="text"
                      placeholder="Ej: Madre, Padre, Cónyuge..."
                    />
                  </div>

                  {profileError && (
                    <div className={styles.error}>{profileError}</div>
                  )}
                  {profileSuccess && (
                    <div className={styles.success}>{profileSuccess}</div>
                  )}

                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Guardando..." : "Guardar información"}
                  </button>
                </form>
              </div>
            )}

            <div className={styles.detailCard}>
              <h3>Cambiar contraseña</h3>
              <form
                onSubmit={handlePasswordSubmit}
                className={styles.passwordForm}
              >
                <div className={styles.passwordField}>
                  <label
                    htmlFor="currentPassword"
                    className={styles.passwordLabel}
                  >
                    Contraseña actual
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    className={styles.passwordInput}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className={styles.passwordField}>
                  <label htmlFor="newPassword" className={styles.passwordLabel}>
                    Nueva contraseña
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className={styles.passwordInput}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                  <div className={styles.passwordRules}>
                    <p className={styles.passwordRulesTitle}>
                      La nueva contraseña debe tener:
                    </p>
                    <ul className={styles.rulesList}>
                      <li
                        className={
                          passwordRules.length ? styles.ruleOk : styles.rule
                        }
                      >
                        Al menos 8 caracteres
                      </li>
                      <li
                        className={
                          passwordRules.upper ? styles.ruleOk : styles.rule
                        }
                      >
                        Al menos 1 letra mayúscula
                      </li>
                      <li
                        className={
                          passwordRules.lower ? styles.ruleOk : styles.rule
                        }
                      >
                        Al menos 1 letra minúscula
                      </li>
                      <li
                        className={
                          passwordRules.number ? styles.ruleOk : styles.rule
                        }
                      >
                        Al menos 1 número
                      </li>
                      <li
                        className={
                          passwordRules.special ? styles.ruleOk : styles.rule
                        }
                      >
                        Al menos 1 carácter especial
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.passwordField}>
                  <label
                    htmlFor="confirmNewPassword"
                    className={styles.passwordLabel}
                  >
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    className={styles.passwordInput}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={loading}
                  />
                </div>

                {passwordError && (
                  <div className={styles.error}>{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className={styles.success}>{passwordSuccess}</div>
                )}

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>

      {photo && showPhotoModal && (
        <div
          className={styles.photoModalOverlay}
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className={styles.photoModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.photoModalClose}
              onClick={handleCloseModal}
            >
              ×
            </button>
            <img
              src={photo.url}
              alt="Foto de perfil ampliada"
              className={styles.photoModalImage}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}