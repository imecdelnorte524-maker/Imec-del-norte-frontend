// src/pages/ClientsPage.tsx
import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import DashboardLayout from "../components/layout/DashboardLayout";
import { useClients } from "../hooks/useClients";
import ClientModal from '../components/clients/ClientModal';
import type { Client } from '../interfaces/ClientInterfaces';
import styles from '../styles/pages/ClientsPage.module.css';

export default function ClientsPage() {
    const { clients, loading, error, deleteClient, refreshClients } = useClients();
    // const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'withAreas' | 'withoutAreas'>('all');

    // Filtrar clientes
    const filteredClients = clients.filter(client => {
        const matchesSearch = searchTerm === '' ||
            client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.contacto.toLowerCase().includes(searchTerm.toLowerCase());

        const hasAreas = client.areas && client.areas.length > 0;
        const matchesFilter =
            filter === 'all' ||
            (filter === 'withAreas' && hasAreas) ||
            (filter === 'withoutAreas' && !hasAreas);

        return matchesSearch && matchesFilter;
    });

    const handleCreate = () => {
        setEditingClient(null);
        setShowModal(true);
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setShowModal(true);
    };

    const handleDelete = async (client: Client) => {
        if (window.confirm(`¿Estás seguro de eliminar a ${client.nombre}?\nEsta acción no se puede deshacer.`)) {
            try {
                await deleteClient(client.idCliente);
            } catch (err) {
                // Error manejado en el hook
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingClient(null);
    };

    const handleModalSuccess = () => {
        // Refrescar la lista de clientes
        refreshClients();
        handleCloseModal();
    };

    const handleViewAreas = (client: Client) => {
        // Aquí puedes navegar a una página específica o abrir un modal
        const areasCount = client.areas?.length || 0;
        const subareasCount = client.areas?.reduce((total, area) =>
            total + (area.subAreas?.length || 0), 0
        ) || 0;
        
        alert(`Áreas de ${client.nombre}:\n${areasCount} área(s) con ${subareasCount} subárea(s)`);
    };

    if (loading && clients.length === 0) {
        return (
            <DashboardLayout>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando clientes...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className={styles.pageContainer}>
                {/* Header */}
                <header className={styles.pageHeader}>
                    <div className={styles.headerContent}>
                        <div>
                            <h1 className={styles.pageTitle}>Gestión de Clientes</h1>
                            <p className={styles.pageSubtitle}>Administra los clientes, áreas y subáreas del sistema</p>
                        </div>
                        <button
                            className={styles.createButton}
                            onClick={handleCreate}
                        >
                            <span className={styles.plusIcon}>+</span>
                            Nuevo Cliente
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🏢</div>
                        <div className={styles.statContent}>
                            <h3>Total Clientes</h3>
                            <p className={styles.statNumber}>{clients.length}</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📁</div>
                        <div className={styles.statContent}>
                            <h3>Con Áreas</h3>
                            <p className={styles.statNumber}>
                                {clients.filter(c => c.areas && c.areas.length > 0).length}
                            </p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📊</div>
                        <div className={styles.statContent}>
                            <h3>Con Subáreas</h3>
                            <p className={styles.statNumber}>
                                {clients.filter(c =>
                                    c.areas?.some(a => a.subAreas && a.subAreas.length > 0)
                                ).length}
                            </p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>👥</div>
                        <div className={styles.statContent}>
                            <h3>Usuarios Contacto</h3>
                            <p className={styles.statNumber}>
                                {[...new Set(clients.filter(c => c.usuarioContacto).map(c => c.idUsuarioContacto))].length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchWrapper}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, NIT o contacto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                            <span className={styles.searchIcon}>🔍</span>
                        </div>
                    </div>

                    <div className={styles.controlsRight}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos los clientes</option>
                            <option value="withAreas">Con áreas</option>
                            <option value="withoutAreas">Sin áreas</option>
                        </select>

                        {/* <div className={styles.buttonGroup}>
                            <button
                                className={styles.secondaryButton}
                                onClick={() => navigate('/users')}
                            >
                                👥 Gestión de Usuarios
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={styles.errorAlert}>
                        <span className={styles.errorIcon}>⚠️</span>
                        <span className={styles.errorText}>{error}</span>
                        <button
                            className={styles.errorClose}
                            onClick={() => refreshClients()}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Clients List */}
                <div className={styles.content}>
                    {filteredClients.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <h3>
                                {searchTerm 
                                    ? 'No se encontraron resultados' 
                                    : 'No hay clientes registrados'
                                }
                            </h3>
                            <p>
                                {searchTerm
                                    ? 'No se encontraron clientes que coincidan con tu búsqueda.'
                                    : 'Comienza agregando tu primer cliente haciendo clic en "Nuevo Cliente".'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    className={styles.emptyButton}
                                    onClick={handleCreate}
                                >
                                    + Crear Primer Cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className={styles.desktopTable}>
                                <div className={styles.tableContainer}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>NIT</th>
                                                <th>Contacto</th>
                                                <th>Usuario Contacto</th>
                                                <th>Áreas/Subáreas</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredClients.map(client => {
                                                const areasCount = client.areas?.length || 0;
                                                const subareasCount = client.areas?.reduce((total, area) =>
                                                    total + (area.subAreas?.length || 0), 0
                                                ) || 0;

                                                return (
                                                    <tr key={client.idCliente}>
                                                        <td>
                                                            <div className={styles.clientCell}>
                                                                <div className={styles.clientMain}>
                                                                    <strong className={styles.clientName}>{client.nombre}</strong>
                                                                    <div className={styles.clientDetails}>
                                                                        <span className={styles.clientEmail}>{client.email}</span>
                                                                        <span className={styles.clientPhone}>{client.telefono}</span>
                                                                    </div>
                                                                </div>
                                                                <div className={styles.clientLocation}>
                                                                    <small>{client.localizacion}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <code className={styles.nitCode}>{client.nit}</code>
                                                        </td>
                                                        <td>
                                                            <div className={styles.contactCell}>
                                                                <strong>{client.contacto}</strong>
                                                                <small>{client.direccion}</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {client.usuarioContacto ? (
                                                                <div className={styles.userCell}>
                                                                    <div className={styles.userInfo}>
                                                                        <strong>{client.usuarioContacto.nombre} {client.usuarioContacto.apellido || ''}</strong>
                                                                        <small>{client.usuarioContacto.email}</small>
                                                                        {client.usuarioContacto.telefono && (
                                                                            <small>{client.usuarioContacto.telefono}</small>
                                                                        )}
                                                                    </div>
                                                                    {client.usuarioContacto.role && (
                                                                        <span className={`${styles.roleBadge} ${styles[client.usuarioContacto.role.nombreRol.toLowerCase()]}`}>
                                                                            {client.usuarioContacto.role.nombreRol}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className={styles.noUser}>No asignado</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className={styles.areasCell}>
                                                                <div className={styles.areasStats}>
                                                                    <div className={styles.areaStat}>
                                                                        <span className={styles.statIconSmall}>📁</span>
                                                                        <span className={styles.statLabel}>Áreas:</span>
                                                                        <span className={`${styles.statValue} ${areasCount > 0 ? styles.hasData : styles.noData}`}>
                                                                            {areasCount}
                                                                        </span>
                                                                    </div>
                                                                    <div className={styles.areaStat}>
                                                                        <span className={styles.statIconSmall}>📊</span>
                                                                        <span className={styles.statLabel}>Subáreas:</span>
                                                                        <span className={`${styles.statValue} ${subareasCount > 0 ? styles.hasData : styles.noData}`}>
                                                                            {subareasCount}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {areasCount > 0 && (
                                                                    <button
                                                                        className={styles.viewAreasBtn}
                                                                        onClick={() => handleViewAreas(client)}
                                                                        title="Ver detalles de áreas"
                                                                    >
                                                                        Ver áreas
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className={styles.actionsCell}>
                                                                <button
                                                                    onClick={() => handleEdit(client)}
                                                                    className={styles.actionBtn}
                                                                    title="Editar cliente"
                                                                >
                                                                    <span className={styles.actionIcon}>✏️</span>
                                                                    <span className={styles.actionText}>Editar</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(client)}
                                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                                    title="Eliminar cliente"
                                                                >
                                                                    <span className={styles.actionIcon}>🗑️</span>
                                                                    <span className={styles.actionText}>Eliminar</span>
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

                            {/* Mobile Card View */}
                            <div className={styles.mobileCards}>
                                {filteredClients.map(client => {
                                    const areasCount = client.areas?.length || 0;
                                    const subareasCount = client.areas?.reduce((total, area) =>
                                        total + (area.subAreas?.length || 0), 0
                                    ) || 0;

                                    return (
                                        <div key={client.idCliente} className={styles.mobileCard}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardTitle}>
                                                    <h3 className={styles.clientNameMobile}>{client.nombre}</h3>
                                                    <code className={styles.nitCode}>{client.nit}</code>
                                                </div>
                                                <div className={styles.cardActions}>
                                                    <button
                                                        onClick={() => handleEdit(client)}
                                                        className={styles.cardActionBtn}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(client)}
                                                        className={`${styles.cardActionBtn} ${styles.cardDeleteBtn}`}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={styles.cardBody}>
                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Contacto:</span>
                                                    <span className={styles.cardValue}>{client.contacto}</span>
                                                </div>

                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Teléfono:</span>
                                                    <span className={styles.cardValue}>{client.telefono}</span>
                                                </div>

                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Email:</span>
                                                    <span className={styles.cardValue}>{client.email}</span>
                                                </div>

                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Usuario Contacto:</span>
                                                    <span className={styles.cardValue}>
                                                        {client.usuarioContacto
                                                            ? `${client.usuarioContacto.nombre} ${client.usuarioContacto.apellido || ''}`
                                                            : 'No asignado'
                                                        }
                                                    </span>
                                                </div>

                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Dirección:</span>
                                                    <span className={styles.cardValue}>
                                                        {client.direccion.length > 30 
                                                            ? `${client.direccion.substring(0, 30)}...`
                                                            : client.direccion
                                                        }
                                                    </span>
                                                </div>

                                                <div className={styles.cardRow}>
                                                    <span className={styles.cardLabel}>Ubicación:</span>
                                                    <span className={styles.cardValue}>{client.localizacion}</span>
                                                </div>

                                                <div className={styles.cardStats}>
                                                    <div className={styles.cardStat}>
                                                        <span className={styles.statIconCard}>📁</span>
                                                        <div className={styles.statContentCard}>
                                                            <span className={styles.statLabelCard}>Áreas</span>
                                                            <span className={`${styles.statNumberCard} ${areasCount > 0 ? styles.hasData : styles.noData}`}>
                                                                {areasCount}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.cardStat}>
                                                        <span className={styles.statIconCard}>📊</span>
                                                        <div className={styles.statContentCard}>
                                                            <span className={styles.statLabelCard}>Subáreas</span>
                                                            <span className={`${styles.statNumberCard} ${subareasCount > 0 ? styles.hasData : styles.noData}`}>
                                                                {subareasCount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {areasCount > 0 && (
                                                    <button
                                                        className={styles.cardViewAreasBtn}
                                                        onClick={() => handleViewAreas(client)}
                                                        title="Ver detalles de áreas y subáreas"
                                                    >
                                                        Ver áreas y subáreas
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Client Modal */}
            <ClientModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                editingClient={editingClient}
            />
        </DashboardLayout>
    );
}