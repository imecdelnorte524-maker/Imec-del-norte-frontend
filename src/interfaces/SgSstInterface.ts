// src/interfaces/SgSstInterface.ts

// =========================
// ENUMS / TIPOS BASE
// =========================
export type CheckValue = "GOOD" | "REGULAR" | "BAD" | "YES" | "NO";

export type TermsType =
  | "dataprivacy"
  | "ats"
  | "HEIGHT_WORK"
  | "PREOPERATIONAL";

export interface TermsAcceptancePayload {
  termsType: TermsType;
  termsVersion: number;
}

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

// =========================
// CATÁLOGOS BACKEND
// =========================
export interface AtsCatalogRisk {
  id: number;
  name: string;
  description?: string;
  displayOrder?: number;
  categoryId: number;
}

export interface AtsCatalogRiskCategory {
  id: number;
  code: string;
  name: string;
  displayOrder?: number;
  risks: AtsCatalogRisk[];
}

export interface AtsCatalogPpeItem {
  id: number;
  name: string;
  type: string;
  displayOrder?: number;
}

export interface AtsCatalogs {
  riskCategories: AtsCatalogRiskCategory[];
  ppeItems: AtsCatalogPpeItem[];
}

export interface HeightCatalogProtectionElement {
  id: number;
  name: string;
  displayOrder?: number;
}

export interface HeightCatalogs {
  protectionElements: HeightCatalogProtectionElement[];
}

// =========================
// PREOP TEMPLATE / PARÁMETROS
// =========================
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

export interface PreopChecklistTemplateResponse {
  id: number;
  toolType: string;
  toolCategory: string;
  version?: number;
  estimatedTime: number;
  additionalInstructions?: string;
  requiresTools?: string[];
  parameters: Array<{
    id: number;
    parameterCode?: string;
    parameter: string;
    description?: string;
    category: PreopParamCategory;
    required: boolean;
    critical: boolean;
    displayOrder: number;
  }>;
}

// =========================
// ATS
// =========================
export interface AtsFormData {
  workerName: string;
  workerIdentification?: string;
  position: string;
  area: string;
  subArea?: string;
  workToPerform: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  observations: string;

  riskIds: number[];
  ppeItemIds: number[];

  termsAcceptances: TermsAcceptancePayload[];

  userId: number;
  createdBy: number;
  workOrderId: number;
}

export interface AtsReport {
  id: number;
  formId: number;
  workerName: string;
  workerIdentification?: string;
  position?: string;
  area?: string;
  subArea?: string;
  workToPerform?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  observations?: string;
  clientName?: string;
  clientNit?: string;
  createdAt: string;

  risks?: Array<{
    id: number;
    riskId: number;
    risk?: {
      id: number;
      name: string;
      category?: {
        id: number;
        code: string;
        name: string;
      };
    };
  }>;

  ppeItems?: Array<{
    id: number;
    ppeItemId: number;
    ppeItem?: {
      id: number;
      name: string;
      type: string;
    };
  }>;

  form?: SgSstForm;
}

// =========================
// TRABAJO EN ALTURAS
// =========================
export interface HeightWorkFormData {
  workerName: string;
  identification?: string;
  position?: string;
  workDescription?: string;
  location?: string;
  estimatedTime?: string;

  protectionElementIds: number[];

  physicalCondition: boolean;
  instructionsReceived: boolean;
  fitForHeightWork: boolean;

  authorizerName?: string;
  authorizerIdentification?: string;

  termsAcceptances: TermsAcceptancePayload[];

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
  physicalCondition?: boolean;
  instructionsReceived?: boolean;
  fitForHeightWork?: boolean;
  authorizerName?: string;
  authorizerIdentification?: string;
  createdAt: string;

  protectionElements?: Array<{
    id: number;
    protectionElementId: number;
    protectionElement?: {
      id: number;
      name: string;
    };
  }>;

  form?: SgSstForm;
}

// =========================
// PREOPERACIONAL
// =========================
export interface PreoperationalCheckPayload {
  parameterId: number;
  value?: CheckValue;
  observations?: string;
}

export interface PreoperationalCheck {
  id: number;
  formId: number;
  templateId?: number;
  parameterId?: number;
  parameterSnapshot: string;
  parameterCodeSnapshot?: string;
  categorySnapshot?: string;
  requiredSnapshot: boolean;
  criticalSnapshot: boolean;
  value?: CheckValue;
  observations?: string;
  createdAt: string;
}

export interface PreoperationalFormData {
  templateId: number;
  equipmentTool?: string;
  checks: PreoperationalCheckPayload[];

  termsAcceptances: TermsAcceptancePayload[];

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

// =========================
// FIRMAS / FORM
// =========================
export interface Signature {
  id: number;
  formId: number;
  formVersion?: number;
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

export interface FormTermsAcceptance {
  id: number;
  formId: number;
  formVersion: number;
  termsType: TermsType;
  termsVersion: number;
  acceptedByUserId: number;
  acceptedAt: string;
}

export interface RejectFormPayload {
  userId: number;
  userName: string;
  reason?: string;
}

export interface SgSstForm {
  id: number;
  formType: FormType;
  status: FormStatus;
  equipmentTool?: string;
  version?: number;
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
  termsAcceptances?: FormTermsAcceptance[];

  rejectedByUserName?: string;
  rejectionReason?: string;
  rejectedAt?: string;

  pdfFileName?: string;
  pdfFilePath?: string;
  pdfFileSize?: number;
  pdfHash?: string;
  pdfGeneratedAt?: string;
}

// =========================
// RESPUESTAS API
// =========================
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
  data: SgSstForm;
}

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