import { useEffect, useState, useMemo } from "react";
import styles from "../../styles/components/orders/OrderEditModal.module.css";
import type { Order } from "../../interfaces/OrderInterfaces";
import type { Equipment } from "../../interfaces/EquipmentInterfaces";

interface Props {
  order: Order;
  equipments: Equipment[]; // Equipos disponibles del cliente
  isOpen: boolean;
  onClose: () => void;
  onSave: (changes: {
    comentarios?: string;
    equipmentIds: number[];
  }) => Promise<void> | void;
  loading?: boolean;
}

// Función para normalizar texto (quitar tildes y caracteres especiales)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^\w\s]/g, ""); // Quita caracteres especiales
};

// Función mejorada de búsqueda flexible
const matchesSearch = (text: string, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(searchTerm);

  // División del término de búsqueda en palabras
  const searchWords = normalizedSearch
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Si el término de búsqueda tiene múltiples palabras, verificar que todas coincidan
  if (searchWords.length > 1) {
    return searchWords.every((word) => normalizedText.includes(word));
  }

  // Búsqueda simple
  return normalizedText.includes(normalizedSearch);
};

export default function OrderEditModal({
  order,
  equipments,
  isOpen,
  onClose,
  onSave,
  loading,
}: Props) {
  const [comentarios, setComentarios] = useState(order.comentarios || "");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<number[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Inicializar estados cuando se abre el modal o cambia la orden
  useEffect(() => {
    if (!isOpen) return;

    setComentarios(order.comentarios || "");
    setSearchTerm(""); // Resetear búsqueda al abrir

    const currentEquipmentIds =
      order.equipos?.map((eq) => eq.equipmentId) ?? [];
    setSelectedEquipmentIds(currentEquipmentIds);
  }, [isOpen, order]);

  // Filtrar equipos basado en el término de búsqueda
  const filteredEquipments = useMemo(() => {
    if (!searchTerm.trim()) return equipments;

    return equipments.filter((eq) => {
      // Crear un texto combinado con toda la información relevante del equipo
      const searchableText = [
        eq.code || `#${eq.equipmentId}`,
        eq.category,
        eq.area?.nombreArea,
        eq.subArea?.nombreSubArea,
      ]
        .filter(Boolean)
        .join(" ");

      return matchesSearch(searchableText, searchTerm);
    });
  }, [equipments, searchTerm]);

  if (!isOpen) return null;

  const toggleEquipment = (equipmentId: number) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      comentarios,
      equipmentIds: selectedEquipmentIds,
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredEquipments.map((eq) => eq.equipmentId);
    setSelectedEquipmentIds((prev) => {
      // Crear un Set con los IDs seleccionados actualmente + los del filtro
      const newSelection = new Set([...prev, ...allIds]);
      return Array.from(newSelection);
    });
  };

  const handleDeselectAll = () => {
    const filteredIds = filteredEquipments.map((eq) => eq.equipmentId);
    setSelectedEquipmentIds((prev) =>
      prev.filter((id) => !filteredIds.includes(id)),
    );
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderRow}>
          <h3>Editar Orden de Servicio #{order.orden_id}</h3>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Info solo lectura */}
          <div className={styles.formRow}>
            <label>Servicio</label>
            <div>{order.servicio.nombre_servicio}</div>
          </div>

          <div className={styles.formRow}>
            <label>Estado actual</label>
            <div>{order.estado}</div>
          </div>

          {order.cliente_empresa && (
            <div className={styles.formRow}>
              <label>Empresa</label>
              <div>{order.cliente_empresa.nombre}</div>
            </div>
          )}

          <div className={styles.formRow}>
            <label>Contacto</label>
            <div>
              {order.cliente?.nombre} {order.cliente?.apellido}
            </div>
          </div>

          <div className={styles.formRow}>
            <label>Fecha solicitud</label>
            <div>
              {order.fecha_solicitud
                ? new Date(order.fecha_solicitud).toLocaleString()
                : "N/A"}
            </div>
          </div>

          {/* Comentarios editables */}
          <div className={styles.formRow}>
            <label>Comentarios</label>
            <textarea
              className={styles.rejectTextarea}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Ingrese comentarios adicionales sobre la orden..."
            />
          </div>

          {/* Equipos asignados */}
          <div className={styles.formRow}>
            <label>Equipos asignados a la orden</label>

            {equipments.length === 0 ? (
              <div className={styles.warning}>
                El cliente no tiene equipos registrados.
              </div>
            ) : (
              <>
                {/* Barra de búsqueda */}
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Buscar equipos por código, categoría, área, subárea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Acciones rápidas */}
                {filteredEquipments.length > 0 && (
                  <div className={styles.bulkActions}>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={styles.bulkActionButton}
                    >
                      Seleccionar todos los mostrados
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className={styles.bulkActionButton}
                    >
                      Deseleccionar todos los mostrados
                    </button>
                  </div>
                )}

                {/* Contador de resultados */}
                {searchTerm && (
                  <div className={styles.searchResultsCount}>
                    {filteredEquipments.length} equipos encontrados
                    {filteredEquipments.length !== equipments.length &&
                      ` (de ${equipments.length} totales)`}
                  </div>
                )}

                {/* Lista de equipos */}
                <div className={styles.scrollBoxLarge}>
                  {filteredEquipments.length === 0 ? (
                    <div className={styles.noResults}>
                      No se encontraron equipos que coincidan con "{searchTerm}"
                    </div>
                  ) : (
                    filteredEquipments.map((eq) => {
                      const isSelected = selectedEquipmentIds.includes(
                        eq.equipmentId,
                      );
                      return (
                        <div
                          key={eq.equipmentId}
                          className={`${styles.selectableRow} ${
                            isSelected ? styles.selectableRowSelected : ""
                          }`}
                          onClick={() => toggleEquipment(eq.equipmentId)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEquipment(eq.equipmentId)}
                            className={styles.checkboxInline}
                          />
                          <div>
                            <strong>
                              {eq.code || `#${eq.equipmentId}`} - {eq.category}
                            </strong>
                            <div className={styles.rowMeta}>
                              {eq.subArea?.nombreSubArea ||
                                eq.area?.nombreArea ||
                                "Sin ubicación"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <small className={styles.helperText}>
                  Marque los equipos que deben quedar asociados a esta orden.
                  {selectedEquipmentIds.length > 0 && (
                    <span> ({selectedEquipmentIds.length} seleccionados)</span>
                  )}
                </small>
              </>
            )}
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={!!loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
