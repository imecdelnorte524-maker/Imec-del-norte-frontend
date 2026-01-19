// src/components/equipment/equipment-list/HierarchicalAreaSelector.tsx
import styles from "../../../styles/components/equipment/equipment-list/HierarchicalAreaSelector.module.css";
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

// Opción plana de subárea, con profundidad
interface FlatSubAreaOption {
  id: number;
  label: string; // ruta completa: "Línea 1 / Máquina A / Sector 3"
  depth: number; // nivel de profundidad (0 = raíz)
}

// Función recursiva para aplanar el árbol de subáreas
function flattenSubAreas(
  nodes: SubAreaWithChildren[],
  parentPath: string[] = [],
  depth = 0,
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

  // Obtenemos el árbol de subáreas desde treeData.subAreas
  const rootSubAreas: SubAreaWithChildren[] =
    (selectedArea?.treeData?.subAreas as SubAreaWithChildren[]) || [];

  const flatSubAreas = flattenSubAreas(rootSubAreas);

  return (
    <div className={styles.hierarchicalSelector}>
      <h4>Ubicación Jerárquica (Opcional)</h4>

      {/* NIVEL 1: ÁREA PRINCIPAL */}
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

      {/* NIVEL 2: SUBÁREA (cualquier nivel, representado en un solo select) */}
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
                {/* Indent visual según profundidad */}
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