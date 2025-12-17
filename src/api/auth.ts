// src/api/auth.ts
import type { LoginData, LoginResponse, User } from "../interfaces/AuthInterfaces";
import api from './axios';
import axios from "axios";

export const loginRequest = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', data);

    return {
      ...response.data,
      token: response.data.access_token
    };
  } catch (error: unknown) {
    console.error('❌ [API-ERROR] Error en login request:', error);

    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error en el servidor');
    }

    throw new Error('Error inesperado en el servidor');
  }
};

export const getProfileRequest = async (): Promise<{ user: User }> => {
  try {
    const response = await api.get('/auth/profile');

    return { user: response.data };
  } catch (error: unknown) {
    console.error('❌ [API-PROFILE-ERROR] Error obteniendo perfil:', error);

    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Error al obtener perfil');
    }

    throw new Error('Error inesperado al obtener perfil');
  }
};