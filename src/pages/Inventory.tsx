import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { inventory } from "../api/inventory";
import type { Inventory, TipoFiltro } from "../interfaces/InventoryInterfaces";
import AddInventoryModal from "../components/inventory/AddInventoyModal";
import EditInventoryModal from "../components/inventory/EditInventoryModal";
import DeleteConfirmationModal from "../components/inventory/DeleteInventoryModal";
import ViewInventoryModal from "../components/inventory/ViewInventoryModal";

import styles from "../styles/pages/InventoryPage.module.css";
import { playErrorSound } from "../utils/sounds";

export default function Inventory() {
  const [inventario, setInventario] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    cargarInventario();
  }, []);

  const handleView = (item: Inventory) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const data = await inventory.getAllInventory();

      data.forEach((item: { tipo: any }, i: number) => {
        if (!item.tipo) {
          console.warn(`⚠️ Item ${i} sin tipo:`, item);
        }
      });

      setInventario(data);
      setError(null);
    } catch (err: any) {
      console.error("❌ Error en cargarInventario:", err);
      setError("Error al cargar el inventario: " + err.message);
      playErrorSound();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Inventory) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: Inventory) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSuccess = () => {
    cargarInventario();
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
  };

  const itemsFiltrados = inventario.filter((item) => {
    const coincideTipo =
      filtro === "todos" ||
      (filtro === "herramientas" && item.herramientaId) ||
      (filtro === "insumos" && item.insumoId);

    const coincideBusqueda =
      busqueda === "" ||
      item.supply?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.tool?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.nombreItem.toLowerCase().includes(busqueda.toLowerCase());

    return coincideTipo && coincideBusqueda;
  });

  const totalItems = inventario.length;
  const totalHerramientas = inventario.filter(
    (item) => item.tool?.herramientaId
  ).length;
  const totalInsumos = inventario.filter(
    (item) => item.supply?.insumoId
  ).length;
  const stockBajo = inventario.filter(
    (item) => item.supply && item.cantidadActual <= (item.supply.stockMin || 0)
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className={styles.loading}>Cargando inventario...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Gestión de Inventario</h1>
          <p>Administra herramientas e insumos del taller</p>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>Total Items</h3>
            <span className={styles.statNumber}>{totalItems}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Herramientas</h3>
            <span className={styles.statNumber}>{totalHerramientas}</span>
          </div>
          <div className={styles.statCard}>
            <h3>Insumos</h3>
            <span className={styles.statNumber}>{totalInsumos}</span>
          </div>
          <div className={`${styles.statCard} ${styles.warning}`}>
            <h3>Stock Bajo</h3>
            <span className={styles.statNumber}>{stockBajo}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.filters}>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as TipoFiltro)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los items</option>
              <option value="herramientas">Solo Herramientas</option>
              <option value="insumos">Solo Insumos</option>
            </select>

            <input
              type="text"
              placeholder="Buscar por nombre o ubicación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            className={styles.btnPrimary}
            onClick={() => setShowAddModal(true)}
          >
            + Agregar Item
          </button>
        </div>

        {error ? (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={cargarInventario} className={styles.btnRetry}>
              Reintentar
            </button>
          </div>
        ) : (
          <div className={styles.inventoryContainer}>
            <div className={styles.desktopView}>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Cantidad</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((item) => (
                      <tr key={item.inventarioId}>
                        <td>
                          <span
                            className={`${styles.itemType} ${
                              item.herramientaId
                                ? styles.herramienta
                                : styles.insumo
                            }`}
                          >
                            {item.tipo === "herramienta"
                              ? "🛠️ Herramienta"
                              : "📦 Insumo"}
                          </span>
                        </td>
                        <td>
                          {item.nombreItem}
                          {item.supply && (
                            <small className={styles.unit}>
                              {" "}
                              ({item.supply.unidadMedida})
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className={`${styles.quantity} ${
                              item.supply &&
                              item.cantidadActual <= (item.supply.stockMin || 0)
                                ? styles.lowStock
                                : ""
                            }`}
                          >
                            {item.cantidadActual}
                            {item.supply && ` / ${item.supply.stockMin}`}
                          </span>
                        </td>
                        <td>{item.ubicacion || "Sin ubicación"}</td>
                        <td>
                          <span className={`${styles.status} ${styles.active}`}>
                            {item.tool?.estado ||
                              item.supply?.estado ||
                              "Activo"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.btnAction}
                              onClick={() => handleView(item)}
                              title="Ver"
                            >
                              👁️
                            </button>
                            <button
                              className={styles.btnAction}
                              onClick={() => handleEdit(item)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className={`${styles.btnAction} ${styles.delete}`}
                              onClick={() => handleDelete(item)}
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

            <div className={styles.mobileView}>
              {itemsFiltrados.map((item) => (
                <div key={item.inventarioId} className={styles.mobileCard}>
                  <div className={styles.cardHeader}>
                    <span
                      className={`${styles.itemType} ${
                        item.herramientaId ? styles.herramienta : styles.insumo
                      }`}
                    >
                      {item.tipo === "herramienta" ? "🛠️ Equipo" : "📦 Insumo"}
                    </span>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.btnAction}
                        onClick={() => handleView(item)}
                        title="Ver"
                      >
                        👁️
                      </button>
                      <button
                        className={styles.btnAction}
                        onClick={() => handleEdit(item)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.btnAction} ${styles.delete}`}
                        onClick={() => handleDelete(item)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <h3 className={styles.itemName}>
                      {item.nombreItem}
                      {item.supply && (
                        <small className={styles.unit}>
                          {" "}
                          ({item.supply.unidadMedida})
                        </small>
                      )}
                    </h3>

                    <div className={styles.cardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Cantidad:</span>
                        <span
                          className={`${styles.quantity} ${
                            item.supply &&
                            item.cantidadActual <= (item.supply.stockMin || 0)
                              ? styles.lowStock
                              : ""
                          }`}
                        >
                          {item.cantidadActual}
                          {item.supply && ` / ${item.supply.stockMin}`}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Ubicación:</span>
                        <span className={styles.detailValue}>
                          {item.ubicacion || "Sin ubicación"}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Estado:</span>
                        <span className={`${styles.status} ${styles.active}`}>
                          {item.tool?.estado || item.supply?.estado || "Activo"}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Actualizado:</span>
                        <span className={styles.detailValue}>
                          {new Date(
                            item.fechaUltimaActualizacion
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {itemsFiltrados.length === 0 && (
              <div className={styles.emptyState}>
                {busqueda
                  ? "No se encontraron items con esa búsqueda"
                  : "No hay items en el inventario"}
              </div>
            )}
          </div>
        )}
      </div>

      <AddInventoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />

      <EditInventoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
        item={selectedItem}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
        item={selectedItem}
      />

      <ViewInventoryModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
    </DashboardLayout>
  );
}
