import { useEffect, useMemo, useState } from "react";
import styles from "../../../styles/components/equipment/equipment-list/HierarchicalAreaSelector.module.css";
import areaStyles from "../../../styles/components/clients/ClientModal.module.css";

import { areas as areasAPI } from "../../../api/areas";
import { subAreas as subAreasAPI } from "../../../api/subAreas";

import type { AreaFormData } from "../../../interfaces/AreaInterfaces";
import type { SubAreaFormData } from "../../../interfaces/SubAreaInterfaces";

interface HierarchicalAreaSelectorProps {
  // Array con { idArea, nombreArea, subAreas: [...] } o con treeData/children
  areas: any[];
  selectedAreaId: number | string | null;
  selectedSubAreaId: number | string | null;
  disabled?: boolean;
  error?: string | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Cliente al que pertenecen las áreas (para crear/eliminar)
  clientId?: number | null;
}

export default function HierarchicalAreaSelector({
  areas,
  selectedAreaId,
  selectedSubAreaId,
  disabled,
  error,
  onAreaChange,
  onSubAreaChange,
  clientId,
}: HierarchicalAreaSelectorProps) {
  const isDisabled = Boolean(disabled);

  // ======== ESTADO SOLO PARA LA MODAL DE GESTIÓN =========
  const [manageAreas, setManageAreas] = useState<AreaFormData[]>([]);

  // ======== ESTADO PARA EL SELECTOR (ÁREA / SUBÁREA) =====
  const [selectorAreas, setSelectorAreas] = useState<any[]>([]);

  const [manageOpen, setManageOpen] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);

  const [newAreaName, setNewAreaName] = useState("");
  const [selectedAreaForSubarea, setSelectedAreaForSubarea] = useState<
    number | null
  >(null);
  const [selectedParentSubarea, setSelectedParentSubarea] = useState<
    number | null
  >(null);
  const [newSubareaName, setNewSubareaName] = useState("");
  const [isSubareaModalOpen, setIsSubareaModalOpen] = useState(false);

  // Helper: aplanar un árbol de subáreas (formato {id, nombre, children})
  const flattenTreeToFlatSubs = (
    nodes: any[],
    areaId: number,
    parentId: number | null = null,
  ): SubAreaFormData[] => {
    const result: SubAreaFormData[] = [];
    for (const node of nodes) {
      const id = node.idSubArea ?? node.id;
      const nombre = node.nombreSubArea ?? node.nombre;
      if (id == null || !nombre) continue;

      const current: SubAreaFormData = {
        id,
        nombreSubArea: nombre,
        areaId,
        parentSubAreaId: parentId === null ? undefined : parentId,
      };
      result.push(current);

      if (node.children && node.children.length > 0) {
        result.push(...flattenTreeToFlatSubs(node.children, areaId, id));
      }
    }
    return result;
  };

  // ========= 1) INICIALIZAR manageAreas DESDE props.areas =========
  useEffect(() => {
    const mapped: AreaFormData[] = (areas || []).map((a: any) => {
      const areaId = a.idArea ?? a.id;
      const nombreArea = a.nombreArea ?? a.nombre ?? "";

      let subAreas: SubAreaFormData[] = [];

      // Caso 1: tiene subAreas planas (como en /clients o /areas)
      if (Array.isArray(a.subAreas) && a.subAreas.length > 0) {
        subAreas = a.subAreas.map((s: any) => ({
          id: s.idSubArea ?? s.id,
          nombreSubArea: s.nombreSubArea ?? s.nombre,
          areaId: s.areaId ?? areaId,
          parentSubAreaId: s.parentSubAreaId ?? undefined,
        }));
      }
      // Caso 2: tiene treeData.subAreas con {id, nombre, children}
      else if (a.treeData?.subAreas && Array.isArray(a.treeData.subAreas)) {
        subAreas = flattenTreeToFlatSubs(a.treeData.subAreas, areaId, null);
      }
      // Caso 3: tiene children a nivel de área (raro, pero contemplado)
      else if (Array.isArray(a.children) && a.children.length > 0) {
        subAreas = flattenTreeToFlatSubs(a.children, areaId, null);
      }

      return {
        id: areaId,
        nombreArea,
        subAreas,
      };
    });

    setManageAreas(mapped);
  }, [areas]);

  // ========= 2) CADA VEZ QUE manageAreas CAMBIE, ACTUALIZAR selectorAreas ====
  useEffect(() => {
    const selector = manageAreas.map((a) => ({
      idArea: a.id,
      nombreArea: a.nombreArea,
      subAreas: a.subAreas.map((s) => ({
        idSubArea: s.id,
        nombreSubArea: s.nombreSubArea,
        areaId: s.areaId,
        parentSubAreaId:
          s.parentSubAreaId === undefined ? null : s.parentSubAreaId,
      })),
    }));

    setSelectorAreas(selector);
  }, [manageAreas]);

  // ====== SELECCIÓN (ÁREA / SUBÁREA) USANDO selectorAreas ======

  const selectedArea = useMemo(() => {
    if (selectedAreaId == null || selectedAreaId === "") return undefined;
    return selectorAreas.find(
      (a) => String(a.idArea ?? a.id) === String(selectedAreaId),
    );
  }, [selectorAreas, selectedAreaId]);

  // Aplanar subáreas jerárquicamente para el SELECT de subáreas
  const flatSubAreas = useMemo(() => {
    if (!selectedArea) return [];

    let rawSubs: any[] = [];

    if (selectedArea.treeData?.subAreas) {
      rawSubs = selectedArea.treeData.subAreas;
    } else if (selectedArea.subAreas) {
      rawSubs = selectedArea.subAreas;
    } else if (selectedArea.children) {
      rawSubs = selectedArea.children;
    }

    if (!rawSubs || rawSubs.length === 0) return [];

    // Caso A: ya vienen en árbol { id, nombre, children: [...] }
    if (rawSubs[0]?.children) {
      const flattenTree = (
        nodes: any[],
        depth = 0,
      ): { id: number; label: string; depth: number }[] => {
        const result: { id: number; label: string; depth: number }[] = [];
        for (const node of nodes) {
          const id = node.id ?? node.idSubArea;
          const name = node.nombre ?? node.nombreSubArea;
          if (id == null || !name) continue;

          const prefix = depth > 0 ? "↳ " : "";
          const label = `${"  ".repeat(depth)}${prefix}${name}`;
          result.push({ id, label, depth });

          if (node.children && node.children.length > 0) {
            result.push(...flattenTree(node.children, depth + 1));
          }
        }
        return result;
      };

      return flattenTree(rawSubs, 0);
    }

    // Caso B: planas con parentSubAreaId (como en /clients o /areas)
    type RawSub = {
      idSubArea?: number;
      id?: number;
      nombreSubArea?: string;
      nombre?: string;
      parentSubAreaId?: number | null;
    };

    const rawFlat = rawSubs as RawSub[];
    const byParent = new Map<number | null, RawSub[]>();

    for (const s of rawFlat) {
      const parentKey =
        s.parentSubAreaId === null || s.parentSubAreaId === undefined
          ? null
          : (s.parentSubAreaId as number);
      if (!byParent.has(parentKey)) {
        byParent.set(parentKey, []);
      }
      byParent.get(parentKey)!.push(s);
    }

    const result: { id: number; label: string; depth: number }[] = [];

    const traverse = (parentId: number | null, depth: number) => {
      const children = byParent.get(parentId) || [];
      for (const child of children) {
        const id = child.idSubArea ?? child.id;
        const name = child.nombreSubArea ?? child.nombre;
        if (id == null || !name) continue;

        const prefix = depth > 0 ? "↳ " : "";
        const label = `${"  ".repeat(depth)}${prefix}${name}`;
        result.push({ id, label, depth });

        traverse(id, depth + 1);
      }
    };

    traverse(null, 0);
    return result;
  }, [selectedArea]);

  // ====== GESTIÓN DE ÁREAS/SUBÁREAS (usa manageAreas) ======

  const openManage = () => {
    setManageError(null);
    setManageOpen(true);
  };

  const closeManage = () => {
    setManageOpen(false);
    setManageError(null);
    setNewAreaName("");
    setNewSubareaName("");
    setSelectedAreaForSubarea(null);
    setSelectedParentSubarea(null);
    setIsSubareaModalOpen(false);
  };

  // Crear área
  const handleAddArea = async () => {
    if (!newAreaName.trim()) return;
    if (!clientId) {
      setManageError("Debes seleccionar un cliente antes de crear áreas.");
      return;
    }

    try {
      setManageLoading(true);
      setManageError(null);

      const created = await areasAPI.createArea({
        nombreArea: newAreaName.trim(),
        clienteId: clientId,
      });

      const newArea: AreaFormData = {
        id: created.idArea,
        nombreArea: created.nombreArea,
        subAreas: [],
      };

      setManageAreas((prev) => [...prev, newArea]);
      setNewAreaName("");
    } catch (err: any) {
      setManageError(
        err?.message || "Error al crear el área. Inténtalo de nuevo.",
      );
    } finally {
      setManageLoading(false);
    }
  };

  // Eliminar área
  const handleRemoveArea = async (areaId: number) => {
    if (!window.confirm("¿Eliminar esta área y todas sus subáreas?")) {
      return;
    }

    try {
      setManageLoading(true);
      setManageError(null);

      await areasAPI.deleteArea(areaId);

      setManageAreas((prev) => prev.filter((a) => a.id !== areaId));

      if (String(selectedAreaId) === String(areaId)) {
        const evArea = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        const evSub = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        onAreaChange(evArea);
        onSubAreaChange(evSub);
      }

      if (selectedAreaForSubarea === areaId) {
        setSelectedAreaForSubarea(null);
        setSelectedParentSubarea(null);
      }
    } catch (err: any) {
      setManageError(
        err?.message || "Error al eliminar el área. Inténtalo de nuevo.",
      );
    } finally {
      setManageLoading(false);
    }
  };

  const startAddSubareaForArea = (areaId: number) => {
    setSelectedAreaForSubarea(areaId);
    setSelectedParentSubarea(null);
    setNewSubareaName("");
    setIsSubareaModalOpen(true);
  };

  const startAddSubareaForSubarea = (
    areaId: number,
    parentSubareaId: number,
  ) => {
    setSelectedAreaForSubarea(areaId);
    setSelectedParentSubarea(parentSubareaId);
    setNewSubareaName("");
    setIsSubareaModalOpen(true);
  };

  const closeSubareaModal = () => {
    setIsSubareaModalOpen(false);
    setNewSubareaName("");
  };

  const handleAddSubarea = async () => {
    if (!newSubareaName.trim() || selectedAreaForSubarea === null) return;

    try {
      setManageLoading(true);
      setManageError(null);

      const dto = {
        nombreSubArea: newSubareaName.trim(),
        areaId: selectedAreaForSubarea,
        parentSubAreaId: selectedParentSubarea ?? undefined,
      };

      const created = await subAreasAPI.createSubArea(dto);

      const newSub: SubAreaFormData = {
        id: created.idSubArea,
        nombreSubArea: created.nombreSubArea,
        areaId: created.areaId,
        parentSubAreaId: created.parentSubAreaId ?? undefined,
      };

      setManageAreas((prev) =>
        prev.map((area) =>
          area.id === selectedAreaForSubarea
            ? {
                ...area,
                subAreas: [...area.subAreas, newSub],
              }
            : area,
        ),
      );

      setNewSubareaName("");
      setIsSubareaModalOpen(false);
    } catch (err: any) {
      setManageError(
        err?.message || "Error al crear la subárea. Inténtalo de nuevo.",
      );
    } finally {
      setManageLoading(false);
    }
  };

  const handleRemoveSubarea = async (areaId: number, subareaId: number) => {
    const area = manageAreas.find((a) => a.id === areaId);
    if (!area) return;

    if (!window.confirm("¿Eliminar esta subárea y todas sus subáreas hijas?")) {
      return;
    }

    const idsToRemove = new Set<number>();
    idsToRemove.add(subareaId);

    let changed = true;
    while (changed) {
      changed = false;
      for (const s of area.subAreas) {
        if (
          s.parentSubAreaId !== undefined &&
          s.parentSubAreaId !== null &&
          s.id !== undefined &&
          !idsToRemove.has(s.id) &&
          idsToRemove.has(s.parentSubAreaId)
        ) {
          idsToRemove.add(s.id);
          changed = true;
        }
      }
    }

    try {
      setManageLoading(true);
      setManageError(null);

      await Promise.all(
        Array.from(idsToRemove).map((id) => subAreasAPI.deleteSubArea(id)),
      );

      setManageAreas((prev) =>
        prev.map((a) =>
          a.id === areaId
            ? {
                ...a,
                subAreas: a.subAreas.filter(
                  (s) => !(s.id !== undefined && idsToRemove.has(s.id)),
                ),
              }
            : a,
        ),
      );

      if (selectedSubAreaId && idsToRemove.has(Number(selectedSubAreaId))) {
        const evSub = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLSelectElement>;
        onSubAreaChange(evSub);
      }
    } catch (err: any) {
      setManageError(
        err?.message || "Error al eliminar la subárea. Inténtalo de nuevo.",
      );
    } finally {
      setManageLoading(false);
    }
  };

  // ====== ÁRBOL PARA LA MODAL ======
  const renderSubareasTree = (
    area: AreaFormData,
    parentId: number | null = null,
  ): React.ReactNode[] => {
    const children = area.subAreas.filter(
      (s) =>
        (s.parentSubAreaId ?? null) === parentId &&
        s.id !== undefined &&
        s.id !== null,
    );

    if (!children.length) return [];

    return children.map((sub) => (
      <div key={sub.id} className={areaStyles.subareaTreeItem}>
        <div className={areaStyles.subareaItem}>
          <span className={areaStyles.subareaName}>📂 {sub.nombreSubArea}</span>

          <div className={areaStyles.subareaActions}>
            <button
              type="button"
              onClick={() =>
                startAddSubareaForSubarea(area.id as number, sub.id as number)
              }
              className={areaStyles.addButtonSmall}
              disabled={manageLoading}
              title="Añadir subárea dentro de esta subárea"
            >
              +
            </button>

            <button
              type="button"
              onClick={() =>
                handleRemoveSubarea(area.id as number, sub.id as number)
              }
              className={areaStyles.removeButtonSmall}
              disabled={manageLoading}
              title="Eliminar subárea (y sus subniveles)"
            >
              ×
            </button>
          </div>
        </div>
        <div className={areaStyles.subareaChildren}>
          {renderSubareasTree(area, sub.id as number)}
        </div>
      </div>
    ));
  };

  const currentAreaForSubarea = manageAreas.find(
    (a) => a.id === selectedAreaForSubarea,
  );
  const currentParentSubarea =
    currentAreaForSubarea && selectedParentSubarea != null
      ? currentAreaForSubarea.subAreas.find(
          (s) => s.id === selectedParentSubarea,
        ) || null
      : null;

  return (
    <div className={styles.hierarchicalSelector}>
      <h4>Ubicación Jerárquica</h4>

      {/* ÁREA PRINCIPAL */}
      <div className={styles.hierarchicalLevel}>
        <label>Área Principal</label>
        <div className={styles.withManageButton}>
          <select
            value={selectedAreaId || ""}
            onChange={onAreaChange}
            disabled={isDisabled || selectorAreas.length === 0}
          >
            <option value="">Seleccionar área...</option>
            {selectorAreas.map((area) => (
              <option key={area.idArea ?? area.id} value={area.idArea ?? area.id}>
                {area.nombreArea ?? area.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={styles.manageButton}
            onClick={openManage}
            disabled={isDisabled}
            title={
              clientId
                ? "Gestionar áreas y subáreas del cliente"
                : "Selecciona primero un cliente para gestionar áreas"
            }
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* SUBÁREA */}
      {selectedArea && flatSubAreas.length > 0 && (
        <div className={styles.hierarchicalLevel}>
          <label>Subárea</label>
          <select
            value={selectedSubAreaId || ""}
            onChange={onSubAreaChange}
            disabled={isDisabled}
          >
            <option value="">Seleccionar subárea...</option>
            {flatSubAreas.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {/* MODAL DE GESTIÓN */}
      {manageOpen && (
        <div className={areaStyles.modalOverlay}>
          <div className={areaStyles.modal}>
            <div className={areaStyles.modalHeader}>
              <div className={areaStyles.headerContent}>
                <h2 className={areaStyles.modalTitle}>
                  Gestionar Áreas y Subáreas
                </h2>
              </div>
              <button
                className={areaStyles.closeButton}
                onClick={closeManage}
                disabled={manageLoading}
              >
                ×
              </button>
            </div>

            <div className={areaStyles.modalBody}>
              {manageError && (
                <div className={areaStyles.errorAlert}>
                  <span className={areaStyles.errorIcon}>⚠️</span>
                  <span className={areaStyles.errorText}>{manageError}</span>
                  <button
                    className={areaStyles.errorClose}
                    onClick={() => setManageError(null)}
                  >
                    ×
                  </button>
                </div>
              )}

              <div className={areaStyles.step}>
                <h3 className={areaStyles.stepTitle}>
                  <span className={areaStyles.stepNumber}>1</span>
                  Áreas y Subáreas del Cliente
                </h3>

                <div className={areaStyles.stepDescription}>
                  <p>
                    Crea, organiza o elimina las áreas y subáreas disponibles
                    para asignar equipos.
                  </p>
                  {!clientId && (
                    <span className={areaStyles.requiredText}>
                      Debes seleccionar un cliente antes de crear áreas nuevas.
                    </span>
                  )}
                </div>

                {/* Agregar Área */}
                <div className={areaStyles.addAreaForm}>
                  <div className={areaStyles.areaInputGroup}>
                    <input
                      type="text"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="Nombre del área (ej: Producción, Bodega, Oficinas)"
                      className={areaStyles.areaInput}
                      disabled={manageLoading}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleAddArea();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddArea()}
                      className={areaStyles.addButton}
                      disabled={
                        manageLoading || !newAreaName.trim() || !clientId
                      }
                    >
                      <span className={areaStyles.plusIcon}>+</span>
                      Agregar Área
                    </button>
                  </div>
                </div>

                {/* Lista de Áreas */}
                {manageAreas.length > 0 ? (
                  <div className={areaStyles.areasSection}>
                    <h4 className={areaStyles.listTitle}>
                      Áreas agregadas ({manageAreas.length})
                    </h4>
                    <div className={areaStyles.areasList}>
                      {manageAreas.map((area) => (
                        <div key={area.id} className={areaStyles.areaItem}>
                          <div className={areaStyles.areaHeader}>
                            <div className={areaStyles.areaInfo}>
                              <span className={areaStyles.areaBullet}>📁</span>
                              <span className={areaStyles.areaName}>
                                {area.nombreArea}
                              </span>
                              <span className={areaStyles.subareaCount}>
                                {area.subAreas.length} subárea
                                {area.subAreas.length !== 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className={areaStyles.areaActions}>
                              <button
                                type="button"
                                onClick={() =>
                                  startAddSubareaForArea(area.id as number)
                                }
                                className={areaStyles.addButtonSmall}
                                disabled={manageLoading}
                                title="Añadir subárea dentro de esta área"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleRemoveArea(area.id as number)
                                }
                                className={areaStyles.removeButton}
                                disabled={manageLoading}
                                title="Eliminar área"
                              >
                                ×
                              </button>
                            </div>
                          </div>

                          {area.subAreas.length > 0 && (
                            <div className={areaStyles.subareasList}>
                              {renderSubareasTree(area, null)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={areaStyles.noAreas}>
                    <div className={areaStyles.noDataIcon}>📁</div>
                    <p>No hay áreas configuradas para este cliente</p>
                    <small>
                      Puedes agregarlas aquí o hacerlo desde la gestión de
                      clientes.
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className={areaStyles.modalFooter}>
              <div className={areaStyles.footerContent}>
                <div className={areaStyles.actionButtons}>
                  <button
                    className={areaStyles.cancelButton}
                    onClick={closeManage}
                    disabled={manageLoading}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>

            {/* Mini-modal de subárea */}
            {isSubareaModalOpen && currentAreaForSubarea && (
              <div
                className={areaStyles.subareaModalOverlay}
                onClick={closeSubareaModal}
              >
                <div
                  className={areaStyles.subareaModal}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className={areaStyles.subareaModalTitle}>
                    Agregar subárea
                  </h4>
                  <div className={areaStyles.subareaModalContext}>
                    <div>
                      Área:{" "}
                      <strong>{currentAreaForSubarea.nombreArea}</strong>
                    </div>
                    {currentParentSubarea && (
                      <div>
                        Subárea padre:{" "}
                        <strong>{currentParentSubarea.nombreSubArea}</strong>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newSubareaName}
                    onChange={(e) => setNewSubareaName(e.target.value)}
                    placeholder="Nombre de la subárea"
                    className={areaStyles.subareaInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleAddSubarea();
                      }
                    }}
                    autoFocus
                  />
                  <div className={areaStyles.subareaModalActions}>
                    <button
                      type="button"
                      className={areaStyles.subareaModalCancel}
                      onClick={closeSubareaModal}
                      disabled={manageLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={areaStyles.subareaModalConfirm}
                      onClick={() => void handleAddSubarea()}
                      disabled={
                        manageLoading ||
                        !newSubareaName.trim() ||
                        selectedAreaForSubarea === null
                      }
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}