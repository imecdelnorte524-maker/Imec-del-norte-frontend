// src/interfaces/SgSstInterface.ts

export interface SgSstForm {
  id: number;
  formType: FormType;
  status: FormStatus;
  toolName?: string;
  createdAt: string;
  technicianSignatureDate?: string;
  sstSignatureDate?: string;
  userId: number;
  createdBy: number;
  updatedAt: string;
  user?: {
    usuarioId: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  atsReport?: AtsReport;
  heightWork?: HeightWork;
  preoperationalChecks?: PreoperationalCheck[];
  signatures?: Signature[];
  rejectedByUserName?: string;
  rejectionReason?: string;
  rejectedAt?: string;

  // Campos para PDF
  pdfFileName?: string;
  pdfFilePath?: string;
  pdfFileSize?: number;
  pdfHash?: string;
  pdfGeneratedAt?: string;
}

export type PreopParamCategory =
  | "safety"
  | "functional"
  | "visual"
  | "operational"
  | "electrical";

export interface PreopChecklistParameterPayload {
  parameterCode?: string;
  parameter: string;
  description?: string;
  category: PreopParamCategory;
  required: boolean;
  critical: boolean;
  displayOrder?: number;
}

export interface PreopChecklistTemplatePayload {
  toolType: string;
  toolCategory: string;
  estimatedTime?: number;
  additionalInstructions?: string;
  requiresTools?: string[];
  parameters: PreopChecklistParameterPayload[];
}

export interface RejectFormPayload {
  userId: number;
  userName: string;
  reason?: string;
}

// ====== ATS ======

export interface AtsFormData {
  workerName: string;
  workerIdentification?: string;
  position: string;

  clientId?: number;
  clientName?: string;
  clientNit?: string;

  area: string;
  subArea?: string;
  workToPerform: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  observations: string;
  selectedRisks: Record<string, string[]>;
  requiredPpe: Record<string, boolean>;
  userId: number;
  createdBy: number;
  workOrderId: number;
}

export interface AtsReport {
  id: number;
  formId: number;
  workerName: string;
  position?: string;
  area?: string;
  workToPerform?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  observations?: string;
  selectedRisks?: Record<string, any>;
  requiredPpe?: Record<string, any>;
  createdAt: string;
  form?: SgSstForm;
}

// ====== Trabajo en Alturas ======

export interface HeightWorkFormData {
  workerName: string;
  identification?: string;
  position?: string;
  workDescription?: string;
  location?: string;
  estimatedTime?: string;
  protectionElements?: Record<string, any>;
  physicalCondition?: boolean;
  instructionsReceived?: boolean;
  fitForHeightWork?: boolean;
  authorizerName?: string;
  authorizerIdentification?: string;

  userId: number;
  createdBy: number;
  workOrderId: number;
}

export interface HeightWork {
  id: number;
  formId: number;
  workerName: string;
  identification?: string;
  position?: string;
  workDescription?: string;
  location?: string;
  estimatedTime?: string;
  protectionElements?: Record<string, any>;
  physicalCondition?: boolean;
  instructionsReceived?: boolean;
  fitForHeightWork?: boolean;
  authorizerName?: string;
  authorizerIdentification?: string;
  createdAt: string;
  form?: SgSstForm;
}

// ====== Preoperacional ======

export type CheckValue = "GOOD" | "REGULAR" | "BAD" | "YES" | "NO";

export interface PreoperationalCheck {
  id: number;
  formId: number;
  parameter: string;
  value?: CheckValue;
  observations?: string;
  createdAt: string;
}

export interface PreoperationalFormData {
  equipmentTool?: string;
  checks: Omit<PreoperationalCheck, "id" | "formId" | "createdAt">[];
  userId: number;
  createdBy: number;
  workOrderId: number;
}

export interface PreoperationalForm {
  id: number;
  toolName?: string;
  checks: PreoperationalCheck[];
  form: SgSstForm;
}

export interface Signature {
  id: number;
  formId: number;
  signatureType: SignerType;
  userId: number;
  userName: string;
  signatureData?: string;
  signedAt: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  contactSnapshot?: string;
}

export interface SignFormData {
  signerType: SignerType;
  signatureData?: string;
  otpCode: string;
}

// ====== Respuestas de API ======

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  count?: number;
}

export interface FormsListResponse {
  success: boolean;
  data: SgSstForm[];
  count: number;
}

export interface FormDetailResponse {
  success: boolean;
  data: SgSstForm & {
    atsReport?: AtsReport;
    heightWork?: HeightWork;
    preoperationalChecks?: PreoperationalCheck[];
    signatures?: Signature[];
  };
}

// ====== Estadísticas SG-SST ======

export interface SgSstStats {
  total: number;
  draft: number;
  pendingSst: number;
  completed: number;
  rejected: number;
  byType: {
    ats: number;
    heightWork: number;
    preoperational: number;
  };
}

// ====== Enums frontend ======

export const FormType = {
  ATS: "ATS",
  HEIGHT_WORK: "HEIGHT_WORK",
  PREOPERATIONAL: "PREOPERATIONAL",
} as const;

export const FormStatus = {
  DRAFT: "DRAFT",
  PENDING_SST: "PENDING_SST",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const;

export const SignerType = {
  TECHNICIAN: "TECHNICIAN",
  SST: "SST",
} as const;

export type FormType = (typeof FormType)[keyof typeof FormType];
export type FormStatus = (typeof FormStatus)[keyof typeof FormStatus];
export type SignerType = (typeof SignerType)[keyof typeof SignerType];
