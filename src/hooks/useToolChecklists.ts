import { useState, useCallback } from 'react';
import { 
  TOOL_CHECKLISTS, 
  getChecklistForTool,
  getDefaultChecklist,
  type ToolChecklist,
  type ChecklistParameter
} from '../data/preoperational/toolChecklist';
import type { CheckValue } from '../interfaces/SgSstInterface';
import type { ChecklistItem } from '../interfaces/CheckListInterface';

/**
 * Hook personalizado para manejar checklists preoperacionales dinámicos
 */
export function useToolChecklists() {
  const [availableChecklists] = useState<ToolChecklist[]>(TOOL_CHECKLISTS);
  const [selectedChecklist, setSelectedChecklist] = useState<ToolChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener checklist para un tipo de herramienta
   */
  const getChecklist = useCallback((toolType: string): ToolChecklist => {
    try {
      const checklist = getChecklistForTool(toolType);
      
      if (!checklist) {
        console.warn(`No se encontró checklist específico para: ${toolType}. Usando checklist por defecto.`);
        return getDefaultChecklist();
      }
      
      return checklist;
    } catch (err) {
      console.error('Error al obtener checklist:', err);
      return getDefaultChecklist();
    }
  }, []);

  /**
   * Convertir parámetros del checklist a items del formulario
   */
  const mapParametersToChecklistItems = useCallback((
    parameters: ChecklistParameter[]
  ): ChecklistItem[] => {
    return parameters.map(param => ({
      parameter: param.parameter,
      parameterId: param.id,
      description: param.description,
      category: param.category,
      value: undefined,
      observations: '',
      required: param.required,
      critical: param.critical
    }));
  }, []);

  /**
   * Obtener items del checklist para un herramienta
   */
  const getChecklistItems = useCallback((toolType: string): ChecklistItem[] => {
    const checklist = getChecklist(toolType);
    return mapParametersToChecklistItems(checklist.parameters);
  }, [getChecklist, mapParametersToChecklistItems]);

  /**
   * Validar si todos los items requeridos están completos
   */
  const validateChecklistItems = useCallback((items: ChecklistItem[]) => {
    const validation = {
      isValid: true,
      missingRequired: [] as ChecklistItem[],
      criticalIssues: [] as ChecklistItem[],
      warnings: [] as string[]
    };

    items.forEach(item => {
      // Verificar items requeridos sin valor
      if (item.required && item.value === undefined) {
        validation.isValid = false;
        validation.missingRequired.push(item);
      }

      // Verificar items críticos con valor BAD
      if (item.critical && item.value === 'BAD') {
        validation.criticalIssues.push(item);
        validation.warnings.push(`Problema crítico encontrado: ${item.parameter}`);
      }
    });

    // Si hay problemas críticos, el checklist no es válido
    if (validation.criticalIssues.length > 0) {
      validation.isValid = false;
    }

    return validation;
  }, []);

  /**
   * Obtener estadísticas del checklist
   */
  const getChecklistStats = useCallback((items: ChecklistItem[]) => {
    const total = items.length;
    const completed = items.filter(item => item.value !== undefined).length;
    const requiredItems = items.filter(item => item.required);
    const requiredCompleted = requiredItems.filter(item => item.value !== undefined).length;
    const criticalItems = items.filter(item => item.critical);
    const criticalWithIssues = criticalItems.filter(item => item.value === 'BAD').length;

    return {
      total,
      completed,
      required: requiredItems.length,
      requiredCompleted,
      critical: criticalItems.length,
      criticalWithIssues,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredProgress: requiredItems.length > 0 
        ? Math.round((requiredCompleted / requiredItems.length) * 100) 
        : 0
    };
  }, []);

  /**
   * Filtrar checklists por categoría
   */
  const getChecklistsByCategory = useCallback((category: string) => {
    return availableChecklists.filter(
      checklist => checklist.toolCategory === category
    );
  }, [availableChecklists]);

  /**
   * Obtener todas las categorías disponibles
   */
  const getAllCategories = useCallback(() => {
    const categories = availableChecklists.map(checklist => checklist.toolCategory);
    return [...new Set(categories)].sort();
  }, [availableChecklists]);

  /**
   * Actualizar valor de un item del checklist
   */
  const updateChecklistItem = useCallback((
    items: ChecklistItem[],
    itemId: string,
    updates: Partial<ChecklistItem>
  ): ChecklistItem[] => {
    return items.map(item => 
      item.parameterId === itemId 
        ? { ...item, ...updates }
        : item
    );
  }, []);

  /**
   * Reiniciar checklist a valores por defecto
   */
  const resetChecklistItems = useCallback((items: ChecklistItem[]): ChecklistItem[] => {
    return items.map(item => ({
      ...item,
      value: undefined,
      observations: ''
    }));
  }, []);

  /**
   * Verificar si el herramienta necesita herramientas específicas
   */
  const getRequiredTools = useCallback((toolType: string): string[] => {
    const checklist = getChecklist(toolType);
    return checklist.requiresTools || [];
  }, [getChecklist]);

  /**
   * Obtener tiempo estimado de verificación
   */
  const getEstimatedTime = useCallback((toolType: string): number => {
    const checklist = getChecklist(toolType);
    return checklist.estimatedTime;
  }, [getChecklist]);

  return {
    // Estado
    availableChecklists,
    selectedChecklist,
    loading,
    error,
    
    // Funciones
    getChecklist,
    getChecklistItems,
    validateChecklistItems,
    getChecklistStats,
    getChecklistsByCategory,
    getAllCategories,
    updateChecklistItem,
    resetChecklistItems,
    getRequiredTools,
    getEstimatedTime,
    
    // Setters
    setSelectedChecklist,
    setLoading,
    setError
  };
}

