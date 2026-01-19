// src/components/equipment/equipment-details/HierarchicalAreaSelector.tsx
import styles from "../../../styles/components/equipment/equipment-details/HierarchicalAreaSelector.module.css";
import type { AreaSimple } from "../../../interfaces/AreaInterfaces";
import type { SubAreaWithChildren } from "../../../interfaces/SubAreaInterfaces";

interface HierarchicalAreaSelectorProps {
  areas: AreaSimple[];
  selectedAreaId: number | "";
  selectedSubAreaId: number | "";
  disabled?: boolean;
  error?: string | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface FlatSubAreaOption {
  id: number;
  label: string;
  depth: number;
}

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

export default function HierarchicalAreaSelector({
  areas,
  selectedAreaId,
  selectedSubAreaId,
  disabled,
  error,
  onAreaChange,
  onSubAreaChange,
}: HierarchicalAreaSelectorProps) {
  const isDisabled = Boolean(disabled);

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

      <div className={styles.hierarchicalLevel}>
        <label>Área Principal</label>
        <select
          value={selectedAreaId || ""}
          onChange={onAreaChange}
          disabled={isDisabled || areas.length === 0}
        >
          <option value="">Sin área principal</option>
          {areas.map((area) => (
            <option key={area.idArea} value={area.idArea}>
              {area.nombreArea}
            </option>
          ))}
        </select>
      </div>

      {selectedArea && flatSubAreas.length > 0 && (
        <div className={styles.hierarchicalLevel}>
          <label>
            <span className={styles.levelIndicator}>↳</span>
            Subárea (jerárquica)
          </label>
          <select
            value={selectedSubAreaId || ""}
            onChange={onSubAreaChange}
            disabled={isDisabled}
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

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
