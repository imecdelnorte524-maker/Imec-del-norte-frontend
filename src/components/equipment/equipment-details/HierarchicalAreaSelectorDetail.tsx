// src/components/equipment/equipment-details/HierarchicalAreaSelectorDetail.tsx
"use client";

import type React from "react";
import styles from "../../../styles/components/equipment/equipment-details/HierarchicalAreaSelectorDetail.module.css";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type { SubAreaWithChildren } from "../../../interfaces/SubAreaInterfaces";

interface HierarchicalAreaSelectorDetailProps {
  areas: AreaSimple[];
  selectedAreaId: number | "";
  selectedSubAreaId: number | "";
  saving: boolean;
  loadingLocations: boolean;
  locationsError: string | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface FlatSubAreaOption {
  id: number;
  label: string;
  depth: number;
}

// Aplana el árbol de subáreas en una lista con etiqueta jerárquica
function flattenSubAreas(
  nodes: SubAreaWithChildren[],
  parentPath: string[] = [],
  depth = 0
): FlatSubAreaOption[] {
  const result: FlatSubAreaOption[] = [];

  for (const node of nodes) {
    const path = [...parentPath, node.nombre];
    const label = path.join(" / ");
    result.push({ id: node.id, label, depth });

    if (node.children && node.children.length > 0) {
      result.push(...flattenSubAreas(node.children, path, depth + 1));
    }
  }

  return result;
}

export default function HierarchicalAreaSelectorDetail({
  areas,
  selectedAreaId,
  selectedSubAreaId,
  saving,
  loadingLocations,
  locationsError,
  onAreaChange,
  onSubAreaChange,
}: HierarchicalAreaSelectorDetailProps) {
  const disabled = saving || loadingLocations;

  const selectedArea =
    typeof selectedAreaId === "number"
      ? areas.find((a) => a.idArea === selectedAreaId)
      : undefined;

  const rootSubAreas: SubAreaWithChildren[] =
    (selectedArea?.treeData?.subAreas as SubAreaWithChildren[]) || [];

  const flatSubAreas = flattenSubAreas(rootSubAreas);

  return (
    <div className={styles.hierarchicalSelector}>
      <h4>Ubicación Jerárquica (Opcional)</h4>

      {/* ÁREA */}
      <div className={styles.hierarchicalLevel}>
        <label>Área Principal</label>
        <select
          value={selectedAreaId || ""}
          onChange={onAreaChange}
          disabled={disabled || areas.length === 0}
        >
          <option value="">Sin área principal</option>
          {areas.map((area) => (
            <option key={area.idArea} value={area.idArea}>
              {area.nombreArea}
            </option>
          ))}
        </select>
      </div>

      {/* SUBÁREA (jerárquica, cualquier nivel) */}
      {selectedArea && flatSubAreas.length > 0 && (
        <div className={styles.hierarchicalLevel}>
          <label>
            <span className={styles.levelIndicator}>↳</span>
            Subárea (jerárquica)
          </label>
          <select
            value={selectedSubAreaId || ""}
            onChange={onSubAreaChange}
            disabled={disabled}
          >
            <option value="">Sin subárea</option>
            {flatSubAreas.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {"↳ ".repeat(opt.depth)}
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {locationsError && <div className={styles.error}>{locationsError}</div>}
    </div>
  );
}
