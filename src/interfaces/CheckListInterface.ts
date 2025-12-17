/**
 * Tipos para el sistema de checklists preoperacionales
 */

import type { CheckValue } from './SgSstInterface';

// Parámetro del checklist
export interface ChecklistParameter {
  id: string;
  parameter: string;
  description?: string;
  category: 'safety' | 'functional' | 'visual' | 'operational' | 'electrical';
  required: boolean;
  critical: boolean;
}

// Checklist completo para un tipo de herramienta
export interface ToolChecklist {
  toolType: string;
  toolCategory: string;
  parameters: ChecklistParameter[];
  additionalInstructions?: string;
  requiresTools?: string[];
  estimatedTime: number;
}

// Item de checklist en el formulario
export interface ChecklistItem {
  parameter: string;
  parameterId: string;
  description?: string;
  category: string;
  value?: CheckValue;
  observations?: string;
  required: boolean;
  critical: boolean;
}

// Datos extendidos para el formulario preoperacional
export interface DynamicPreoperationalFormData {
  toolName: string;
  toolType: string;
  toolCategory: string;
  checklistType: string;
  checks: ChecklistItem[];
  userId: number;
  createdBy: number;
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