import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useUsers } from "../hooks/useUsers";
import UserModal from "../components/users/UserModal";
import type { Usuario } from "../interfaces/UserInterfaces";
import styles from "../styles/pages/UsersPage.module.css";
import Pagination from "../components/Pagination";

export default function Users() {
  const {
    usuarios,
    loading,
    error,
    toggleUserStatus,
    createUser,
    updateUser,
    roles,
  } = useUsers();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "Activo" | "Inactivo"
  >("todos");
  const [busqueda, setBusqueda] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Función segura para obtener el nombre del rol
  const getSafeRoleName = (usuario: Usuario): string => {
    if (!usuario.role) {
      return "Sin rol";
    }
    return usuario.role.nombreRol || usuario.role.nombreRol || "Sin nombre";
  };

  // Función segura para obtener la clase CSS del rol
  const getSafeRoleClass = (usuario: Usuario): string => {
    const roleName = getSafeRoleName(usuario).toLowerCase();
    // Validar que la clase CSS exista
    const validRoles = [
      "admin",
      "técnico",
      "cliente",
      "secretaria",
      "supervisor",
    ];
    return validRoles.includes(roleName) ? roleName : "default";
  };

  // Filtrar usuarios según estado y búsqueda (con manejo seguro)
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "Activo" && usuario.activo) ||
      (filtroEstado === "Inactivo" && !usuario.activo);

    const coincideBusqueda =
      busqueda === "" ||
      (usuario.nombre &&
        usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.apellido &&
        usuario.apellido.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.email &&
        usuario.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.username &&
        usuario.username.toLowerCase().includes(busqueda.toLowerCase())) ||
      (usuario.cedula &&
        usuario.cedula.toLowerCase().includes(busqueda.toLowerCase()));

    return coincideEstado && coincideBusqueda;
  });

  // Calcular índices de paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;

  // Obtener usuarios para la página actual (con verificación)
  const currentUsers = usuariosFiltrados.slice(
    indexOfFirstUser,
    indexOfLastUser,
  );

  const totalPages = Math.ceil(usuariosFiltrados.length / usersPerPage);

  // Resetear a página 1 cuando cambie el filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado, busqueda]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleModalSuccess = () => {
    // Puedes añadir lógica adicional después de crear/actualizar un usuario
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres ${usuario.activo ? "desactivar" : "activar"} a ${usuario.nombre || "este usuario"}?`,
    );

    if (confirmacion) {
      try {
        await toggleUserStatus(usuario.usuarioId, usuario.activo);
      } catch (err) {
        // El error ya se maneja en el hook
      }
    }
  };

  if (loading && usuarios.length === 0) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Cargando usuarios...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios del sistema</p>
        </header>

        <div className={styles.controls}>
          <div className={styles.filters}>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los estados</option>
              <option value="Activo">Solo Activos</option>
              <option value="Inactivo">Solo Inactivos</option>
            </select>

            <input
              type="text"
              placeholder="Buscar por nombre, apellido, email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.buttonsGroup}>
            <button
              className={styles.btnSecondary}
              onClick={() => navigate("/roles")}
            >
              📋 Gestión de Roles
            </button>
            <button className={styles.btnPrimary} onClick={handleCreate}>
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Mostrar información de paginación */}
        <div className={styles.paginationInfo}>
          <span>
            Mostrando {Math.min(usersPerPage, currentUsers.length)} de{" "}
            {usuariosFiltrados.length} usuarios
            {busqueda && ` para "${busqueda}"`}
            {filtroEstado !== "todos" && ` (${filtroEstado})`}
          </span>
          <span>
            Página {currentPage} de {totalPages || 1}
          </span>
        </div>

        {error ? (
          <div className={styles.errorMessage}>{error}</div>
        ) : (
          <div className={styles.usersContainer}>
            {/* Vista de tabla para desktop */}
            <div className={styles.desktopView}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((usuario) => {
                      const roleName = getSafeRoleName(usuario);
                      const roleClass = getSafeRoleClass(usuario);

                      return (
                        <tr key={usuario.usuarioId}>
                          <td>
                            <div className={styles.userInfo}>
                              <strong
                                className={styles.userNameDesktop}
                                data-fullname={`${usuario.nombre || ""} ${usuario.apellido || ""}`}
                                title={`${usuario.nombre || ""} ${usuario.apellido || ""}`}
                              >
                                {usuario.nombre || "Sin nombre"}{" "}
                                {usuario.apellido || ""}
                              </strong>
                            </div>
                          </td>
                          <td
                            className={styles.emailCell}
                            data-fulltext={usuario.email || "Sin email"}
                            title={usuario.email || "Sin email"}
                          >
                            {usuario.email || "Sin email"}
                          </td>
                          <td>
                            <span
                              className={`${styles.role} ${styles[roleClass]}`}
                              data-fullrole={roleName}
                              title={roleName}
                            >
                              {roleName}
                            </span>
                          </td>
                          <td
                            className={styles.phoneCell}
                            data-fulltext={
                              usuario.telefono || "No especificado"
                            }
                            title={usuario.telefono || "No especificado"}
                          >
                            {usuario.telefono || "No especificado"}
                          </td>
                          <td>
                            <span
                              className={`${styles.status} ${usuario.activo ? styles.activo : styles.inactivo}`}
                            >
                              {usuario.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={styles.btnAction}
                                onClick={() => handleEdit(usuario)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                className={`${styles.btnAction} ${usuario.activo ? styles.deactivate : styles.activate}`}
                                onClick={() => handleToggleStatus(usuario)}
                                title={
                                  usuario.activo ? "Desactivar" : "Activar"
                                }
                              >
                                {usuario.activo ? "⏸️" : "▶️"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className={styles.mobileView}>
              {currentUsers.map((usuario) => {
                const roleName = getSafeRoleName(usuario);
                const roleClass = getSafeRoleClass(usuario);

                return (
                  <div key={usuario.usuarioId} className={styles.mobileCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.userMainInfo}>
                        <h3
                          className={styles.userNameMobile}
                          data-fullname={`${usuario.nombre || ""} ${usuario.apellido || ""}`}
                          tabIndex={0}
                        >
                          {usuario.nombre || "Sin nombre"}{" "}
                          {usuario.apellido || ""}
                        </h3>
                        <p
                          className={styles.userEmail}
                          data-fulltext={usuario.email || "Sin email"}
                          tabIndex={0}
                        >
                          {usuario.email || "Sin email"}
                        </p>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={styles.btnAction}
                          onClick={() => handleEdit(usuario)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className={`${styles.btnAction} ${usuario.activo ? styles.deactivate : styles.activate}`}
                          onClick={() => handleToggleStatus(usuario)}
                          title={usuario.activo ? "Desactivar" : "Activar"}
                        >
                          {usuario.activo ? "⏸️" : "▶️"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.cardDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Usuario:</span>
                          <span className={styles.detailValue}>
                            <span
                              className={styles.truncatedText}
                              data-fulltext={usuario.username || "Sin usuario"}
                              tabIndex={0}
                            >
                              {usuario.username || "Sin usuario"}
                            </span>
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Cédula:</span>
                          <span className={styles.detailValue}>
                            <span
                              className={styles.truncatedText}
                              data-fulltext={`${usuario.tipoCedula || ""} ${usuario.cedula || ""}`}
                              tabIndex={0}
                            >
                              {usuario.tipoCedula || ""}{" "}
                              {usuario.cedula || "Sin cédula"}
                            </span>
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Rol:</span>
                          <span
                            className={`${styles.role} ${styles[roleClass]}`}
                            data-fullrole={roleName}
                            tabIndex={0}
                          >
                            {roleName}
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Teléfono:</span>
                          <span className={styles.detailValue}>
                            <span
                              className={styles.truncatedText}
                              data-fulltext={
                                usuario.telefono || "No especificado"
                              }
                              tabIndex={0}
                            >
                              {usuario.telefono || "No especificado"}
                            </span>
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Estado:</span>
                          <span
                            className={`${styles.status} ${usuario.activo ? styles.activo : styles.inactivo}`}
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Registro:</span>
                          <span className={styles.detailValue}>
                            {usuario.fechaCreacion
                              ? new Date(
                                  usuario.fechaCreacion,
                                ).toLocaleDateString()
                              : "No disponible"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {usuariosFiltrados.length === 0 && (
              <div className={styles.emptyState}>
                {busqueda
                  ? "No se encontraron usuarios con esa búsqueda"
                  : "No hay usuarios registrados"}
              </div>
            )}

            {/* Mostrar paginación si hay más de una página */}
            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}

        <UserModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          editingUser={editingUser}
          onCreateUser={createUser}
          onUpdateUser={updateUser}
          roles={roles}
        />
      </div>
    </DashboardLayout>
  );
}
