import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useClients } from "../hooks/useClients";
import ClientModal from "../components/clients/ClientModal";
import type { Client } from "../interfaces/ClientInterfaces";
import styles from "../styles/pages/ClientsPage.module.css";

export default function ClientsPage() {
  const { 
    clients = [], 
    isLoading: loading, 
    error, 
    deleteClient, 
    refreshClients 
  } = useClients();
  
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter] = useState<"all" | "withAreas" | "withoutAreas">(
    "all"
  );

  // Filtrar clientes
  const filteredClients: Client[] = clients.filter((client: Client): boolean => {
    const matchesSearch: boolean =
      searchTerm === "" ||
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contacto.toLowerCase().includes(searchTerm.toLowerCase());

    const hasAreas: boolean = !!(client.areas && client.areas.length > 0);
    const matchesFilter: boolean =
      filter === "all" ||
      (filter === "withAreas" && hasAreas) ||
      (filter === "withoutAreas" && !hasAreas);

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
    if (
      window.confirm(
        `¿Estás seguro de eliminar a ${client.nombre}?\nEsta acción no se puede deshacer.`
      )
    ) {
      try {
        await deleteClient(client.idCliente);
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        // El error ya se maneja en el hook/mutation
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleModalSuccess = () => {
    refreshClients();
    handleCloseModal();
  };

  // Ir a la página de detalles
  const handleViewDetails = (client: Client) => {
    navigate(`/clients/${client.idCliente}`);
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
              <p className={styles.pageSubtitle}>
                Administra los clientes, áreas y subáreas del sistema
              </p>
            </div>
            <button className={styles.createButton} onClick={handleCreate}>
              <span className={styles.plusIcon}>+</span>
              Nuevo Cliente
            </button>
          </div>
        </header>

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

          {/* <div className={styles.controlsRight}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">Todos los clientes</option>
              <option value="withAreas">Con áreas</option>
              <option value="withoutAreas">Sin áreas</option>
            </select>
          </div> */}
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>
              {error instanceof Error ? error.message : "Error al cargar clientes"}
            </span>
            <button
              className={styles.errorClose}
              onClick={() => refreshClients()}
            >
              ×
            </button>
          </div>
        )}

        {/* Listado */}
        <div className={styles.content}>
          {filteredClients.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>
                {searchTerm || filter !== "all"
                  ? "No se encontraron resultados"
                  : "No hay clientes registrados"}
              </h3>
              <p>
                {searchTerm || filter !== "all"
                  ? "No se encontraron clientes que coincidan con tu búsqueda."
                  : 'Comienza agregando tu primer cliente haciendo clic en "Nuevo Cliente".'}
              </p>
              {!searchTerm && filter === "all" && (
                <button className={styles.emptyButton} onClick={handleCreate}>
                  + Crear Primer Cliente
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className={styles.desktopTable}>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>NIT</th>
                        <th>Usuario Contacto</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => {
                        const clientLogo = client.images?.find(
                          (img) => img.isLogo
                        );

                        return (
                          <tr
                            key={client.idCliente}
                            className={styles.clickableRow}
                            onClick={() => handleViewDetails(client)}
                          >
                            <td>
                              <div className={styles.clientCell}>
                                <div className={styles.clientHeader}>
                                  {clientLogo ? (
                                    <img
                                      src={clientLogo.url}
                                      alt={`Logo de ${client.nombre}`}
                                      className={styles.clientTableLogo}
                                    />
                                  ) : (
                                    <div
                                      className={
                                        styles.clientTableLogoPlaceholder
                                      }
                                    >
                                      {client.nombre.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h2>
                                      <strong className={styles.clientName}>
                                        {client.nombre}
                                      </strong>
                                    </h2>
                                    <div className={styles.clientDetails}>
                                      <small>{client.telefono}</small>
                                      <small>{client.email}</small>
                                      <small>
                                        {client.direccionCompleta || "Dirección no disponible"}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <code className={styles.nitCode}>
                                {client.nit}
                              </code>
                            </td>
                            <td>
                              {client.usuarioContacto ? (
                                <div className={styles.userCell}>
                                  <div className={styles.userInfo}>
                                    <strong>
                                      {client.usuarioContacto.nombre}{" "}
                                      {client.usuarioContacto.apellido || ""}
                                    </strong>
                                    <small>
                                      {client.usuarioContacto.email}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <span className={styles.noUser}>
                                  No asignado
                                </span>
                              )}
                            </td>
                            <td>
                              <div
                                className={styles.actionsCell}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleEdit(client)}
                                  className={styles.actionBtn}
                                  title="Editar cliente"
                                >
                                  <span className={styles.actionIcon}>✏️</span>
                                  <span className={styles.actionText}>
                                    Editar
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDelete(client)}
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  title="Eliminar cliente"
                                >
                                  <span className={styles.actionIcon}>🗑️</span>
                                  <span className={styles.actionText}>
                                    Eliminar
                                  </span>
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

              {/* Mobile */}
              <div className={styles.mobileCards}>
                {filteredClients.map((client) => {
                  const areasCount = client.areas?.length || 0;
                  const clientLogo = client.images?.find((img) => img.isLogo);

                  return (
                    <div
                      key={client.idCliente}
                      className={styles.mobileCard}
                      onClick={() => handleViewDetails(client)}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.clientInfoMobile}>
                          {clientLogo ? (
                            <img
                              src={clientLogo.url}
                              alt={`Logo de ${client.nombre}`}
                              className={styles.clientLogoMobile}
                            />
                          ) : (
                            <div className={styles.clientLogoPlaceholderMobile}>
                              {client.nombre.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={styles.cardTitle}>
                            <h3 className={styles.clientNameMobile}>
                              {client.nombre}
                            </h3>
                            <code className={styles.nitCode}>{client.nit}</code>
                          </div>
                        </div>
                        <div
                          className={styles.cardActions}
                          onClick={(e) => e.stopPropagation()}
                        >
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
                          <span className={styles.cardValue}>
                            {client.contacto}
                          </span>
                        </div>

                        <div className={styles.cardRow}>
                          <span className={styles.cardLabel}>Teléfono:</span>
                          <span className={styles.cardValue}>
                            {client.telefono}
                          </span>
                        </div>

                        <div className={styles.cardRow}>
                          <span className={styles.cardLabel}>Áreas:</span>
                          <span className={styles.cardValue}>
                            {areasCount} área
                            {areasCount !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className={styles.viewDetailsHint}>
                          Toca para ver detalles →
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de creación/edición */}
      <ClientModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingClient={editingClient}
      />
    </DashboardLayout>
  );
}