/**
 * Hook para manejar el estado del checklist en el formulario
 */
export function useChecklistForm(initialToolType?: string) {
  const [toolType, setToolType] = useState<string>(initialToolType || '');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistInfo, setChecklistInfo] = useState<ToolChecklist | null>(null);
  
  const {
    getChecklist,
    getChecklistItems,
    validateChecklistItems,
    getChecklistStats,
    getRequiredTools,
    getEstimatedTime
  } = useToolChecklists();

  /**
   * Inicializar checklist cuando cambia el tipo de herramienta
   */
  const initializeChecklist = useCallback((type: string) => {
    setToolType(type);
    
    const checklist = getChecklist(type);
    const items = getChecklistItems(type);
    
    setChecklistInfo(checklist);
    setChecklistItems(items);
    
    return { checklist, items };
  }, [getChecklist, getChecklistItems]);

  /**
   * Actualizar valor de un item
   */
  const updateItemValue = useCallback((itemId: string, value: CheckValue) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.parameterId === itemId 
          ? { ...item, value }
          : item
      )
    );
  }, []);

  /**
   * Actualizar observaciones de un item
   */
  const updateItemObservations = useCallback((itemId: string, observations: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.parameterId === itemId 
          ? { ...item, observations }
          : item
      )
    );
  }, []);

  /**
   * Reiniciar todos los valores del checklist
   */
  const resetChecklist = useCallback(() => {
    setChecklistItems(prev => 
      prev.map(item => ({
        ...item,
        value: undefined,
        observations: ''
      }))
    );
  }, []);

  /**
   * Validar el checklist actual
   */
  const validateCurrentChecklist = useCallback(() => {
    return validateChecklistItems(checklistItems);
  }, [checklistItems, validateChecklistItems]);

  /**
   * Obtener estadísticas actuales
   */
  const getCurrentStats = useCallback(() => {
    return getChecklistStats(checklistItems);
  }, [checklistItems, getChecklistStats]);

  /**
   * Verificar si el checklist está completo
   */
  const isChecklistComplete = useCallback(() => {
    const validation = validateChecklistItems(checklistItems);
    return validation.isValid;
  }, [checklistItems, validateChecklistItems]);

  /**
   * Obtener datos del formulario
   */
  const getFormData = useCallback(() => {
    return {
      toolType,
      checklistItems,
      checklistInfo,
      requiredTools: checklistInfo?.requiresTools || [],
      estimatedTime: checklistInfo?.estimatedTime || 10,
      additionalInstructions: checklistInfo?.additionalInstructions,
      validation: validateChecklistItems(checklistItems),
      stats: getChecklistStats(checklistItems)
    };
  }, [toolType, checklistItems, checklistInfo, validateChecklistItems, getChecklistStats]);

  return {
    // Estado
    toolType,
    checklistItems,
    checklistInfo,
    
    // Funciones
    initializeChecklist,
    updateItemValue,
    updateItemObservations,
    resetChecklist,
    validateCurrentChecklist,
    getCurrentStats,
    isChecklistComplete,
    getFormData,
    
    // Utilitarios
    getRequiredTools: () => getRequiredTools(toolType),
    getEstimatedTime: () => getEstimatedTime(toolType)
  };
}

