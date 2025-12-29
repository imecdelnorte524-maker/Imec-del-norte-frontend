import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "../components/layout/DashboardLayout";
import { useUsers } from "../hooks/useUsers";
import UserModal from '../components/users/UserModal';
import type { Usuario } from '../interfaces/UserInterfaces';
import styles from '../styles/pages/UsersPage.module.css';
import Pagination from '../components/Pagination';

export default function Users() {
  const { usuarios, loading, error, toggleUserStatus, createUser, updateUser, roles } = useUsers();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'Activo' | 'Inactivo'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10; // Cambia este valor según cuántos usuarios quieras por página

  // Filtrar usuarios según estado y búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    const coincideEstado = filtroEstado === 'todos' ||
      (filtroEstado === 'Activo' && usuario.activo) ||
      (filtroEstado === 'Inactivo' && !usuario.activo);

    const coincideBusqueda =
      busqueda === '' ||
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.cedula.toLowerCase().includes(busqueda.toLowerCase());

    return coincideEstado && coincideBusqueda;
  });

  // Calcular índices de paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  
  // Obtener usuarios para la página actual
  const currentUsers = usuariosFiltrados.slice(indexOfFirstUser, indexOfLastUser);
  
  const totalPages = Math.ceil(usuariosFiltrados.length / usersPerPage);

  // Resetear a página 1 cuando cambie el filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado, busqueda]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Hacer scroll al inicio cuando cambia de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    // Por ejemplo, mostrar un mensaje de éxito
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres ${usuario.activo ? 'desactivar' : 'activar'} a ${usuario.nombre} ${usuario.apellido}?`
    );

    if (confirmacion) {
      try {
        await toggleUserStatus(usuario.usuarioId, usuario.activo);
      } catch (err) {
        // El error ya se maneja en el hook
      }
    }
  };

  // Mostrar contadores de usuarios filtrados
  const usuariosActivosFiltrados = usuariosFiltrados.filter(u => u.activo === true).length;
  const usuariosInactivosFiltrados = usuariosFiltrados.filter(u => u.activo === false).length;

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

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Usuarios</h3>
            <span className={styles.statNumber}>{usuariosFiltrados.length}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Activos</h3>
            <span className={styles.statNumber}>
              {usuariosActivosFiltrados}
            </span>
          </div>
          <div className={styles.statCard}>
            <h3>Inactivos</h3>
            <span className={styles.statNumber}>
              {usuariosInactivosFiltrados}
            </span>
          </div>
        </div>

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
              onClick={() => navigate('/roles')}
            >
              📋 Gestión de Roles
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleCreate}
            >
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Mostrar información de paginación */}
        <div className={styles.paginationInfo}>
          <span>
            Mostrando {Math.min(usersPerPage, currentUsers.length)} de {usuariosFiltrados.length} usuarios
            {busqueda && ` para "${busqueda}"`}
            {filtroEstado !== 'todos' && ` (${filtroEstado})`}
          </span>
          <span>
            Página {currentPage} de {totalPages || 1}
          </span>
        </div>

        {error ? (
          <div className={styles.errorMessage}>
            {error}
          </div>
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
                      <th>Cédula</th>
                      <th>Rol</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(usuario => (
                      <tr key={usuario.usuarioId}>
                        <td>
                          <div className={styles.userInfo}>
                            <strong>{usuario.nombre} {usuario.apellido}</strong>
                          </div>
                        </td>
                        <td>{usuario.email}</td>
                        <td>{usuario.tipoCedula} {usuario.cedula}</td>
                        <td>
                          <span className={`${styles.role} ${styles[usuario.role.nombreRol.toLowerCase()]}`}>
                            {usuario.role.nombreRol}
                          </span>
                        </td>
                        <td>{usuario.telefono || 'No especificado'}</td>
                        <td>
                          <span className={`${styles.status} ${usuario.activo ? styles.activo : styles.inactivo}`}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
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
                              title={usuario.activo ? 'Desactivar' : 'Activar'}
                            >
                              {usuario.activo ? '⏸️' : '▶️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className={styles.mobileView}>
              {currentUsers.map(usuario => (
                <div key={usuario.usuarioId} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.userMainInfo}>
                      <h3 className={styles.userName}>{usuario.nombre} {usuario.apellido}</h3>
                      <p className={styles.userEmail}>{usuario.email}</p>
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
                        title={usuario.activo ? 'Desactivar' : 'Activar'}
                      >
                        {usuario.activo ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.cardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Usuario:</span>
                        <span className={styles.detailValue}>{usuario.username}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Cédula:</span>
                        <span className={styles.detailValue}>{usuario.tipoCedula} {usuario.cedula}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Rol:</span>
                        <span className={`${styles.role} ${styles[usuario.role.nombreRol.toLowerCase()]}`}>
                          {usuario.role.nombreRol}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Teléfono:</span>
                        <span className={styles.detailValue}>{usuario.telefono || 'No especificado'}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Estado:</span>
                        <span className={`${styles.status} ${usuario.activo ? styles.activo : styles.inactivo}`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Registro:</span>
                        <span className={styles.detailValue}>
                          {new Date(usuario.fechaCreacion).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {usuariosFiltrados.length === 0 && (
              <div className={styles.emptyState}>
                {busqueda ? 'No se encontraron usuarios con esa búsqueda' : 'No hay usuarios registrados'}
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