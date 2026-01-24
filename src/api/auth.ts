import type { LoginData, LoginResponse, User } from "../interfaces/AuthInterfaces";
import api from "./axios";
import axios from "axios";

export const loginRequest = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await api.post("/auth/login", data);

    return {
      ...response.data,
      token: response.data.access_token,
    };
  } catch (error: unknown) {
    console.error("❌ [API-ERROR] Error en login request:", error);

    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Error en el servidor");
    }

    throw new Error("Error inesperado en el servidor");
  }
};

export const getProfileRequest = async (): Promise<{ user: User }> => {
  try {
    const response = await api.get("/auth/profile");

    return { user: response.data };
  } catch (error: unknown) {
    console.error("❌ [API-PROFILE-ERROR] Error obteniendo perfil:", error);

    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Error al obtener perfil");
    }

    throw new Error("Error inesperado al obtener perfil");
  }
};

// Solicitar enlace de recuperación
export const requestPasswordResetRequest = async (
  email: string
): Promise<{ message: string }> => {
  try {
    const response = await api.post("/auth/request-password-reset", { email });
    return response.data;
  } catch (error: unknown) {
    console.error("❌ [API-ERROR] Error en requestPasswordReset:", error);

    if (axios.isAxiosError(error)) {
      const data: any = error.response?.data;
      const msg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        data?.error ||
        "Error al solicitar recuperación de contraseña";

      throw new Error(msg);
    }

    throw new Error("Error inesperado al solicitar recuperación de contraseña");
  }
};

// Resetear contraseña con token
export const resetPasswordRequest = async (
  token: string,
  password: string
): Promise<{ message: string }> => {
  try {
    const response = await api.post("/auth/reset-password", { token, password });
    return response.data;
  } catch (error: unknown) {
    console.error("❌ [API-ERROR] Error en resetPassword:", error);

    if (axios.isAxiosError(error)) {
      const data: any = error.response?.data;
      const msg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        data?.error ||
        "Error al actualizar la contraseña";

      throw new Error(msg);
    }

    throw new Error("Error inesperado al actualizar la contraseña");
  }
};

// Cambiar contraseña (requiere estar autenticado)
export const changePasswordRequest = async (
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("❌ [API-ERROR] Error en changePassword:", error);

    if (axios.isAxiosError(error)) {
      const data: any = error.response?.data;
      const msg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        data?.error ||
        "Error al cambiar la contraseña";

      throw new Error(msg);
    }

    throw new Error("Error inesperado al cambiar la contraseña");
  }
};