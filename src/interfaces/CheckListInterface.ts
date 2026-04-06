// src/interfaces/CheckListInterface.ts
import type { CheckValue, PreopParamCategory } from './SgSstInterface';

// Parámetro de checklist proveniente del backend
export interface ChecklistParameter {
  id: number;
  parameterCode?: string;
  parameter: string;
  description?: string;
  category: PreopParamCategory;
  required: boolean;
  critical: boolean;
  displayOrder?: number;
}

// Checklist completo para un tipo de herramienta
export interface ToolChecklist {
  id: number;
  toolType: string;
  toolCategory: string;
  version?: number;
  parameters: ChecklistParameter[];
  additionalInstructions?: string;
  requiresTools?: string[];
  estimatedTime: number;
}

// Item de checklist en el formulario del front
export interface ChecklistItem {
  parameter: string;
  parameterId: number;
  description?: string;
  category: PreopParamCategory;
  value?: CheckValue;
  observations?: string;
  required: boolean;
  critical: boolean;
  parameterCode?: string;
}

// Datos extendidos para el formulario preoperacional
export interface DynamicPreoperationalFormData {
  templateId: number;
  toolName: string;
  toolType: string;
  toolCategory: string;
  checks: ChecklistItem[];
  userId: number;
  createdBy: number;
  workOrderId: number;
  estimatedTime: number;
  requiresTools?: string[];
  additionalInstructions?: string;
}

// Configuración de mapeo de tipos de herramienta
export interface ToolTypeMapping {
  [key: string]: string;
}

// Resultado de validación del checklist
export interface ChecklistValidation {
  isValid: boolean;
  missingRequired: ChecklistItem[];
  criticalIssues: ChecklistItem[];
  warnings: string[];
}

// Datos de resumen del checklist
export interface ChecklistStats {
  total: number;
  completed: number;
  required: number;
  requiredCompleted: number;
  critical: number;
  criticalWithIssues: number;
  progress: number;
  requiredProgress: number;
}