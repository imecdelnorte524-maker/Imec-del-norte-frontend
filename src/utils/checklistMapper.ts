/**
 * Utilidades para mapear y transformar datos de checklists
 */

import type { Herramienta as tool } from '../interfaces/InventoryInterfaces';
import { TOOL_TYPE_MAPPINGS, getChecklistForTool } from '../data/preoperational/toolChecklist';
import type { ToolChecklist } from '../interfaces/CheckListInterface';

/**
 * Mapear herramienta a tipo de checklist
 */
export function mapToolToChecklistType(tool: tool): string {
  const { nombre, tipo, caracteristicasTecnicas } = tool;
  
  // Prioridad de búsqueda
  const searchTerms = [
    nombre.toUpperCase(),
    tipo.toUpperCase(),
    caracteristicasTecnicas?.toUpperCase() || ''
  ];
  
  // Buscar en mapeos
  for (const term of searchTerms) {
    if (!term) continue;
    
    // Buscar mapeo directo
    const mappedType = TOOL_TYPE_MAPPINGS[term];
    if (mappedType) {
      return mappedType;
    }
    
    // Buscar coincidencias parciales
    for (const [key, value] of Object.entries(TOOL_TYPE_MAPPINGS)) {
      if (term.includes(key) || key.includes(term)) {
        return value;
      }
    }
  }
  
  // Si no se encuentra, usar el tipo del herramienta
  return tipo.toUpperCase();
}

/**
 * Obtener checklist para un herramienta
 */
export function getChecklistForToolItem(tool: tool): ToolChecklist | null {
  try {
    const checklistType = mapToolToChecklistType(tool);
    const checklist = getChecklistForTool(checklistType);
    
    return checklist || null;
  } catch (error) {
    console.error('Error al obtener checklist para herramienta:', tool.nombre, error);
    return null;
  }
}

/**
 * Verificar si un herramienta tiene checklist específico
 */
export function hasSpecificChecklist(tool: tool): boolean {
  const checklist = getChecklistForToolItem(tool);
  return checklist !== null;
}

/**
 * Agrupar herramientas por categoría de checklist
 */
export function groupToolsByChecklistCategory(tools: tool[]): Record<string, tool[]> {
  const groups: Record<string, tool[]> = {};
  
  tools.forEach(tool => {
    const checklist = getChecklistForToolItem(tool);
    const category = checklist?.toolCategory || 'GENERAL';
    
    if (!groups[category]) {
      groups[category] = [];
    }
    
    groups[category].push(tool);
  });
  
  return groups;
}

/**
 * Filtrar herramientas que tienen checklist específico
 */
export function filterToolsWithChecklist(tools: tool[]): tool[] {
  return tools.filter(hasSpecificChecklist);
}

/**
 * Obtener información de checklist para lista de herramientas
 */
export function getChecklistInfoForTools(tools: tool[]): Array<{
  tool: tool;
  checklist: ToolChecklist | null;
  hasSpecificChecklist: boolean;
  estimatedTime: number;
  requiredTools?: string[];
}> {
  return tools.map(tool => {
    const checklist = getChecklistForToolItem(tool);
    
    return {
      tool,
      checklist,
      hasSpecificChecklist: checklist !== null,
      estimatedTime: checklist?.estimatedTime || 10,
      requiredTools: checklist?.requiresTools
    };
  });
}

/**
 * Ordenar herramientas por categoría de checklist
 */
export function sortToolsByChecklistCategory(tools: tool[]): tool[] {
  const withChecklist = tools.filter(hasSpecificChecklist);
  const withoutChecklist = tools.filter(e => !hasSpecificChecklist(e));
  
  // Ordenar con checklist por categoría
  withChecklist.sort((a, b) => {
    const checklistA = getChecklistForToolItem(a);
    const checklistB = getChecklistForToolItem(b);
    
    if (!checklistA || !checklistB) return 0;
    
    return checklistA.toolCategory.localeCompare(checklistB.toolCategory);
  });
  
  return [...withChecklist, ...withoutChecklist];
}

/**
 * Obtener resumen de checklists disponibles para una lista de herramientas
 */
export function getChecklistSummary(tools: tool[]) {
  const groups = groupToolsByChecklistCategory(tools);
  const categories = Object.keys(groups);
  
  return {
    totalTools: tools.length,
    totalCategories: categories.length,
    categories: categories.map(category => ({
      name: category,
      count: groups[category].length,
      tools: groups[category].map(e => e.nombre)
    })),
    withSpecificChecklist: filterToolsWithChecklist(tools).length,
    withoutSpecificChecklist: tools.length - filterToolsWithChecklist(tools).length
  };
}
