// src/components/equipment/equipment-details/LocationSection.tsx
import type { Equipment } from "../../../interfaces/EquipmentInterfaces";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type { SubAreaWithChildren } from "../../../interfaces/SubAreaInterfaces";
import styles from "../../../styles/components/equipment/equipment-details/LocationSection.module.css";

interface LocationSectionProps {
  equipment: Equipment;
  editing: boolean;
  // Áreas con árbol de subáreas (treeData) - opcional para no romper otros usos
  areasWithTree?: AreaSimple[];
}

// Busca la ruta hasta una subárea dentro del árbol
function findSubAreaPath(
  nodes: SubAreaWithChildren[],
  targetId: number,
  parentPath: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const path = [...parentPath, node.nombre];
    if (node.id === targetId) {
      return path;
    }
    if (node.children && node.children.length > 0) {
      const found = findSubAreaPath(node.children, targetId, path);
      if (found) return found;
    }
  }
  return null;
}

export default function LocationSection({
  equipment,
  areasWithTree,
}: LocationSectionProps) {
  // Cliente
  const clientLabel = equipment.client
    ? `${equipment.client.nombre} (NIT: ${equipment.client.nit})`
    : equipment.client;

  // Área (nombre directo desde el equipo)
  const areaName = equipment.area?.nombreArea || null;

  // Subárea directa (solo la hoja donde está el equipo)
  const subAreaName = equipment.subArea?.nombreSubArea || null;

  // Ruta jerárquica de subáreas usando el árbol (si lo tenemos)
  let hierarchicalPath: string | null = null;

  const areaIdFromEquipment = equipment.area?.idArea || null;
  const subAreaIdFromEquipment = equipment.subArea?.idSubArea || null;

  if (
    areasWithTree &&
    Array.isArray(areasWithTree) &&
    areaIdFromEquipment &&
    subAreaIdFromEquipment
  ) {
    const areaNode = areasWithTree.find(
      (a) => a.idArea === areaIdFromEquipment,
    );

    const rootSubAreas: SubAreaWithChildren[] =
      (areaNode?.treeData?.subAreas as SubAreaWithChildren[]) || [];

    const path = findSubAreaPath(rootSubAreas, subAreaIdFromEquipment);
    if (path && path.length > 0) {
      hierarchicalPath = path.join(" / ");
    }
  }

  return (
    <div className={styles.section}>
      <h3>Ubicación</h3>

      <div className={styles.detailItem}>
        <strong>Cliente (empresa):</strong>
        <span>{clientLabel}</span>
      </div>

      {areaName && (
        <div className={styles.detailItem}>
          <strong>Área:</strong>
          <span>{areaName}</span>
        </div>
      )}

      {subAreaName && (
        <div className={styles.detailItem}>
          <strong>Subárea:</strong>
          <span>{subAreaName}</span>
        </div>
      )}

      {hierarchicalPath && (
        <div className={styles.detailItem}>
          <strong>Ubicación jerárquica:</strong>
          <span>
            {areaName ? `${areaName} / ${hierarchicalPath}` : hierarchicalPath}
          </span>
        </div>
      )}

      {equipment.workOrders && equipment.workOrders.length > 0 && (
        <div className={styles.detailItem}>
          <strong>Órdenes de Trabajo:</strong>
          <span>{equipment.workOrders.length} órdenes asociadas</span>
        </div>
      )}
    </div>
  );
}