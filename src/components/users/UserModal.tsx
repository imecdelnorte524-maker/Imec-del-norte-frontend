import { useState, useEffect } from "react";
import type {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from "../../interfaces/UserInterfaces";
import styles from "../../styles/components/users/UserModal.module.css";

// Objeto para los tipos de cédula
const TIPOS_CEDULA = {
  CC: "CC",
  PPT: "PPT",
} as const;

// Géneros compatibles con el backend
const GENEROS = {
  MASCULINO: "MASCULINO",
  FEMENINO: "FEMENINO",
  NO_BINARIO: "NO_BINARIO",
} as const;

// Meses en español
const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

// Días del mes (1-31)
const DIAS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

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
  roles,
}: UserModalProps) {
  const [formData, setFormData] = useState<CreateUsuarioDto>({
    username: "",
    email: "",
    fechaNacimiento: "",
    genero: "",
    password: "",
    nombre: "",
    apellido: "",
    telefono: "",
    tipoCedula: TIPOS_CEDULA.CC,
    cedula: "",
    rolId: 0,
    position: "",
  });

  // Estado separado para día y mes
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Rol actualmente seleccionado (según rolId)
  const selectedRole = roles.find((rol) => rol.rolId === formData.rolId);
  const isClienteRole = selectedRole?.nombreRol === "Cliente";

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      setLoading(false);

      if (editingUser) {
        // Extraer día y mes de fechaNacimiento existente
        let day = "";
        let month = "";
        if (editingUser.fechaNacimiento) {
          try {
            const dateString = editingUser.fechaNacimiento;

            if (dateString.includes("T")) {
              const date = new Date(dateString);
              day = date.getUTCDate().toString();
              month = (date.getUTCMonth() + 1).toString();
            } else {
              const parts = dateString.split("-");
              if (parts.length === 3) {
                day = parseInt(parts[2], 10).toString();
                month = parseInt(parts[1], 10).toString();
              } else {
                const date = new Date(dateString + "T12:00:00");
                day = date.getDate().toString();
                month = (date.getMonth() + 1).toString();
              }
            }
          } catch (error) {
            console.error("Error al parsear fecha:", error);
          }
        }

        setBirthDay(day);
        setBirthMonth(month);

        setFormData({
          username: editingUser.username,
          email: editingUser.email,
          genero: editingUser.genero || "",
          fechaNacimiento: editingUser.fechaNacimiento || "",
          password: "",
          nombre: editingUser.nombre,
          apellido: editingUser.apellido,
          telefono: editingUser.telefono || "",
          tipoCedula: editingUser.tipoCedula,
          cedula: editingUser.cedula,
          rolId: editingUser.role.rolId,
          activo: editingUser.activo,
          position: (editingUser as any).position || "",
        });
      } else {
        const defaultRolId = roles.length > 0 ? roles[0].rolId : 0;

        setBirthDay("");
        setBirthMonth("");

        setFormData({
          username: "",
          email: "",
          genero: "",
          fechaNacimiento: "",
          password: "",
          nombre: "",
          apellido: "",
          telefono: "",
          tipoCedula: TIPOS_CEDULA.CC,
          cedula: "",
          rolId: defaultRolId,
          activo: true,
          position: "",
        });
      }
    }
  }, [isOpen, editingUser, roles]);

  // Actualizar fechaNacimiento cuando cambia día o mes
  useEffect(() => {
    if (birthDay && birthMonth) {
      const year = 2000;
      const formattedMonth = birthMonth.padStart(2, "0");
      const formattedDay = birthDay.padStart(2, "0");
      const fechaNacimiento = `${year}-${formattedMonth}-${formattedDay}T00:00:00.000Z`;

      setFormData((prev) => ({
        ...prev,
        fechaNacimiento,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fechaNacimiento: "",
      }));
    }
  }, [birthDay, birthMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    // Validaciones básicas (sin cédula aquí)
    if (
      !formData.username ||
      !formData.email ||
      !formData.nombre ||
      !formData.apellido ||
      !formData.rolId
    ) {
      setLocalError("Por favor complete todos los campos obligatorios (*)");
      setLoading(false);
      return;
    }

    // Cédula obligatoria solo si el rol NO es Cliente
    if (!isClienteRole && !formData.cedula) {
      setLocalError("La cédula es obligatoria para este tipo de usuario");
      setLoading(false);
      return;
    }

    // Validar fecha de nacimiento
    if (formData.fechaNacimiento && (!birthDay || !birthMonth)) {
      setLocalError(
        "Por favor complete el día y mes de nacimiento si desea agregarlo",
      );
      setLoading(false);
      return;
    }

    if (birthDay && birthMonth && !validateDayMonth(birthDay, birthMonth)) {
      setLocalError("Por favor ingrese una fecha válida");
      setLoading(false);
      return;
    }

    if (!editingUser && !formData.password) {
      setLocalError("La contraseña es obligatoria para nuevos usuarios");
      setLoading(false);
      return;
    }

    if (editingUser && formData.password && formData.password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    // Validar tipoCedula solo si NO es Cliente
    if (
      !isClienteRole &&
      !Object.values(TIPOS_CEDULA).includes(formData.tipoCedula as any)
    ) {
      setLocalError("El tipo de cédula debe ser CC o PPT");
      setLoading(false);
      return;
    }

    // Validar género si se proporciona
    if (
      formData.genero &&
      !Object.values(GENEROS).includes(formData.genero as any)
    ) {
      setLocalError("El género debe ser MASCULINO, FEMENINO o NO_BINARIO");
      setLoading(false);
      return;
    }

    // Validar rol válido
    if (!roles.find((rol) => rol.rolId === formData.rolId)) {
      setLocalError("Por favor seleccione un rol válido");
      setLoading(false);
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUsuarioDto = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          tipoCedula: formData.tipoCedula,
          cedula: formData.cedula,
          email: formData.email,
          username: formData.username,
          telefono: formData.telefono,
          rolId: formData.rolId,
          activo: formData.activo,
          genero: formData.genero || undefined,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          position: isClienteRole ? formData.position || undefined : undefined,
        };

        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password;
        }

        await onUpdateUser(editingUser.usuarioId, updateData);
      } else {
        const createData: CreateUsuarioDto = {
          ...formData,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          genero: formData.genero || undefined,
          position: isClienteRole ? formData.position : "",
        };

        await onCreateUser(createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error en handleSubmit:", err);
      setLocalError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "rolId") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else if (name === "activo") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "true",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setBirthDay(value);

    if (birthMonth && value) {
      validateDayMonth(value, birthMonth);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setBirthMonth(value);

    if (birthDay && value) {
      validateDayMonth(birthDay, value);
    }
  };

  const validateDayMonth = (day: string, month: string): boolean => {
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);

    const daysInMonth: { [key: number]: number } = {
      1: 31,
      2: 29,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31,
    };

    return dayNum <= (daysInMonth[monthNum] || 31);
  };

  const handleClose = () => {
    const defaultRolId = roles.length > 0 ? roles[0].rolId : 0;

    setFormData({
      username: "",
      email: "",
      fechaNacimiento: "",
      genero: "",
      password: "",
      nombre: "",
      apellido: "",
      telefono: "",
      tipoCedula: TIPOS_CEDULA.CC,
      cedula: "",
      rolId: defaultRolId,
      activo: true,
      position: "",
    });

    setBirthDay("");
    setBirthMonth("");
    setLocalError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {localError && (
          <div className={styles.errorMessage} role="alert">
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
                <>
                  <option value="">Seleccione un rol</option>
                  {roles.map((rol) => (
                    <option key={rol.rolId} value={rol.rolId}>
                      {rol.nombreRol}
                    </option>
                  ))}
                </>
              )}
            </select>
            {roles.length === 0 && (
              <small className={styles.helpText}>
                No se pudieron cargar los roles
              </small>
            )}
          </div>

          {/* Tipo y número de cédula solo si NO es rol Cliente */}
          {!isClienteRole && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="tipoCedula">Tipo Cédula *</label>
                <select
                  id="tipoCedula"
                  name="tipoCedula"
                  value={formData.tipoCedula}
                  onChange={handleChange}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value={TIPOS_CEDULA.CC}>Cédula de Ciudadanía</option>
                  <option value={TIPOS_CEDULA.PPT}>
                    Permiso por Protección Temporal
                  </option>
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
                  minLength={8}
                  maxLength={10}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
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
              <label htmlFor="username">Usuario *</label>
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
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="genero">Género</label>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className={styles.select}
                disabled={loading}
              >
                <option value="">Seleccione un género</option>
                <option value={GENEROS.MASCULINO}>Masculino</option>
                <option value={GENEROS.FEMENINO}>Femenino</option>
                <option value={GENEROS.NO_BINARIO}>No Binario</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Fecha de Nacimiento</label>
              <div className={styles.dateInputs}>
                <select
                  id="birthDay"
                  name="birthDay"
                  value={birthDay}
                  onChange={handleDayChange}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="">Día</option>
                  {DIAS.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
                <select
                  id="birthMonth"
                  name="birthMonth"
                  value={birthMonth}
                  onChange={handleMonthChange}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="">Mes</option>
                  {MESES.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
              </div>
              <small className={styles.helpText}>Día y mes (opcional)</small>
            </div>
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

            {/* position solo si el rol es Cliente */}
            {isClienteRole && (
              <div className={styles.formGroup}>
                <label htmlFor="position">Cargo</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  placeholder="Ej: Supervisor de Planta"
                  value={formData.position || ""}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña {!editingUser && "*"}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={
                editingUser
                  ? "Dejar vacío para no cambiar"
                  : "Ingrese contraseña"
              }
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

          {editingUser && (
            <div className={styles.formGroup}>
              <label htmlFor="activo">Estado</label>
              <select
                id="activo"
                name="activo"
                value={formData.activo?.toString()}
                onChange={handleChange}
                className={styles.select}
                disabled={loading}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          )}

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
              disabled={loading || (roles.length === 0 && !editingUser)}
            >
              {loading
                ? "Procesando..."
                : editingUser
                  ? "Actualizar Usuario"
                  : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}