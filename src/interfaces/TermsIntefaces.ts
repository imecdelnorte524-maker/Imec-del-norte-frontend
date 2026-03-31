// src/interfaces/TermsIntefaces.ts
export interface TermsData {
  id: number;
  type: string;
  title: string;
  description?: string;
  items: string[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTermsDto {
  type: string;
  title: string;
  description?: string;
  items: string[];
  isActive?: boolean;
}

export interface UpdateTermsDto {
  title?: string;
  description?: string;
  items?: string[];
  isActive?: boolean;
}
