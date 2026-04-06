// src/api/sg-sst.ts
import api from "./axios";
import type {
  AtsFormData,
  HeightWorkFormData,
  PreoperationalFormData,
  SignFormData,
  ApiResponse,
  FormsListResponse,
  FormDetailResponse,
  SgSstStats,
  RejectFormPayload,
  PreopChecklistTemplatePayload,
  PreopChecklistTemplateResponse,
  SignerType,
  AtsCatalogs,
  HeightCatalogs,
} from "../interfaces/SgSstInterface";

export const sgSstService = {
  // ========== FORMULARIOS ATS ==========
  createAts: async (data: AtsFormData): Promise<ApiResponse> => {
    const response = await api.post("/sg-sst/ats", data);
    return response.data;
  },

  updateAts: async (
    formId: number,
    data: AtsFormData,
  ): Promise<ApiResponse> => {
    const response = await api.put(`/sg-sst/forms/${formId}/ats`, data);
    return response.data;
  },

  // ========== TRABAJO EN ALTURAS ==========
  createHeightWork: async (
    data: HeightWorkFormData,
  ): Promise<ApiResponse> => {
    const response = await api.post("/sg-sst/height-work", data);
    return response.data;
  },

  updateHeightWork: async (
    formId: number,
    data: HeightWorkFormData,
  ): Promise<ApiResponse> => {
    const response = await api.put(`/sg-sst/forms/${formId}/height-work`, data);
    return response.data;
  },

  // ========== PREOPERACIONAL ==========
  createPreoperational: async (
    data: PreoperationalFormData,
  ): Promise<ApiResponse> => {
    const response = await api.post("/sg-sst/preoperational", data);
    return response.data;
  },

  updatePreoperational: async (
    formId: number,
    data: PreoperationalFormData,
  ): Promise<ApiResponse> => {
    const response = await api.put(
      `/sg-sst/forms/${formId}/preoperational`,
      data,
    );
    return response.data;
  },

  // ========== PREOP TEMPLATES ==========
  createPreoperationalTemplate: async (
    data: PreopChecklistTemplatePayload,
  ): Promise<ApiResponse> => {
    const response = await api.post("/sg-sst/preoperational-templates", data);
    return response.data;
  },

  updatePreoperationalTemplate: async (
    id: number,
    data: PreopChecklistTemplatePayload,
  ): Promise<ApiResponse> => {
    const response = await api.put(
      `/sg-sst/preoperational-templates/${id}`,
      data,
    );
    return response.data;
  },

  getPreoperationalTemplate: async (
    toolType: string,
  ): Promise<PreopChecklistTemplateResponse> => {
    const res = await api.get("/sg-sst/preoperational-templates/by-tool-type", {
      params: { toolType },
    });
    return res.data.data;
  },

  // ========== CATÁLOGOS ==========
  getAtsCatalogs: async (): Promise<ApiResponse<AtsCatalogs>> => {
    const response = await api.get("/sg-sst/catalogs/ats");
    return response.data;
  },

  getHeightsCatalogs: async (): Promise<ApiResponse<HeightCatalogs>> => {
    const response = await api.get("/sg-sst/catalogs/heights");
    return response.data;
  },

  // ========== FIRMAS ==========
  signForm: async (
    formId: number,
    data: SignFormData,
  ): Promise<ApiResponse> => {
    const response = await api.post(`/sg-sst/forms/${formId}/sign`, data);
    return response.data;
  },

  requestSignOtp: async (
    formId: number,
    signerType: SignerType,
  ): Promise<ApiResponse> => {
    const response = await api.post(
      `/sg-sst/forms/${formId}/request-sign-otp`,
      { signerType },
    );
    return response.data;
  },

  // ========== CONSULTAS ==========
  getAllForms: async (userId?: number): Promise<FormsListResponse> => {
    const params = userId ? { userId } : {};
    const response = await api.get("/sg-sst/forms", { params });
    return response.data;
  },

  getFormById: async (id: number): Promise<FormDetailResponse> => {
    const response = await api.get(`/sg-sst/forms/${id}`);
    return response.data;
  },

  getFormsByStatus: async (status: string): Promise<FormsListResponse> => {
    const response = await api.get(`/sg-sst/forms/status/${status}`);
    return response.data;
  },

  getFormsByType: async (type: string): Promise<FormsListResponse> => {
    const response = await api.get(`/sg-sst/forms/type/${type}`);
    return response.data;
  },

  // ========== UTILIDAD ==========
  canEditForm: async (
    formId: number,
    userId: number,
  ): Promise<ApiResponse<{ canEdit: boolean }>> => {
    const response = await api.get(`/sg-sst/forms/${formId}/can-edit`, {
      params: { userId },
    });
    return response.data;
  },

  downloadPdf: async (formId: number) => {
    const response = await api.get(`/sg-sst/forms/${formId}/download-pdf`, {
      responseType: "blob",
    });
    return response;
  },

  // ========== RECHAZO / LEGACY ==========
  rejectForm: async (
    formId: number,
    data: RejectFormPayload,
  ): Promise<ApiResponse> => {
    const response = await api.post(`/sg-sst/forms/${formId}/reject`, data);
    return response.data;
  },

  authorizeHeightWork: async (formId: number, authorizationData: any) => {
    const response = await api.post(
      `/sg-sst/forms/${formId}/authorize-height-work`,
      authorizationData,
    );
    return response.data;
  },

  // ========== DASHBOARD ==========
  getDashboardStats: async (
    userId?: number,
  ): Promise<ApiResponse<SgSstStats>> => {
    const params = userId ? { userId } : {};
    const response = await api.get("/sg-sst/dashboard/stats", { params });
    return response.data;
  },
};

export default sgSstService;