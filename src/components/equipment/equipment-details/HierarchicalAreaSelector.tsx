// src/components/equipment/equipment-details/HierarchicalAreaSelector.tsx
import styles from "../../../styles/components/equipment/equipment-details/HierarchicalAreaSelector.module.css";

interface HierarchicalAreaSelectorProps {
  areas: any[]; // Cambiado a any para compatibilidad
  selectedAreaId: number | string;
  selectedSubAreaId: number | string;
  disabled?: boolean;
  error?: string | null;
  onAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubAreaChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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

  // Encontrar área seleccionada
  const selectedArea = areas.find((a) => 
    a.idArea === selectedAreaId || a.id === selectedAreaId
  );

  // Obtener subáreas (pueden venir de diferentes propiedades)
  let subAreas: any[] = [];
  
  if (selectedArea) {
    // Intentar obtener subáreas de diferentes formas
    if (selectedArea.treeData?.subAreas) {
      subAreas = selectedArea.treeData.subAreas;
    } else if (selectedArea.subAreas) {
      subAreas = selectedArea.subAreas;
    } else if (selectedArea.children) {
      subAreas = selectedArea.children;
    }
  }

  // Función para aplanar subáreas recursivamente
  const flattenSubAreas = (nodes: any[], depth = 0): any[] => {
    const result: any[] = [];
    
    for (const node of nodes) {
      const label = "  ".repeat(depth) + "↳ " + (node.nombre || node.nombreSubArea || node.name);
      result.push({
        id: node.id || node.idSubArea,
        label,
        depth
      });

      // Si tiene hijos, aplanarlos también
      if (node.children && node.children.length > 0) {
        result.push(...flattenSubAreas(node.children, depth + 1));
      }
    }
    
    return result;
  };

  const flatSubAreas = flattenSubAreas(subAreas);

  return (
    <div className={styles.hierarchicalSelector}>
      <h4>Ubicación Jerárquica</h4>

      <div className={styles.hierarchicalLevel}>
        <label>Área Principal</label>
        <select
          value={selectedAreaId || ""}
          onChange={onAreaChange}
          disabled={isDisabled || areas.length === 0}
        >
          <option value="">Sin área principal</option>
          {areas.map((area) => (
            <option key={area.idArea || area.id} value={area.idArea || area.id}>
              {area.nombreArea || area.nombre || area.name}
            </option>
          ))}
        </select>
      </div>

      {selectedArea && flatSubAreas.length > 0 && (
        <div className={styles.hierarchicalLevel}>
          <label>
            <span className={styles.levelIndicator}>↳</span>
            Subárea
          </label>
          <select
            value={selectedSubAreaId || ""}
            onChange={onSubAreaChange}
            disabled={isDisabled}
          >
            <option value="">Sin subárea</option>
            {flatSubAreas.map((opt) => (
              <option key={opt.id} value={opt.id}>
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