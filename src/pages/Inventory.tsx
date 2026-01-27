// src/pages/Inventory.tsx (VERSIÓN MEJORADA)
import { useState, useEffect } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { inventory } from "../api/inventory";
import type { Inventory, TipoFiltro } from "../interfaces/InventoryInterfaces";
import AddInventoryModal from "../components/inventory/AddInventoyModal";
import EditInventoryModal from "../components/inventory/EditInventoryModal";
import DeleteConfirmationModal from "../components/inventory/DeleteInventoryModal";
import ToolSoftDeleteModal from "../components/tools/ToolSoftDeleteModal";
import ViewInventoryModal from "../components/inventory/ViewInventoryModal";

import styles from "../styles/pages/InventoryPage.module.css";
import { playErrorSound } from "../utils/sounds";

export default function Inventory() {
  const [inventario, setInventario] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [showDeleted] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoftDeleteModal, setShowSoftDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);

  useEffect(() => {
    cargarInventario();
  }, [showDeleted]);

  const handleView = (item: Inventory) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const data = await inventory.getAllInventory();
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

  const handleSoftDelete = (item: Inventory) => {
    if (item.tipo === "herramienta") {
      setSelectedItem(item);
      setShowSoftDeleteModal(true);
    } else {
      handleDelete(item);
    }
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
    setShowSoftDeleteModal(false);
    setSelectedItem(null);
  };

  const itemsFiltrados = inventario.filter((item) => {
    // Filtrar por tipo
    const coincideTipo =
      filtro === "todos" ||
      (filtro === "herramientas" && item.tipo === "herramienta") ||
      (filtro === "insumos" && item.tipo === "insumo");

    // Filtrar por búsqueda
    const coincideBusqueda =
      busqueda === "" ||
      item.nombreItem.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (item.tool?.marca?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      (item.tool?.serial?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
      (item.supply?.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);

    // Filtrar por estado eliminado
    const coincideEstado = showDeleted ? true : !item.fechaEliminacion;

    return coincideTipo && coincideBusqueda && coincideEstado;
  });

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
              placeholder="Buscar por nombre, ubicación, marca, serial..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />

            {/* <label className={styles.showDeletedCheckbox}>
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
              <span>Mostrar eliminados</span>
            </label> */}
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
                      <th>Cantidad / Stock Min</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((item) => (
                      <tr 
                        key={item.inventarioId}
                        className={item.fechaEliminacion ? styles.deletedRow : ''}
                      >
                        <td>
                          <span
                            className={`${styles.itemType} ${
                              item.tipo === "herramienta"
                                ? styles.herramienta
                                : styles.insumo
                            }`}
                          >
                            {item.tipo === "herramienta"
                              ? "🛠️ Herramienta"
                              : "📦 Insumo"}
                            {item.fechaEliminacion && " (Eliminado)"}
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
                          <span className={`${styles.status} ${
                            item.fechaEliminacion ? styles.deleted : 
                            item.tool?.estado === "Disponible" || item.supply?.estado === "Disponible" 
                              ? styles.active : 
                              item.tool?.estado === "En Uso" || item.supply?.estado === "Stock Bajo" 
                                ? styles.warning : 
                                styles.inactive
                          }`}>
                            {item.tool?.estado ||
                              item.supply?.estado ||
                              "Activo"}
                            {item.fechaEliminacion && " (Retirado)"}
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
                            {!item.fechaEliminacion && (
                              <>
                                <button
                                  className={styles.btnAction}
                                  onClick={() => handleEdit(item)}
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                {item.tipo === "herramienta" ? (
                                  <button
                                    className={`${styles.btnAction} ${styles.softDelete}`}
                                    onClick={() => handleSoftDelete(item)}
                                    title="Retirar con motivo"
                                  >
                                    📤
                                  </button>
                                ) : (
                                  <button
                                    className={`${styles.btnAction} ${styles.delete}`}
                                    onClick={() => handleDelete(item)}
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista móvil - mantiene la misma estructura pero agregamos el filtro de eliminados */}
            <div className={styles.mobileView}>
              {itemsFiltrados.map((item) => (
                <div 
                  key={item.inventarioId} 
                  className={`${styles.mobileCard} ${item.fechaEliminacion ? styles.deletedCard : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <span
                      className={`${styles.itemType} ${
                        item.tipo === "herramienta" ? styles.herramienta : styles.insumo
                      }`}
                    >
                      {item.tipo === "herramienta" ? "🛠️ Equipo" : "📦 Insumo"}
                      {item.fechaEliminacion && " (Eliminado)"}
                    </span>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.btnAction}
                        onClick={() => handleView(item)}
                        title="Ver"
                      >
                        👁️
                      </button>
                      {!item.fechaEliminacion && (
                        <>
                          <button
                            className={styles.btnAction}
                            onClick={() => handleEdit(item)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          {item.tipo === "herramienta" ? (
                            <button
                              className={`${styles.btnAction} ${styles.softDelete}`}
                              onClick={() => handleSoftDelete(item)}
                              title="Retirar con motivo"
                            >
                              📤
                            </button>
                          ) : (
                            <button
                              className={`${styles.btnAction} ${styles.delete}`}
                              onClick={() => handleDelete(item)}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      )}
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
                        <span className={`${styles.status} ${
                          item.fechaEliminacion ? styles.deleted : 
                          item.tool?.estado === "Disponible" || item.supply?.estado === "Disponible" 
                            ? styles.active : 
                            item.tool?.estado === "En Uso" || item.supply?.estado === "Stock Bajo" 
                              ? styles.warning : 
                              styles.inactive
                        }`}>
                          {item.tool?.estado || item.supply?.estado || "Activo"}
                          {item.fechaEliminacion && " (Retirado)"}
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
                  : showDeleted
                  ? "No hay items eliminados"
                  : "No hay items en el inventario"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
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

      <ToolSoftDeleteModal
        isOpen={showSoftDeleteModal}
        onClose={() => {
          setShowSoftDeleteModal(false);
          setSelectedItem(null);
        }}
        onSuccess={handleSuccess}
       tool={selectedItem?.tipo === "herramienta" ? (selectedItem as unknown as any) : null}
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