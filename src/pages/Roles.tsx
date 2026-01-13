// src/pages/Roles.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "../components/layout/DashboardLayout";
import { useRoles } from "../hooks/useRoles";
import RoleModal from '../components/roles/RoleModal';
import ModulesPermission from '../components/roles/ModulesPermission';
import type { Rol } from '../interfaces/RolesInterfaces';
import styles from '../styles/pages/RolesPage.module.css';

export default function Roles() {
    const { roles, loading, error, deleteRole, createRole, updateRole } = useRoles();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Rol | null>(null);
    const [busqueda, setBusqueda] = useState('');

    // Estado para modal de permisos (módulos)
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [selectedRoleForModules, setSelectedRoleForModules] = useState<Rol | null>(null);

    const rolesFiltrados = roles.filter(rol =>
        busqueda === '' ||
        rol.nombreRol.toLowerCase().includes(busqueda.toLowerCase()) ||
        (rol.descripcion && rol.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const handleEdit = (rol: Rol) => {
        setEditingRole(rol);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRole(null);
    };

    const handleModalSuccess = () => {
        // Ahora esto funcionará porque createRole y updateRole ya incluyen la recarga
    };

    const handleDelete = async (rol: Rol) => {
        const confirmacion = window.confirm(
            `¿Estás seguro de que quieres eliminar el rol "${rol.nombreRol}"?\n\nEsta acción no se puede deshacer.`
        );

        if (confirmacion) {
            try {
                await deleteRole(rol.rolId);
            } catch (err) {
                // El error ya se maneja en el hook
            }
        }
    };

    // Abrir modal de módulos para un rol
    const handleOpenModules = (rol: Rol) => {
        setSelectedRoleForModules(rol);
        setShowModulesModal(true);
    };

    const handleCloseModules = () => {
        setShowModulesModal(false);
        setSelectedRoleForModules(null);
    };

    // Callback cuando se guarden permisos en el modal.
    // Aquí intento recargar la página (simplificación) para que el listado se actualice
    // Si prefieres, puedes reemplazar con una llamada al hook para refrescar sin reload.
    const handleModulesSaved = () => {
        // Si useRoles tiene una función de refrescar, cámbialo por esa función.
        // Por simplicidad y compatibilidad segura, recargo la página.
        window.location.reload();
    };

    if (loading && roles.length === 0) {
        return (
            <DashboardLayout>
                <div className={styles.loading}>Cargando roles...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.page}>
                <header className={styles.header}>
                    <h1>Gestión de Roles</h1>
                    <p>Administra los roles y permisos del sistema</p>
                </header>

                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <h3>Total Roles</h3>
                        <span className={styles.statNumber}>{roles.length}</span>
                    </div>
                </div>

                <div className={styles.controls}>
                    <div className={styles.filters}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.buttonsGroup}>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => navigate('/users')}
                        >
                            👥 Gestión de Usuarios
                        </button>
                        <button
                            className={styles.btnPrimary}
                            onClick={handleCreate}
                        >
                            + Nuevo Rol
                        </button>
                    </div>
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                <div className={styles.rolesContainer}>
                    {/* Vista de tabla para desktop */}
                    <div className={styles.desktopView}>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre del Rol</th>
                                        <th>Descripción</th>
                                        <th>Fecha de Creación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolesFiltrados.map(rol => (
                                        <tr key={rol.rolId}>
                                            <td>{rol.rolId}</td>
                                            <td>
                                                <strong>{rol.nombreRol}</strong>
                                            </td>
                                            <td>
                                                {rol.descripcion || (
                                                    <span className={styles.noDescription}>Sin descripción</span>
                                                )}
                                            </td>
                                            <td>
                                                {rol.fechaCreacion
                                                    ? new Date(rol.fechaCreacion).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.btnAction}
                                                        onClick={() => handleEdit(rol)}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>

                                                    {/* BOTÓN DE PERMISOS / MÓDULOS */}
                                                    <button
                                                        className={styles.btnAction}
                                                        onClick={() => handleOpenModules(rol)}
                                                        title="⚙️ Permisos"
                                                        aria-label={`Permisos ${rol.nombreRol}`}
                                                    >
                                                        ⚙️
                                                    </button>

                                                    <button
                                                        className={`${styles.btnAction} ${styles.delete}`}
                                                        onClick={() => handleDelete(rol)}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
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
                        {rolesFiltrados.map(rol => (
                            <div key={rol.rolId} className={styles.mobileCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.roleMainInfo}>
                                        <h3 className={styles.roleName}>{rol.nombreRol}</h3>
                                        <p className={styles.roleId}>ID: {rol.rolId}</p>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.btnAction}
                                            onClick={() => handleEdit(rol)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>

                                        {/* BOTÓN DE PERMISOS (móvil) */}
                                        <button
                                            className={styles.btnAction}
                                            onClick={() => handleOpenModules(rol)}
                                            title="⚙️ Permisos"
                                            aria-label={`Permisos ${rol.nombreRol}`}
                                        >
                                            ⚙️
                                        </button>

                                        <button
                                            className={`${styles.btnAction} ${styles.delete}`}
                                            onClick={() => handleDelete(rol)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.cardDetails}>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Descripción:</span>
                                            <div className={styles.detailValue}>
                                                {rol.descripcion ? (
                                                    <div className={styles.descriptionText}>
                                                        {rol.descripcion}
                                                    </div>
                                                ) : (
                                                    <span className={styles.noDescription}>Sin descripción</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Fecha Creación:</span>
                                            <span className={styles.detailValue}>
                                                {rol.fechaCreacion
                                                    ? new Date(rol.fechaCreacion).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {rolesFiltrados.length === 0 && (
                        <div className={styles.emptyState}>
                            {busqueda ? 'No se encontraron roles con esa búsqueda' : 'No hay roles registrados'}
                        </div>
                    )}
                </div>

                <RoleModal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    onSuccess={handleModalSuccess}
                    editingRole={editingRole}
                    onCreateRole={createRole} // 🔥 Pasar la función que incluye recarga
                    onUpdateRole={updateRole} // 🔥 Pasar la función que incluye recarga
                />

                <ModulesPermission
                  isOpen={showModulesModal}
                  role={selectedRoleForModules}
                  onClose={handleCloseModules}
                  onSaved={handleModulesSaved}
                />
            </div>
        </DashboardLayout>
    );
}