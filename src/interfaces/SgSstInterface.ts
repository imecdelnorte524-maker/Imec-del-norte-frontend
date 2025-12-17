// En src/interface/SgSstInterface.ts
export interface SgSstForm {
  id: number;
  formType: 'ATS' | 'HEIGHT_WORK' | 'PREOPERATIONAL';
  status: 'DRAFT' | 'PENDING_SST' | 'COMPLETED';
  toolName?: string;
  createdAt: string;
  technicianSignatureDate?: string;
  sstSignatureDate?: string;
  userId: number;
  createdBy: number;
  updatedAt: string;
  // Información del usuario
  user?: {
    usuarioId: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  // Datos específicos del formulario
  atsReport?: AtsReport;
  heightWork?: HeightWork;
  preoperationalChecks?: PreoperationalCheck[];
  signatures?: Signature[];
}

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
  signatureData?: string;
  signerType?: 'TECHNICIAN' | 'SST';
  userName?: string;
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

// Tipos para Trabajo en Alturas
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
  signatureData: string; 
  signerType: 'TECHNICIAN' | 'SST'; 
  userName: string; 
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

// Tipos para Preoperacional
export type CheckValue = 'GOOD' | 'BAD' | 'YES' | 'NO';

export interface PreoperationalCheck {
  id: number;
  formId: number;
  parameter: string;
  value?: CheckValue;
  observations?: string;
  createdAt: string;
}

export interface PreoperationalFormData {
  toolName?: string;
  checks: Omit<PreoperationalCheck, 'id' | 'formId' | 'createdAt'>[];
  userId: number;
  createdBy: number;
  signatureData: string;
  signerType: 'TECHNICIAN' | 'SST';
  userName: string;
}

export interface PreoperationalForm {
  id: number;
  toolName?: string;
  checks: PreoperationalCheck[];
  form: SgSstForm;
}

// Tipos para Firmas
export type SignatureType = 'TECHNICIAN' | 'SST';

export interface Signature {
  id: number;
  formId: number;
  signatureType: SignatureType;
  userId: number;
  userName: string;
  signatureData?: string;
  signedAt: string;
}

export interface SignFormData {
  signerType: SignatureType;
  userId: number;
  userName: string;
  signatureData?: string;
}

// Tipos para PDFs generados
export interface GeneratedPdf {
  id: number;
  formId: number;
  fileName: string;
  filePath?: string;
  fileSize: number;
  generatedAt: string;
}

// Tipos para respuestas de API
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
    generatedPdfs?: GeneratedPdf[];
  };
}

// Tipos para estadísticas del dashboard
export interface SgSstStats {
  total: number;
  draft: number;
  pendingSst: number;
  completed: number;
  byType: {
    ats: number;
    heightWork: number;
    preoperational: number;
  };
}

// Enums para uso en componentes
export const FormType = {
  ATS: 'ATS',
  HEIGHT_WORK: 'HEIGHT_WORK',
  PREOPERATIONAL: 'PREOPERATIONAL'
} as const

export const FormStatus = {
  DRAFT: 'DRAFT',
  PENDING_SST: 'PENDING_SST',
  COMPLETED: 'COMPLETED'
} as const

export const SignerType = {
  TECHNICIAN: 'TECHNICIAN',
  SST: 'SST'
} as const

export type FormType = typeof FormType[keyof typeof FormType];

export type FormStatus = typeof FormStatus[keyof typeof FormStatus];

export type SignerType = typeof SignerType[keyof typeof SignerType];