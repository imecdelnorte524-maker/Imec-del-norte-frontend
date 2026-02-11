// src/hooks/useToolChecklists.ts
import { useState, useCallback } from "react";
import { sgSstService } from "../api/sg-sst";
import type { CheckValue } from "../interfaces/SgSstInterface";
import type {
  ChecklistItem,
  ChecklistValidation,
  ChecklistStats,
} from "../interfaces/CheckListInterface";

export function useChecklistForm() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  const initializeChecklist = useCallback(
    async (toolType: string) => {
      try {
        setLoadingChecklist(true);
        setChecklistError(null);

        const template = await sgSstService.getPreoperationalTemplate(toolType);

        const items: ChecklistItem[] = template.parameters.map((p) => ({
          parameterId: p.parameterCode || String(p.id),
          parameter: p.parameter,
          description: p.description,
          category: p.category,
          required: p.required,
          critical: p.critical,
          value: undefined,
          observations: "",
        }));

        setChecklistItems(items);

        return { items, meta: template };
      } catch (error: any) {
        console.error("Error cargando checklist preoperacional:", error);
        setChecklistError(
          error.response?.data?.message ||
            "Error al cargar checklist preoperacional",
        );
        setChecklistItems([]);
        return { items: [], meta: null };
      } finally {
        setLoadingChecklist(false);
      }
    },
    [],
  );

  const updateItemValue = useCallback(
    (parameterId: string, value: CheckValue) => {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.parameterId === parameterId ? { ...item, value } : item,
        ),
      );
    },
    [],
  );

  const updateItemObservations = useCallback(
    (parameterId: string, observations: string) => {
      setChecklistItems((prev) =>
        prev.map((item) =>
          item.parameterId === parameterId ? { ...item, observations } : item,
        ),
      );
    },
    [],
  );

  const validateCurrentChecklist = useCallback((): ChecklistValidation => {
    const missingRequired: ChecklistItem[] = [];
    const criticalIssues: ChecklistItem[] = [];
    const warnings: string[] = [];

    checklistItems.forEach((item) => {
      if (item.required && !item.value) {
        missingRequired.push(item);
      }

      if (item.critical && item.value === "BAD") {
        criticalIssues.push(item);
        if (!item.observations || !item.observations.trim()) {
          warnings.push(
            `Agregar observaciones al parámetro crítico: "${item.parameter}"`,
          );
        }
      }
    });

    // 🔹 isValid = no faltan requeridos
    const isValid = missingRequired.length === 0;

    return {
      isValid,
      missingRequired,
      criticalIssues,
      warnings,
    };
  }, [checklistItems]);

  const isChecklistComplete = useCallback(() => {
    const validation = validateCurrentChecklist();
    return validation.missingRequired.length === 0;
  }, [validateCurrentChecklist]);

  const getCurrentStats = useCallback((): ChecklistStats => {
    const total = checklistItems.length;
    const completed = checklistItems.filter((i) => i.value != null).length;
    const required = checklistItems.filter((i) => i.required).length;
    const requiredCompleted = checklistItems.filter(
      (i) => i.required && i.value != null,
    ).length;
    const critical = checklistItems.filter((i) => i.critical).length;
    const criticalWithIssues = checklistItems.filter(
      (i) => i.critical && i.value === "BAD",
    ).length;

    const progress = total ? Math.round((completed / total) * 100) : 0;
    const requiredProgress = required
      ? Math.round((requiredCompleted / required) * 100)
      : 0;

    return {
      total,
      completed,
      required,
      requiredCompleted,
      critical,
      criticalWithIssues,
      progress,
      requiredProgress,
    };
  }, [checklistItems]);

  return {
    checklistItems,
    initializeChecklist,
    updateItemValue,
    updateItemObservations,
    validateCurrentChecklist,
    getCurrentStats,
    isChecklistComplete,
    loadingChecklist,
    checklistError,
  };
}